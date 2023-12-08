/* eslint-disable @typescript-eslint/no-var-requires */

import assert from 'node:assert';
import fse from 'fs-extra';
import { isEqual } from 'lodash/fp';
import { register } from 'esbuild-register/dist/node';

import { createJSONTransformAPI } from './transform-api';

import type { Report } from '../../report';

import type { JSONRunnerConfiguration, JSONSourceFile, JSONTransformParams } from './types';

export const transformJSON = async (
  codemodPath: string,
  paths: string[],
  config: JSONRunnerConfiguration
): Promise<Report.Report> => {
  const { dry } = config;
  const startTime = process.hrtime();

  const report: Report.Report = {
    ok: 0,
    nochange: 0,
    skip: 0,
    error: 0,
    timeElapsed: '',
    stats: {},
  };

  const esbuildOptions = { extensions: ['.js', '.mjs', '.ts'] };
  const { unregister } = register(esbuildOptions);

  const module = require(codemodPath);

  unregister();

  const codemod = typeof module.default === 'function' ? module.default : module;

  assert(typeof codemod === 'function', `Codemod must be a function. Found ${typeof codemod}`);

  for (const path of paths) {
    try {
      const json = require(path);
      // TODO: Optimize the API to limit parse/stringify operations
      const file: JSONSourceFile = { path, json };
      const params: JSONTransformParams = { cwd: config.cwd, json: createJSONTransformAPI };

      const out = await codemod(file, params);

      if (out === undefined) {
        report.error += 1;
      }
      // If the json object has modifications
      else if (!isEqual(json, out)) {
        if (!dry) {
          fse.writeFileSync(path, JSON.stringify(out, null, 2));
        }
        report.ok += 1;
      }
      // No changes
      else {
        report.nochange += 1;
      }
    } catch {
      report.error += 1;
    }
  }

  const endTime = process.hrtime(startTime);
  report.timeElapsed = (endTime[0] + endTime[1] / 1e9).toFixed(3);

  return report;
};
