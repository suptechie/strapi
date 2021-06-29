import get from 'lodash/get';
import { useRBACProvider, findMatchingPermissions } from '@strapi/helper-plugin';

const NOT_ALLOWED_FILTERS = ['json', 'component', 'media', 'richtext', 'dynamiczone'];

const useAllowedAttributes = (contentType, slug) => {
  const { allPermissions } = useRBACProvider();

  let timestamps = get(contentType, ['options', 'timestamps']);

  if (!Array.isArray(timestamps)) {
    timestamps = [];
  }

  const readPermissionsForSlug = findMatchingPermissions(allPermissions, [
    {
      action: 'plugins::content-manager.explorer.read',
      subject: slug,
    },
  ]);

  const readPermissionForAttr = get(readPermissionsForSlug, ['0', 'properties', 'fields'], []);
  const attributesArray = Object.keys(get(contentType, ['attributes']), {});
  const allowedAttributes = attributesArray
    .filter(attr => {
      const current = get(contentType, ['attributes', attr], {});

      if (!current.type) {
        return false;
      }

      if (NOT_ALLOWED_FILTERS.includes(current.type)) {
        return false;
      }

      if (!readPermissionForAttr.includes(attr) && attr !== 'id' && !timestamps.includes(attr)) {
        return false;
      }

      return true;
    })
    .sort();

  return allowedAttributes;
};

export default useAllowedAttributes;
