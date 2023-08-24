import { pickBy, has } from 'lodash/fp';
import { addNamespace, hasNamespace } from '../utils';
import type { Strapi } from '../../Strapi';
import type { Common } from '../../types';

export type ServiceFactory = (params: { strapi: Strapi }) => Common.Service | Common.Service;
export type ServiceFactoryMap = Record<string, ServiceFactory>;
export type ServiceMap = Record<string, Common.Service>;
export type ServiceExtendFn = (service: Common.Service) => Common.Service;

const servicesRegistry = (strapi: Strapi) => {
  const services: ServiceFactoryMap = {};
  const instantiatedServices: ServiceMap = {};

  return {
    /**
     * Returns this list of registered services uids
     */
    keys() {
      return Object.keys(services);
    },

    /**
     * Returns the instance of a service. Instantiate the service if not already done
     */
    get(uid: Common.UID.Service) {
      if (instantiatedServices[uid]) {
        return instantiatedServices[uid];
      }

      const service = services[uid];
      if (service) {
        instantiatedServices[uid] = typeof service === 'function' ? service({ strapi }) : service;
        return instantiatedServices[uid];
      }
    },

    /**
     * Returns a map with all the services in a namespace
     */
    getAll(namespace: string): ServiceMap {
      const filteredServices = pickBy((_, uid) => hasNamespace(uid, namespace))(services);

      // create lazy accessor to avoid instantiating the services;
      const map = {};
      for (const uid of Object.keys(filteredServices)) {
        Object.defineProperty(map, uid, {
          enumerable: true,
          get: () => {
            return this.get(uid as Common.UID.Service);
          },
        });
      }

      return map;
    },

    /**
     * Registers a service
     */
    set(uid: string, service: ServiceFactory) {
      services[uid] = service;
      delete instantiatedServices[uid];
      return this;
    },

    /**
     * Registers a map of services for a specific namespace
     */
    add(namespace: string, newServices: ServiceFactoryMap) {
      for (const serviceName of Object.keys(newServices)) {
        const service = newServices[serviceName];
        const uid = addNamespace(serviceName, namespace);

        if (has(uid, services)) {
          throw new Error(`Service ${uid} has already been registered.`);
        }
        services[uid] = service;
      }

      return this;
    },

    /**
     * Wraps a service to extend it
     */
    extend(uid: Common.UID.Service, extendFn: ServiceExtendFn) {
      const currentService = this.get(uid);

      if (!currentService) {
        throw new Error(`Service ${uid} doesn't exist`);
      }

      const newService = extendFn(currentService);
      instantiatedServices[uid] = newService;

      return this;
    },
  };
};

export default servicesRegistry;
