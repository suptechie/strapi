'use strict';

// Dependencies.
const glob = require('glob');
const path = require('path');
const utils = require('../utils');
const { parallel } = require('async');
const { upperFirst, lowerFirst } = require('lodash');

module.exports = function() {
  this.middleware = {};
  this.koaMiddlewares = {};

  return Promise.all([
    new Promise((resolve, reject) => {
      glob(
        './node_modules/*(koa-*|kcors)',
        {
          cwd: path.resolve(__dirname, '..', '..')
        },
        (err, files) => {
          if (err) {
            return reject(err);
          }

          parallel(
            files.map(p => cb => {
              const extractStr = p
                .split('/')
                .pop()
                .replace(/^koa(-|\.)/, '')
                .split('-');

              const name = lowerFirst(
                extractStr.length === 1
                  ? extractStr[0]
                  : extractStr.map(p => upperFirst(p)).join('')
              );

              // Lazy loading.
              Object.defineProperty(this.koaMiddlewares, name, {
                configurable: false,
                enumerable: true,
                get: () => require(path.resolve(__dirname, '..', '..', p))
              });

              cb();
            }),
            err => {
              if (err) {
                return reject(err);
              }

              resolve();
            }
          );
        }
      );
    }),
    new Promise((resolve, reject) => {
      const cwd = path.resolve(__dirname, '..', 'middlewares');

      glob(
        './!(index.js|responses)',
        {
          cwd
        },
        (err, files) => {
          if (err) {
            return reject(err);
          }

          mountMiddlewares.call(this, files, cwd)(resolve, reject);
        }
      );
    }),
    new Promise((resolve, reject) => {
      const cwd = path.resolve(process.cwd(), 'middlewares');

      glob(
        './*',
        {
          cwd
        },
        (err, files) => {
          if (err) {
            return reject(err);
          }

          mountMiddlewares.call(this, files, cwd)(resolve, reject);
        }
      );
    })
  ]);
};

const mountMiddlewares = function (files, cwd) {
  return (resolve, reject) =>
    parallel(
      files.map(p => cb => {
        const name = p.split('/')[1];

        this.middleware[name] = {
          loaded: false
        };

        // Lazy loading.
        Object.defineProperty(this.middleware[name], 'load', {
          configurable: false,
          enumerable: true,
          get: () => require(path.resolve(cwd, p))(this)
        });

        cb();
      }),
      err => {
        if (err) {
          return reject(err);
        }

        resolve();
      }
    );
};
