import formatLayouts, {
  formatEditRelationsLayoutWithMetas,
  formatLayoutWithMetas,
  formatListLayoutWithMetas,
  formatMetadatasRelations,
  generateRelationQueryInfos,
  generateRelationQueryInfosForComponents,
  getMainField,
  getDisplayedModels,
} from '../formatLayouts';

const addressSchema = {
  uid: 'application::address.address',
  attributes: {
    categories: {
      targetModel: 'application::category.category',
    },
  },
  layouts: {
    editRelations: ['categories'],
  },
  metadatas: {
    categories: {
      edit: {
        mainField: 'name',
      },
    },
  },
};
const simpleModels = [
  {
    uid: 'application::category.category',
    isDisplayed: true,
    attributes: {
      name: {
        type: 'string',
      },
    },
  },
];

describe('Content Manager | hooks | useFetchContentTypeLayout | utils ', () => {
  describe('formatEditRelationsLayoutWithMetas', () => {
    it('should format editRelations layout correctly', () => {
      const expectedLayout = [
        {
          name: 'categories',
          size: 6,
          fieldSchema: {
            targetModel: 'application::category.category',
          },
          metadatas: {
            mainField: 'name',
          },
          queryInfos: {
            endPoint: '/content-manager/relations/application::address.address/categories',
            containsKey: 'name_contains',
            defaultParams: {},
            shouldDisplayRelationLink: true,
          },
        },
      ];

      expect(formatEditRelationsLayoutWithMetas(addressSchema, simpleModels)).toEqual(
        expectedLayout
      );
    });
  });

  describe('formatLayouts', () => {
    it('should format the content type and components layouts', () => {
      const models = [
        {
          uid: 'compo',
          attributes: {
            full_name: {
              type: 'string',
              required: true,
            },

            city: {
              type: 'string',
              maxLength: 100,
            },

            compo: {
              type: 'component',
              repeatable: true,
            },
          },

          settings: { test: 'test' },
          options: { timestamps: false },
        },
        {
          attributes: {
            full_name: {
              type: 'string',
              required: true,
            },
            city: {
              type: 'string',
              maxLength: 100,
            },
            dz: {
              type: 'dynamiczone',
            },
            compo: {
              type: 'component',
              repeatable: true,
            },
          },
          uid: 'contentType',
        },
      ];
      const data = {
        components: {
          compo: {
            uid: 'compo',
            layouts: {
              edit: [
                [
                  { name: 'full_name', size: 6 },
                  { name: 'city', size: 6 },
                ],
                [{ name: 'compo', size: 12 }],
              ],
            },
            metadatas: {
              full_name: {
                edit: {
                  description: 'test',
                  editable: true,
                  label: 'Full_name',
                  placeholder: '',
                  visible: true,
                },
              },
              city: {
                edit: {
                  description: '',
                  editable: false,
                  label: 'City',
                  placeholder: '',
                  visible: true,
                },
              },
              compo: {
                edit: {
                  description: '',
                  editable: true,
                  label: 'compo',
                  placeholder: '',
                  visible: true,
                },
              },
            },
          },
        },
        contentType: {
          uid: 'contentType',
          layouts: {
            list: [],
            editRelations: [],
            edit: [
              [{ name: 'dz', size: 12 }],
              [
                { name: 'full_name', size: 6 },
                { name: 'city', size: 6 },
              ],
              [{ name: 'compo', size: 12 }],
            ],
          },
          metadatas: {
            full_name: {
              edit: {
                description: 'test',
                editable: true,
                label: 'Full_name',
                placeholder: '',
                visible: true,
              },
            },
            city: {
              edit: {
                description: '',
                editable: false,
                label: 'City',
                placeholder: '',
                visible: true,
              },
            },
            dz: {
              edit: {
                description: '',
                editable: true,
                label: 'Dz',
                placeholder: '',
                visible: true,
              },
            },
            compo: {
              edit: {
                description: '',
                editable: true,
                label: 'compo',
                placeholder: '',
                visible: true,
              },
            },
          },
        },
      };

      const result = formatLayouts(data, models);

      expect(result.components.compo).toHaveProperty('attributes');
      expect(result.components.compo).toHaveProperty('layouts');
      expect(result.components.compo).toHaveProperty('metadatas');
      expect(result.contentType).toHaveProperty('attributes');
      expect(result.contentType).toHaveProperty('layouts');
      expect(result.contentType).toHaveProperty('metadatas');
      expect(result.contentType.layouts.edit).toEqual([
        [
          {
            name: 'dz',
            size: 12,
            fieldSchema: {
              type: 'dynamiczone',
            },
            metadatas: {
              description: '',
              editable: true,
              label: 'Dz',
              placeholder: '',
              visible: true,
            },
          },
        ],
        [
          {
            name: 'full_name',
            size: 6,
            fieldSchema: {
              type: 'string',
              required: true,
            },
            metadatas: {
              description: 'test',
              editable: true,
              label: 'Full_name',
              placeholder: '',
              visible: true,
            },
          },
          {
            name: 'city',
            size: 6,
            fieldSchema: {
              type: 'string',
              maxLength: 100,
            },
            metadatas: {
              description: '',
              editable: false,
              label: 'City',
              placeholder: '',
              visible: true,
            },
          },
        ],
        [
          {
            name: 'compo',
            size: 12,
            fieldSchema: {
              type: 'component',
              repeatable: true,
            },
            metadatas: {
              description: '',
              editable: true,
              label: 'compo',
              placeholder: '',
              visible: true,
            },
          },
        ],
      ]);
      expect(result.components.compo.layouts.edit).toEqual([
        [
          {
            name: 'full_name',
            size: 6,
            fieldSchema: {
              type: 'string',
              required: true,
            },
            metadatas: {
              description: 'test',
              editable: true,
              label: 'Full_name',
              placeholder: '',
              visible: true,
            },
          },
          {
            name: 'city',
            size: 6,
            fieldSchema: {
              type: 'string',
              maxLength: 100,
            },
            metadatas: {
              description: '',
              editable: false,
              label: 'City',
              placeholder: '',
              visible: true,
            },
          },
        ],
        [
          {
            name: 'compo',
            size: 12,
            fieldSchema: {
              type: 'component',
              repeatable: true,
            },
            metadatas: {
              description: '',
              editable: true,
              label: 'compo',
              placeholder: '',
              visible: true,
            },
          },
        ],
      ]);
    });
  });

  describe('formatLayoutWithMetas', () => {
    it('should return a layout with the metadas for each input', () => {
      const data = {
        attributes: {
          full_name: {
            type: 'string',
            required: true,
          },

          city: {
            type: 'string',
            maxLength: 100,
          },
          dz: {
            type: 'dynamiczone',
          },
          compo: {
            type: 'component',
            repeatable: true,
          },
        },
        layouts: {
          edit: [
            [{ name: 'dz', size: 12 }],
            [
              { name: 'full_name', size: 6 },
              { name: 'city', size: 6 },
            ],
            [{ name: 'compo', size: 12 }],
          ],
        },
        metadatas: {
          full_name: {
            edit: {
              description: 'test',
              editable: true,
              label: 'Full_name',
              placeholder: '',
              visible: true,
            },
          },
          city: {
            edit: {
              description: '',
              editable: false,
              label: 'City',
              placeholder: '',
              visible: true,
            },
          },
          dz: {
            edit: {
              description: '',
              editable: true,
              label: 'Dz',
              placeholder: '',
              visible: true,
            },
          },
          compo: {
            edit: {
              description: '',
              editable: true,
              label: 'compo',
              placeholder: '',
              visible: true,
            },
          },
        },
      };

      const expected = [
        [
          {
            name: 'dz',
            size: 12,
            fieldSchema: {
              type: 'dynamiczone',
            },
            metadatas: {
              description: '',
              editable: true,
              label: 'Dz',
              placeholder: '',
              visible: true,
            },
          },
        ],
        [
          {
            name: 'full_name',
            size: 6,
            fieldSchema: {
              type: 'string',
              required: true,
            },
            metadatas: {
              description: 'test',
              editable: true,
              label: 'Full_name',
              placeholder: '',
              visible: true,
            },
          },
          {
            name: 'city',
            size: 6,
            fieldSchema: {
              type: 'string',
              maxLength: 100,
            },
            metadatas: {
              description: '',
              editable: false,
              label: 'City',
              placeholder: '',
              visible: true,
            },
          },
        ],
        [
          {
            name: 'compo',
            size: 12,
            fieldSchema: {
              type: 'component',
              repeatable: true,
            },
            metadatas: {
              description: '',
              editable: true,
              label: 'compo',
              placeholder: '',
              visible: true,
            },
          },
        ],
      ];

      expect(formatLayoutWithMetas(data)).toEqual(expected);
    });
  });

  describe('formatListLayoutWithMetas', () => {
    it('should format the list layout correctly', () => {
      const data = {
        layouts: {
          list: ['test'],
        },
        metadatas: {
          test: {
            list: { ok: true },
          },
        },
        attributes: {
          test: { type: 'string' },
        },
      };
      const expected = [
        {
          name: 'test',
          key: '__test_key__',
          metadatas: { ok: true },
          fieldSchema: { type: 'string' },
        },
      ];

      expect(formatListLayoutWithMetas(data)).toEqual(expected);
    });
  });

  describe('formatMetadatasRelations', () => {
    it('should format metadatas correctly', () => {
      const contentTypeConfiguration = {
        uid: 'address',
        metadatas: {
          categories: {
            list: {
              ok: true,
            },
            edit: {
              ok: false,
              mainField: 'name',
            },
          },
        },
        attributes: {
          categories: {
            targetModel: 'category',
          },
        },
        layouts: {
          editRelations: ['categories'],
        },
      };
      const models = [
        {
          uid: 'category',
          attributes: {
            name: {
              type: 'string',
            },
          },
        },
      ];
      const actual = formatMetadatasRelations(contentTypeConfiguration, models);
      const expected = {
        categories: {
          list: {
            ok: true,
            mainField: {
              name: 'name',
              schema: {
                type: 'string',
              },
              queryInfos: { defaultParams: {}, endPoint: 'collection-types/address' },
            },
          },
          edit: {
            ok: false,
            mainField: 'name',
          },
        },
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('generateRelationQueryInfos', () => {
    it('should return an object with the correct keys', () => {
      expect(generateRelationQueryInfos(addressSchema, 'categories', simpleModels)).toEqual({
        endPoint: '/content-manager/relations/application::address.address/categories',
        containsKey: 'name_contains',
        defaultParams: {},
        shouldDisplayRelationLink: true,
      });
    });
  });

  describe('generateRelationQueryInfosForComponents', () => {
    it('should return an object with the correct keys', () => {
      expect(
        generateRelationQueryInfosForComponents(
          addressSchema,
          'categories',
          'application::address.address',
          simpleModels
        )
      ).toEqual({
        endPoint: '/content-manager/relations/application::address.address/categories',
        containsKey: 'name_contains',
        defaultParams: {
          _component: 'application::address.address',
        },
        shouldDisplayRelationLink: true,
      });
    });
  });

  describe('getDisplayedModels', () => {
    it('should return an array containing only the displayable models', () => {
      const models = [
        { uid: 'test', isDisplayed: false },
        { uid: 'testtest', isDisplayed: true },
      ];

      expect(getDisplayedModels([])).toHaveLength(0);
      expect(getDisplayedModels(models)).toHaveLength(1);
      expect(getDisplayedModels(models)[0]).toEqual('testtest');
    });
  });

  describe('getMainField', () => {
    it('should return the main field object correctly', () => {
      const relationField = 'categories';
      const contentTypeConfiguration = {
        uid: 'address',
        metadatas: {
          categories: {
            edit: {
              mainField: 'name',
            },
          },
        },
        attributes: {
          categories: {
            targetModel: 'category',
          },
        },
      };
      const models = [
        {
          uid: 'category',
          attributes: {
            name: {
              type: 'string',
            },
          },
        },
      ];
      const actual = getMainField(relationField, contentTypeConfiguration, models);
      const expected = {
        name: 'name',
        queryInfos: { defaultParams: {}, endPoint: 'collection-types/address' },
        schema: { type: 'string' },
      };
      expect(actual).toEqual(expected);
    });
  });
});
