import chalk from 'chalk';
import os from 'os';
import { Observable } from 'rxjs';
import ts from 'typescript';

import { isError } from '../../core/errors';

import { printDiagnostic } from './diagnostic';
import { DtsBaseTask } from './types';

import type { TaskHandler } from '../index';

interface DtsBuildTask extends DtsBaseTask {
  type: 'build:dts';
}

const dtsBuildTask: TaskHandler<DtsBuildTask> = {
  print(ctx, task) {
    const entries = [
      '   entries:',
      ...task.entries.map((entry) =>
        [
          `    – `,
          chalk.green(`${entry.importId} `),
          `${chalk.cyan(entry.sourcePath)} ${chalk.gray('->')} ${chalk.cyan(entry.targetPath)}`,
        ].join('')
      ),
    ];

    ctx.logger.log(['Building type files:', ...entries].join(os.EOL));
  },
  run$(ctx, task) {
    return new Observable((subscriber) => {
      Promise.all(
        task.entries.map(async (entry) => {
          if (!ctx.ts) {
            ctx.logger.warn(
              `You've added a types entry but no tsconfig.json was found for ${entry.targetPath}. Skipping...`
            );

            return;
          }

          const program = ts.createProgram(ctx.ts.config.fileNames, ctx.ts.config.options);

          const emitResult = program.emit();

          const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

          for (const diagnostic of allDiagnostics) {
            printDiagnostic(diagnostic, { logger: ctx.logger, cwd: ctx.cwd });
          }

          if (emitResult.emitSkipped) {
            const errors = allDiagnostics.filter(
              (diag) => diag.category === ts.DiagnosticCategory.Error
            );

            if (errors.length) {
              throw new Error('Failed to compile TypeScript definitions');
            }
          }
        })
      )
        .then(() => {
          subscriber.complete();
        })
        .catch((err) => {
          subscriber.error(err);
        });
    });
  },
  async success(ctx, task) {
    const msg = [
      `Built types, entries:`,
      task.entries
        .map(
          (entry) =>
            `    ${chalk.blue(`${entry.importId}`)}: ${entry.sourcePath} -> ${entry.targetPath}`
        )
        .join(os.EOL),
    ];

    ctx.logger.success(msg.join(os.EOL));
  },
  async fail(ctx, task, err) {
    if (isError(err)) {
      ctx.logger.error(err.message);
    }

    process.exit(1);
  },
};

export { dtsBuildTask };

export type { DtsBuildTask };
