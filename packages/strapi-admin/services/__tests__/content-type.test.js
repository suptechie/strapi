'use strict';

const contentTypeService = require('../content-type');

describe('Content-Type', () => {
  describe('getNestedFields', () => {
    const components = {
      restaurant: {
        uid: 'restaurant',
        attributes: {
          name: { type: 'text' },
          description: { type: 'text' },
          address: { type: 'component', component: 'address' },
        },
      },
      car: {
        uid: 'car',
        attributes: {
          model: { type: 'text' },
        },
      },
      address: {
        uid: 'address',
        attributes: {
          city: { type: 'text' },
          country: { type: 'text' },
          gpsCoordinates: { type: 'component', component: 'gpsCoordinates' },
        },
      },
      gpsCoordinates: {
        uid: 'gpsCoordinates',
        attributes: {
          lat: { type: 'text' },
          long: { type: 'text' },
        },
      },
      user: {
        uid: 'user',
        attributes: {
          firstname: { type: 'text' },
          restaurant: { type: 'component', component: 'restaurant' },
          car: { type: 'component', component: 'car' },
        },
      },
    };

    test('1 level', async () => {
      const resultLevel1 = contentTypeService.getNestedFields('user', {
        nestingLevel: 1,
        components,
      });
      expect(resultLevel1).toEqual(['firstname', 'restaurant', 'car']);
    });

    test('2 levels', async () => {
      const resultLevel1 = contentTypeService.getNestedFields('user', {
        nestingLevel: 2,
        components,
      });
      expect(resultLevel1).toEqual([
        'firstname',
        'restaurant.name',
        'restaurant.description',
        'restaurant.address',
        'car.model',
      ]);
    });

    test('3 levels', async () => {
      const resultLevel1 = contentTypeService.getNestedFields('user', {
        nestingLevel: 3,
        components,
      });
      expect(resultLevel1).toEqual([
        'firstname',
        'restaurant.name',
        'restaurant.description',
        'restaurant.address.city',
        'restaurant.address.country',
        'restaurant.address.gpsCoordinates',
        'car.model',
      ]);
    });

    test('4 levels', async () => {
      const resultLevel1 = contentTypeService.getNestedFields('user', {
        nestingLevel: 4,
        components,
      });
      expect(resultLevel1).toEqual([
        'firstname',
        'restaurant.name',
        'restaurant.description',
        'restaurant.address.city',
        'restaurant.address.country',
        'restaurant.address.gpsCoordinates.lat',
        'restaurant.address.gpsCoordinates.long',
        'car.model',
      ]);
    });

    test('5 levels (deeper than needed)', async () => {
      const resultLevel1 = contentTypeService.getNestedFields('user', {
        nestingLevel: 5,
        components,
      });
      expect(resultLevel1).toEqual([
        'firstname',
        'restaurant.name',
        'restaurant.description',
        'restaurant.address.city',
        'restaurant.address.country',
        'restaurant.address.gpsCoordinates.lat',
        'restaurant.address.gpsCoordinates.long',
        'car.model',
      ]);
    });
  });
});
