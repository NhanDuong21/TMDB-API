const zlib = require('zlib');
const readline = require('readline');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const config = require('../config/config');

const DATA_DIR = path.join(__dirname, '../../data');
const LOCAL_EXPORT_FILE = path.join(DATA_DIR, 'movie_ids.json.gz');

class TmdbExportStreamService {
  
  /**
   * Generates the export file date string (MM_DD_YYYY).
   * TMDB daily exports usually generated around 8 AM UTC.
   */
  getExportDateString(date = new Date()) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}_${day}_${year}`;
  }

  /**
   * Downloads the TMDB export file and saves it locally.
   * Includes an auto-retry mechanism for network failures.
   */
  async downloadExportFile(maxRetries = 3) {
    let date = new Date();
    
    // Check if the file exists and was downloaded today
    if (fs.existsSync(LOCAL_EXPORT_FILE)) {
      const stats = fs.statSync(LOCAL_EXPORT_FILE);
      const mtime = stats.mtime;
      if (
        mtime.getDate() === date.getDate() &&
        mtime.getMonth() === date.getMonth() &&
        mtime.getFullYear() === date.getFullYear()
      ) {
        console.log(`[TMDB Export Stream] Export file already downloaded today (${mtime.toISOString().split('T')[0]}). Skipping download.`);
        return;
      }
    }

    let attempt = 0;
    
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    while (attempt <= maxRetries) {
      try {
        await this._downloadFile(date);
        console.log(`[TMDB Export Stream] Export file successfully downloaded to ${LOCAL_EXPORT_FILE}`);
        return; // Success, exit the loop
      } catch (error) {
        // If it's a 404/403, we fallback to yesterday's date ONCE
        if (error.status === 404 || error.status === 403) {
          console.warn(`[TMDB Export Stream] Export for today (${this.getExportDateString(date)}) not found. Falling back to yesterday.`);
          date.setDate(date.getDate() - 1);
          try {
            await this._downloadFile(date);
            console.log(`[TMDB Export Stream] Yesterday's export file successfully downloaded to ${LOCAL_EXPORT_FILE}`);
            return; // Success on yesterday's file
          } catch (fallbackError) {
            error = fallbackError; // If fallback also fails (e.g. network drops), we let the retry catch it
          }
        }

        attempt++;
        if (attempt > maxRetries) {
          throw error; // Give up after maxRetries
        }

        console.warn(`[TMDB Export Stream] Download failed: ${error.message}. Retrying attempt ${attempt}/${maxRetries} in 5 seconds...`);
        await wait(5000); // Wait 5 seconds before retrying
      }
    }
  }

  _downloadFile(date) {
    return new Promise((resolve, reject) => {
      const dateString = this.getExportDateString(date);
      const url = `${config.tmdb.exportBaseUrl}/movie_ids_${dateString}.json.gz`;
      
      console.log(`[TMDB Export Stream] Fetching daily export from: ${url}`);
      const protocol = url.startsWith('https') ? https : http;
      
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      protocol.get(url, (res) => {
        // TMDB uses AWS S3 which returns 403 Forbidden instead of 404 when a file doesn't exist
        if (res.statusCode === 404 || res.statusCode === 403) {
          return reject({ status: 404, message: 'Export not found or not yet generated for today' });
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to fetch TMDB export: ${res.statusCode}`));
        }

        const fileStream = fs.createWriteStream(LOCAL_EXPORT_FILE);

        pipeline(
          res,
          fileStream,
          (err) => {
            if (err) {
              fs.unlink(LOCAL_EXPORT_FILE, () => reject(err));
            } else {
              resolve();
            }
          }
        );
      }).on('error', (err) => {
        fs.unlink(LOCAL_EXPORT_FILE, () => reject(err));
      });
    });
  }

  /**
   * Reads from the locally downloaded file.
   */
  async getMovieIds(cursor = 0, limit = 20) {
    if (!fs.existsSync(LOCAL_EXPORT_FILE)) {
      console.log('[TMDB Export Stream] Local export file not found. Automatically downloading before streaming...');
      await this.downloadExportFile();
    }
    console.log(`[TMDB Export Stream] Reading local export file from cursor: ${cursor}, limit: ${limit}`);
    return await this._streamExportLocal(cursor, limit);
  }

  _streamExportLocal(cursor, limit) {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(LOCAL_EXPORT_FILE);
      const gunzip = zlib.createGunzip();
      
      // Prevent Z_BUF_ERROR when we intentionally destroy the stream early
      gunzip.on('error', (err) => {
        if (fileStream.destroyed && err.code === 'Z_BUF_ERROR') {
          return; // Ignore
        }
        reject(err);
      });

      fileStream.pipe(gunzip);

      const rl = readline.createInterface({
        input: gunzip,
        crlfDelay: Infinity
      });

      let currentLine = 0;
      const results = [];
      let hasMore = true;

      rl.on('line', (line) => {
        if (currentLine >= cursor && currentLine < cursor + limit) {
          try {
            const parsed = JSON.parse(line);
            results.push(parsed.id);
          } catch (e) {
            console.warn('Failed to parse line:', line);
          }
        }
        currentLine++;

        if (currentLine >= cursor + limit) {
          // We got all we need, abort to save CPU
          hasMore = true;
          rl.close();
          fileStream.destroy(); // Stop reading the file early
          resolve({ ids: results, hasMore, totalRead: currentLine });
        }
      });

      rl.on('close', () => {
        // If we reach here without aborting, we hit the end of the file
        if (!fileStream.destroyed) {
          hasMore = false;
          resolve({ ids: results, hasMore, totalRead: currentLine });
        }
      });

      rl.on('error', (err) => {
        reject(err);
      });
      
      fileStream.on('error', (err) => {
        reject(err);
      });
    });
  }
}

module.exports = new TmdbExportStreamService();
