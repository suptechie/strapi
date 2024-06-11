export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export const detectPackageManager = (): PackageManager => {
  const userAgent = process.env.npm_config_user_agent || '';

  if (userAgent.startsWith('yarn')) {
    return 'yarn';
  }

  if (userAgent.startsWith('pnpm')) {
    return 'pnpm';
  }

  return 'npm';
};
