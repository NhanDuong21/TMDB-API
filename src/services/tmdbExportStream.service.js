const zlib = require('zlib');
const readline = require('readline');
const http = require('http');
const https = require('https');
const config = require('../config/config');

class TmdbExportStreamService {
  
  /**
   * Generates the export file date string (MM_DD_YYYY).
   * TMDB daily exports usually generated around 8 AM UTC.
   * If not available, we can fallback to yesterday.
   */
  getExportDateString(date = new Date()) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}_${day}_${year}`;
  }

  /**
   * Fetches the exported movie IDs. Streams and parses the gzip,
   * skipping the first `cursor` records, returning `limit` records.
   * It immediately aborts the HTTP request once the limit is reached to save memory/bandwidth.
   */
  async getMovieIds(cursor = 0, limit = 20) {
    let date = new Date();
    try {
      return await this._streamExport(date, cursor, limit);
    } catch (error) {
      if (error.status === 404) {
        // Fallback to yesterday if today's export is not ready
        console.warn(`Export for today (${this.getExportDateString(date)}) not found. Falling back to yesterday.`);
        date.setDate(date.getDate() - 1);
        return await this._streamExport(date, cursor, limit);
      }
      throw error;
    }
  }

  _streamExport(date, cursor, limit) {
    return new Promise((resolve, reject) => {
      const dateString = this.getExportDateString(date);
      const url = `${config.tmdb.exportBaseUrl}/movie_ids_${dateString}.json.gz`;
      
      const protocol = url.startsWith('https') ? https : http;
      
      const req = protocol.get(url, (res) => {
        if (res.statusCode === 404) {
          req.destroy();
          return reject({ status: 404, message: 'Export not found' });
        }
        if (res.statusCode !== 200) {
          req.destroy();
          return reject(new Error(`Failed to fetch TMDB export: ${res.statusCode}`));
        }

        const gunzip = zlib.createGunzip();
        res.pipe(gunzip);

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
            // We got all we need, abort to save bandwidth
            hasMore = true;
            rl.close();
            req.destroy(); // Destroy the connection
            resolve({ ids: results, hasMore, totalRead: currentLine });
          }
        });

        rl.on('close', () => {
          // If we reach here without aborting, we hit the end of the file
          if (!req.destroyed) {
            hasMore = false;
            resolve({ ids: results, hasMore, totalRead: currentLine });
          }
        });

        rl.on('error', (err) => {
          reject(err);
        });
      });

      req.on('error', (err) => {
        reject(err);
      });
    });
  }
}

module.exports = new TmdbExportStreamService();
