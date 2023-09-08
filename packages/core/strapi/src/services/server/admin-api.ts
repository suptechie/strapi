import type { Strapi } from '@strapi/typings';
import { createAPI } from './api';

const createAdminAPI = (strapi: Strapi) => {
  const opts = {
    prefix: '', // '/admin';
    type: 'admin',
  };

  return createAPI(strapi, opts);
};

export { createAdminAPI };
