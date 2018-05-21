const exec = require('child_process').exec;
const fs = require('fs-extra');
const path = require('path');

const strapiBin = path.resolve('./packages/strapi/bin/strapi.js');
const appName = 'testApp';
let appStart;

const {runCLI: jest} = require('jest-cli/build/cli');

const main = async () => {
  const clean = () => {
    return new Promise((resolve) => {
      fs.exists(appName, exists => {
        if (exists) {
          fs.removeSync(appName);
        }

        resolve();
      });
    });
  };

  const generate = () => {
    return new Promise((resolve) => {
      const appCreation = exec(
        `node ${strapiBin} new ${appName} --dev --dbclient=mongo --dbhost=localhost --dbport=27017 --dbname=strapi-test-${new Date().getTime()} --dbusername="" --dbpassword=""`,
      );

      appCreation.stdout.on('data', data => {
        console.log(data.toString());

        if (data.includes('is ready at')) {
          appCreation.kill();
          return resolve();
        }

        if (data.includes('Database connection has failed')) {
          appCreation.kill();
          return reject();
        }
      });
    });
  };

  const start = () => {
    return new Promise((resolve) => {
      appStart = exec(
        `node ${strapiBin} start ${appName}`,
      );

      appStart.stdout.on('data', data => {
        console.log(data.toString());

        if (data.includes('To shut down your server')) {
          return resolve();
        }
      });
    });
  };

  const test = () => {
    console.log('Launch test suits');
    return new Promise(async (resolve) => {
      const options = {
        projects: [process.cwd()],
        silent: false
      };

      await jest(options, options.projects);

      resolve();
    });
  };

  await clean();
  await generate();
  await start();
  await test();

  appStart.kill();
};

main();
