import type { IEntity } from '../../../../types';

import { Readable } from 'stream';

import { collect, getStrapiFactory } from './test-utils';
import { createLocalStrapiSourceProvider } from '../';

describe('Local Strapi Source Provider', () => {
  describe('Boostrap', () => {
    test('Should not have a defined Strapi instance if bootstrap has not been called', () => {
      const provider = createLocalStrapiSourceProvider({ getStrapi: getStrapiFactory() });

      expect(provider.strapi).not.toBeDefined();
    });

    test('Should have a defined Strapi instance if bootstrap has been called', async () => {
      const provider = createLocalStrapiSourceProvider({ getStrapi: getStrapiFactory() });
      await provider.bootstrap();

      expect(provider.strapi).toBeDefined();
    });
  });

  describe('Close', () => {
    test('Should destroy the strapi instance if autoDestroy is undefined ', async () => {
      const destroy = jest.fn();

      const provider = createLocalStrapiSourceProvider({
        getStrapi: getStrapiFactory({ destroy }),
      });

      await provider.bootstrap();
      await provider.close();

      expect(destroy).toHaveBeenCalled();
    });

    test('Should destroy the strapi instance if autoDestroy is true ', async () => {
      const destroy = jest.fn();

      const provider = createLocalStrapiSourceProvider({
        getStrapi: getStrapiFactory({ destroy }),
        autoDestroy: true,
      });

      await provider.bootstrap();
      await provider.close();

      expect(destroy).toHaveBeenCalled();
    });
  });

  describe('Streaming Entities', () => {
    test('Should throw an error if strapi is not defined', async () => {
      const provider = createLocalStrapiSourceProvider({ getStrapi: getStrapiFactory() });

      await expect(() => provider.streamEntities()).rejects.toThrowError(
        'Not able to stream entities. Strapi instance not found'
      );
    });

    test('Should successfully create a readable stream with all available entities', async () => {
      const contentTypes = {
        foo: { uid: 'foo', attributes: { title: { type: 'string' } } },
        bar: { uid: 'bar', attributes: { age: { type: 'number' } } },
      };

      const stream = jest.fn((uid: string, _query: unknown) => {
        if (uid === 'foo') {
          return Readable.from([
            { id: 1, title: 'First title' },
            { id: 2, title: 'Second title' },
          ]);
        }

        if (uid === 'bar') {
          return Readable.from([
            { id: 1, age: 42 },
            { id: 2, age: 84 },
          ]);
        }
      });

      const provider = createLocalStrapiSourceProvider({
        getStrapi: getStrapiFactory({
          contentTypes,
          entityService: { stream },
        }),
      });

      await provider.bootstrap();

      const entitiesStream = (await provider.streamEntities()) as Readable;
      const entities = await collect<IEntity<'foo' | 'bar'>>(entitiesStream);

      // Should have been called with 'foo', then 'bar'
      expect(stream).toHaveBeenCalledTimes(2);
      // The returned value should be a Readable stream instance
      expect(entitiesStream).toBeInstanceOf(Readable);
      // We have 2 * 2 entities
      expect(entities).toHaveLength(4);
      // Each entity should follow the transfer format
      entities.forEach((entity) => {
        expect(entity).toMatchObject({
          type: expect.any(String),
          id: expect.any(Number),
          data: expect.any(Object),
        });
      });
    });
  });
});
