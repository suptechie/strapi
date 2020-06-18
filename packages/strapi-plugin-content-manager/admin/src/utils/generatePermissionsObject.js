const addSubjectToPermissionsArray = (array, uid) => array.map(data => ({ ...data, subject: uid }));

const generatePermissionsObject = uid => {
  const permissions = {
    // main: [
    //   { action: 'plugins::content-manager.explorer.create', subject: null },
    //   { action: 'plugins::content-manager.explorer.read', subject: null },
    //   { action: 'plugins::content-manager.explorer.update', subject: null },
    //   { action: 'plugins::content-manager.explorer.delete', subject: null },
    // ],
    create: [{ action: 'plugins::content-manager.explorer.create', subject: null }],
    delete: [{ action: 'plugins::content-manager.explorer.delete', subject: null }],
    read: [
      { action: 'plugins::content-manager.explorer.read', subject: null },
      { action: 'plugins::content-manager.explorer.update', subject: null },
      { action: 'plugins::content-manager.explorer.delete', subject: null },
    ],
    update: [{ action: 'plugins::content-manager.explorer.update', subject: null }],
  };

  return Object.keys(permissions).reduce((acc, current) => {
    acc[current] = addSubjectToPermissionsArray(permissions[current], uid);

    return acc;
  }, {});
};

export default generatePermissionsObject;
export { addSubjectToPermissionsArray };
