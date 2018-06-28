const exec = require('child_process').exec;
const fs = require('fs-extra');
const path = require('path');

const strapiBin = path.resolve('./packages/strapi/bin/strapi.js');
const appName = 'testApp';
let appStart;

const databases = {
  mongo: `--dbclient=mongo --dbhost=127.0.0.1 --dbport=27017 --dbname=strapi-test-${new Date().getTime()} --dbusername="" --dbpassword=""`,
  postgres: `--dbclient=postgres --dbhost=127.0.0.1 --dbport=5432 --dbname=strapi-test --dbusername="" --dbpassword=""`,
  mysql: `--dbclient=mysql --dbhost=127.0.0.1 --dbport=3306 --dbname=strapi-test --dbusername="root" --dbpassword="root"`
};

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

  const generate = (database) => {
    return new Promise((resolve, reject) => {
      const appCreation = exec(
        `node ${strapiBin} new ${appName} --dev ${database}`,
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
      try {
        appStart = exec(
          `node ${strapiBin} start ${appName}`,
        );

        appStart.stdout.on('data', data => {
          console.log(data.toString());

          if (data.includes('To shut down your server')) {
            return resolve();
          }
        });

      } catch (e) {
        console.error(e);
      }
    });
  };

  const test = () => {
    return new Promise(async (resolve) => {
      // Run setup tests to generate the app.
      await jest({
        passWithNoTests: true
      }, [process.cwd()]);

      const packages = fs.readdirSync(path.resolve(process.cwd(), 'packages'))
        .filter(file => file.indexOf('strapi') !== -1);

      // Run tests in every packages.
      for (let i in packages) {
        await jest({
          passWithNoTests: true,
        }, [`${process.cwd()}/packages/${packages[i]}`]);
      }

      resolve();
    });
  };

  const testProcess = async (database) => {
    await clean();
    await generate(database);
    await start();
    await test();

    appStart.kill();
  };

  await testProcess(databases.mongo);
  await testProcess(databases.postgres);
  await testProcess(databases.mysql);
};

main();
