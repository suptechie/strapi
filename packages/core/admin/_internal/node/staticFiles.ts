import fs from 'node:fs/promises';
import path from 'node:path';
import outdent from 'outdent';
import { format } from 'prettier';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { BuildContext } from './createBuildContext';

interface EntryModuleArgs {
  plugins: BuildContext['plugins'];
}

const getEntryModule = ({ plugins }: EntryModuleArgs): string => {
  const pluginsObject = plugins
    .map(({ name, importName }) => `'${name}': ${importName}`)
    .join(',\n');

  const pluginsImport = plugins
    .map(({ importName, path }) => `import ${importName} from '${path}';`)
    .join('\n');

  return outdent`
        /**
         * This file was automatically generated by Strapi.
         * Any modifications made will be discarded.
         */
        ${pluginsImport}
        import { renderAdmin } from "@strapi/admin/strapi-admin"
        
        renderAdmin(
          document.getElementById("strapi"),
          {
            plugins: {
        ${pluginsObject}
            }
        })
      `;
};

const getDefaultDocumentComponent = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, node/no-missing-require
  const { DefaultDocument } = require('@strapi/admin/strapi-admin');

  return DefaultDocument;
};

/**
 * TODO: Here in the future we could add the ability
 * to load a user's Document component?
 */
const getDocumentHTML = ({ logger }: Pick<BuildContext, 'logger'>) => {
  const Document = getDefaultDocumentComponent();
  logger.debug('Got the default document');

  const result = renderToStaticMarkup(createElement(Document));
  logger.debug('Rendered the HTML');

  return outdent`<!DOCTYPE html>${result}`;
};

const AUTO_GENERATED_WARNING = `
This file was automatically generated by Strapi.
Any modifications made will be discarded.
`.trim();

/**
 * Because we now auto-generate the index.html file,
 * we should be clear that people _should not_ modify it.
 *
 * @internal
 */
const decorateHTMLWithAutoGeneratedWarning = (htmlTemplate: string): string =>
  htmlTemplate.replace(/<head/, `\n<!--\n${AUTO_GENERATED_WARNING}\n-->\n<head`);

const writeStaticClientFiles = async (ctx: BuildContext) => {
  /**
   * For everything to work effectively we create a client folder in `.strapi` at the cwd level.
   * We then use the function we need to "createAdmin" as well as generate the Document index.html as well.
   *
   * All this links together an imaginary "src/index" that then allows vite to correctly build the admin panel.
   */

  await fs.mkdir(ctx.runtimeDir, { recursive: true });
  ctx.logger.debug('Created the runtime directory');

  const indexHtml = decorateHTMLWithAutoGeneratedWarning(getDocumentHTML({ logger: ctx.logger }));

  await fs.writeFile(
    path.join(ctx.runtimeDir, 'index.html'),
    format(indexHtml, {
      parser: 'html',
    })
  );
  ctx.logger.debug('Wrote the index.html file');
  await fs.writeFile(
    path.join(ctx.runtimeDir, 'app.js'),
    format(getEntryModule({ plugins: ctx.plugins }), {
      parser: 'babel',
    })
  );
  ctx.logger.debug('Wrote the app.js file');
};

export { writeStaticClientFiles };
