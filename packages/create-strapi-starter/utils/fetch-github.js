'use strict';

const tar = require('tar');
const axios = require('axios');
const parseGitUrl = require('git-url-parse');
const chalk = require('chalk');

const stopProcess = require('./stop-process');

function parseShorthand(starter) {
  // Determine if it is comes from another owner
  if (starter.includes('/')) {
    const [owner, partialName] = starter.split('/');
    const name = `strapi-starter-${partialName}`;
    return {
      name,
      fullName: `${owner}/${name}`,
    };
  }

  const name = `strapi-starter-${starter}`;
  return {
    name,
    fullName: `strapi/${name}`,
  };
}

/**
 * @param {string} repo The full name of the repository.
 */
async function getDefaultBranch(repo) {
  try {
    const {
      data: { default_branch },
    } = await axios.get(`https://api.github.com/repos/${repo}`);

    return default_branch;
  } catch (error) {
    stopProcess(
      `Could not find the starter information for ${chalk.yellow(
        repo
      )}. Make sure it is publicly accessible on github.`
    );
  }
}

/**
 * @param {string} starter GitHub URL or shorthand to a starter project.
 */
async function getRepoInfo(starter) {
  const { name, full_name: fullName, ref, filepath, protocols, source } = parseGitUrl(starter);

  if (protocols.length === 0) {
    const repoInfo = parseShorthand(starter);
    return {
      ...repoInfo,
      branch: await getDefaultBranch(repoInfo.fullName),
      usedShorthand: true,
    };
  }

  if (source !== 'github.com') {
    stopProcess(`GitHub URL not found for: ${chalk.yellow(starter)}.`);
  }

  let branch;
  if (ref) {
    // Append the filepath to the parsed ref since a branch name could contain '/'
    // If so, the rest of the branch name will be considered 'filepath' by 'parseGitUrl'
    branch = filepath ? `${ref}/${filepath}` : ref;
  } else {
    branch = await getDefaultBranch(fullName);
  }

  return { name, fullName, branch };
}

/**
 * @param {string} repoInfo GitHub repository information (full name, branch...).
 * @param {string} tmpDir Path to the destination temporary directory.
 */
async function downloadGitHubRepo(repoInfo, tmpDir) {
  const { fullName, branch, usedShorthand } = repoInfo;

  try {
    // Download from GitHub
    const codeload = `https://codeload.github.com/${fullName}/tar.gz/${branch}`;
    const { data } = await axios({
      url: codeload,
      method: 'GET',
      responseType: 'stream',
    });

    await new Promise(resolve => {
      data.pipe(tar.extract({ strip: 1, cwd: tmpDir })).on('close', resolve);
    });
  } catch (error) {
    const message = usedShorthand ? `using the shorthand` : `using the url`;
    stopProcess(`Could not download the repository ${message}: ${chalk.yellow(fullName)}.`);
  }
}

module.exports = { getRepoInfo, downloadGitHubRepo };
