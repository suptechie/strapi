'use strict';

const inquirer = require('inquirer');

/**
 * argsParser: Parse a comma-delimited string as an array
 */
const parseInputList = (value) => {
  return value.split(',');
};

/**
 * hook: if encrypt==true and key not provided, prompt for it
 */
const promptEncryptionKey = async (thisCommand) => {
  const opts = thisCommand.opts();

  if (!opts.encrypt && opts.key) {
    console.error('Key may not be present unless encryption is used');
    process.exit(1);
  }

  // if encrypt==true but we have no key, prompt for it
  if (opts.encrypt && !(opts.key && opts.key.length > 0)) {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'password',
          message: 'Please enter an encryption key',
          name: 'key',
          validate(key) {
            if (key.length > 0) return true;

            return 'Key must be present when using the encrypt option';
          },
        },
      ]);
      opts.key = answers.key;
    } catch (e) {
      console.error('Failed to get encryption key');
      process.exit(1);
    }
    if (!opts.key) {
      console.error('Failed to get encryption key');
      process.exit(1);
    }
  }
};

/**
 * hook: confirm that key has a value with a provided message
 */
const confirmKeyValue = (key, value, message) => {
  return async (thisCommand) => {
    const opts = thisCommand.opts();

    if (!opts[key] || opts[key] !== value) {
      console.error(`Could not confirm key ${key}, halting operation.`);
      process.exit(1);
    }
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        message,
        name: `confirm_${key}`,
        default: false,
      },
    ]);
    if (!answers[`confirm_${key}`]) {
      process.exit(0);
    }
  };
};

module.exports = {
  parseInputList,
  promptEncryptionKey,
  confirmKeyValue,
};
