import type { ImportDeclaration, JSCodeshift, Collection } from 'jscodeshift';

export const changeImportSpecifier = (
  root: Collection,
  j: JSCodeshift,
  options: { methodName: string; oldDependency: string; newDependency: string }
): void => {
  const { methodName, oldDependency, newDependency } = options;

  // Flag to check if the method was imported from the old dependency
  let methodImportedFromOldDependency = false;
  const methodAliases: string[] = [];

  // Remove the method from the old dependency and check if it was imported
  root
    .find(j.ImportDeclaration)
    .filter((path) => path.node.source.value === oldDependency)
    .forEach((path) => {
      const importDeclaration: ImportDeclaration = path.node;

      // Check if the method is imported from the old dependency
      const methodSpecifiers = importDeclaration.specifiers?.filter(
        (specifier) =>
          specifier.type === 'ImportSpecifier' && specifier.imported.name === methodName
      );

      if (methodSpecifiers && methodSpecifiers.length > 0) {
        methodImportedFromOldDependency = true;

        // Collect all aliases for the method
        methodSpecifiers.forEach((specifier) => {
          if (specifier.local && specifier.local.name !== methodName) {
            methodAliases.push(specifier.local.name);
          } else {
            methodAliases.push(methodName);
          }
        });

        // Remove the method specifiers from the old import
        const updatedSpecifiers = importDeclaration.specifiers?.filter(
          (specifier) =>
            specifier.type !== 'ImportSpecifier' || specifier.imported.name !== methodName
        );

        if (updatedSpecifiers && updatedSpecifiers.length > 0) {
          // Replace the import with the updated specifiers if there are other imports left
          j(path).replaceWith(j.importDeclaration(updatedSpecifiers, j.literal(oldDependency)));
        } else {
          // Remove the entire import statement if the specified method was the only import
          j(path).remove();
        }
      }
    });

  // Add new import dependency if the method was imported from the old dependency
  if (methodImportedFromOldDependency) {
    const dependencies = root
      .find(j.ImportDeclaration)
      .filter((path) => path.node.source.value === newDependency);

    if (dependencies.length > 0) {
      dependencies.forEach((path) => {
        const importDeclaration: ImportDeclaration = path.node;

        methodAliases.forEach((alias) => {
          const newSpecifier = j.importSpecifier(j.identifier(methodName), j.identifier(alias));
          const specifiersArray = importDeclaration.specifiers || [];
          j(path).replaceWith(
            j.importDeclaration([...specifiersArray, newSpecifier], j.literal(newDependency))
          );
        });
      });
    } else {
      const newSpecifiers = methodAliases.map((alias) =>
        j.importSpecifier(j.identifier(methodName), j.identifier(alias))
      );

      const newImportDeclaration = j.importDeclaration(newSpecifiers, j.literal(newDependency));

      // Find the index of the first non-import declaration
      const body = root.get().node.program.body;
      const lastImportIndex = body.findIndex((node) => node.type !== 'ImportDeclaration');

      if (lastImportIndex > -1) {
        // Insert the new import declaration just before the first non-import node
        body.splice(lastImportIndex, 0, newImportDeclaration);
      } else {
        // Check if 'use strict' exists at the beginning
        const hasUseStrict =
          body[0]?.type === 'ExpressionStatement' && body[0]?.expression?.value === 'use strict';
        // Add the new import after 'use strict' if it exists, otherwise at the beginning
        body.splice(hasUseStrict ? 1 : 0, 0, newImportDeclaration);
      }
    }
  }
};
