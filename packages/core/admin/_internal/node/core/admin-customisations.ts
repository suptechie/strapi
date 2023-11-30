import path from 'node:path';
import { convertSystemPathToModulePath, pathExists } from '../core/files';
import { BuildContext } from '../createBuildContext';

const ADMIN_APP_FILES = ['app.js', 'app.mjs', 'app.ts', 'app.jsx', 'app.tsx'];

interface AdminCustomisations {
  config?: {
    locales?: string[];
  };
  bootstrap?: Function;
}

interface AppFile {
  /**
   * The system path to the file
   */
  path: string;
  /**
   * The module path to the file i.e. how you would import it
   */
  modulePath: string;
}

const loadUserAppFile = async ({
  runtimeDir,
  appDir,
}: Pick<BuildContext, 'appDir' | 'runtimeDir'>): Promise<AppFile | undefined> => {
  for (const file of ADMIN_APP_FILES) {
    const filePath = path.join(appDir, 'src', 'admin', file);

    if (await pathExists(filePath)) {
      return {
        path: filePath,
        modulePath: convertSystemPathToModulePath(path.relative(runtimeDir, filePath)),
      };
    }
  }

  return undefined;
};

export { loadUserAppFile };
export type { AdminCustomisations, AppFile };
