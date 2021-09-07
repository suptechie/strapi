'use strict';

const _ = require('lodash');
const { pickBy, has } = require('lodash/fp');
const { addNamespace, hasNamespace } = require('../utils');

const servicesRegistry = strapi => {
  const services = {};
  const instanciatedServices = {};

  return {
    get(uid) {
      if (instanciatedServices[uid]) {
        return instanciatedServices[uid];
      }

      const service = services[uid];
      if (service) {
        instanciatedServices[uid] = service({ strapi });
        return instanciatedServices[uid];
      }

      return undefined;
    },
    getAll(namespace) {
      const filteredServices = pickBy((_, uid) => hasNamespace(uid, namespace))(services);

      return _.mapValues(filteredServices, (service, serviceUID) => this.get(serviceUID));
    },
    set(uid, value) {
      instanciatedServices[uid] = value;
      return this;
    },
    add(namespace, newServices) {
      for (const serviceName in newServices) {
        const service = newServices[serviceName];
        const uid = addNamespace(serviceName, namespace);

        if (has(uid, services)) {
          throw new Error(`Service ${uid} has already been registered.`);
        }
        services[uid] = service;
      }

      return this;
    },
    extend(serviceUID, extendFn) {
      const currentService = this.get(serviceUID);
      if (!currentService) {
        throw new Error(`Service ${serviceUID} doesn't exist`);
      }
      const newService = extendFn(currentService);
      instanciatedServices[serviceUID] = newService;
    },
  };
};

module.exports = servicesRegistry;
