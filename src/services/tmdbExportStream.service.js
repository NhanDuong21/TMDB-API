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
   */
  async downloadExportFile() {
    let date = new Date();
    try {
      await this._downloadFile(date);
    } catch (error) {
      if (error.status === 404) {
        // Fallback to yesterday if today's export is not ready
        console.warn(`Export for today (${this.getExportDateString(date)}) not found. Falling back to yesterday.`);
        date.setDate(date.getDate() - 1);
        await this._downloadFile(date);
      } else {
        throw error;
      }
    }
  }

  _downloadFile(date) {
    return new Promise((resolve, reject) => {
      const dateString = this.getExportDateString(date);
      const url = `${config.tmdb.exportBaseUrl}/movie_ids_${dateString}.json.gz`;
      
      const protocol = url.startsWith('https') ? https : http;
      
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      protocol.get(url, (res) => {
        if (res.statusCode === 404) {
          return reject({ status: 404, message: 'Export not found' });
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
      throw new Error("Local export file not found. Please call /api/tmdb/download-export first.");
    }
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
