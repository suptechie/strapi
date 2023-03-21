'use strict';

/**
 * Module dependencies
 */

/* eslint-disable no-unused-vars */
// Public node modules.
const _ = require('lodash');
const AWS = require('aws-sdk');

function assertUrlProtocol(url) {
  // Regex to test protocol like "http://", "https://"
  return /^\w*:\/\//.test(url);
}

module.exports = {
  init({ baseUrl = null, rootPath = null, s3Options, ...legacyS3Options }) {
    if (legacyS3Options) {
      process.emitWarning(
        "S3 configuration options passed at root level of the plugin's providerOptions is deprecated and will be removed in a future release. Please wrap them inside the 's3Options:{}' property."
      );
    }

    const S3 = new AWS.S3({
      apiVersion: '2006-03-01',
      ...s3Options,
      ...legacyS3Options,
    });

    const filePrefix = rootPath ? `${rootPath.replace(/\/+$/, '')}/` : '';

    const getFileKey = (file) => {
      const path = file.path ? `${file.path}/` : '';

      return `${filePrefix}${path}${file.hash}${file.ext}`;
    };

    const upload = (file, customParams = {}) =>
      new Promise((resolve, reject) => {
        // upload file on S3 bucket
        const fileKey = getFileKey(file);
        S3.upload(
          {
            Key: fileKey,
            Body: file.stream || Buffer.from(file.buffer, 'binary'),
            ACL: 'public-read',
            ContentType: file.mime,
            ...customParams,
          },
          (err, data) => {
            if (err) {
              return reject(err);
            }

            // set the bucket file url
            if (assertUrlProtocol(data.Location)) {
              file.url = baseUrl ? `${baseUrl}/${fileKey}` : data.Location;
            } else {
              // Default protocol to https protocol
              file.url = `https://${data.Location}`;
            }

            resolve();
          }
        );
      });

    return {
      uploadStream(file, customParams = {}) {
        return upload(file, customParams);
      },
      upload(file, customParams = {}) {
        return upload(file, customParams);
      },
      delete(file, customParams = {}) {
        return new Promise((resolve, reject) => {
          // delete file on S3 bucket
          const fileKey = getFileKey(file);
          S3.deleteObject(
            {
              Key: fileKey,
              ...customParams,
            },
            (err) => {
              if (err) {
                return reject(err);
              }

              resolve();
            }
          );
        });
      },
    };
  },
};
