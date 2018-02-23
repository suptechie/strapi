'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const fs = require('fs');
const path = require('path');

module.exports = {
  provider: 'local',
  name: 'Local server',
  init: (strapi, config) => {
    return {
      upload: (file) => {
        return new Promise((resolve, reject) => {
          // write file in public/assets folder
          fs.writeFile(path.join(strapi.config.appPath, 'public', `uploads/${file.hash}${file.ext}`), file.buffer, (err) => {
            if (err) {
              return reject(err);
            }

            file.url = `/uploads/${file.hash}${file.ext}`;

            resolve();
          });
        });
      },
      delete: (file) => {
        return new Promise((resolve, reject) => {
          const filePath = path.join(strapi.config.appPath, 'public', `uploads/${file.hash}${file.ext}`);

          if (!fs.existsSync(filePath)) {
            return resolve('File doesn\'t exist');
          }

          // remove file from public/assets folder
          fs.unlink(filePath, (err) => {
            if (err) {
              return reject(err);
            }

            resolve();
          });
        });
      }
    };
  }
};
