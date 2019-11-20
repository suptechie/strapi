import React from 'react';
import * as yup from 'yup';
import { get } from 'lodash';
import { translatedErrors as errorsTrads } from 'strapi-helper-plugin';
import { FormattedMessage } from 'react-intl';
import pluginId from '../../../pluginId';
import getTrad from '../../../utils/getTrad';
import { createUid, nameToSlug } from './createUid';

yup.addMethod(yup.mixed, 'defined', function() {
  return this.test(
    'defined',
    errorsTrads.required,
    value => value !== undefined
  );
});

yup.addMethod(yup.string, 'unique', function(
  message,
  allReadyTakenValues,
  validator
) {
  return this.test('unique', message, function(string) {
    if (!string) {
      return false;
    }

    return !allReadyTakenValues.includes(
      typeof validator === 'function' ? validator(string) : string
    );
  });
});

const forms = {
  attribute: {
    schema(currentSchema, attributeType) {
      const allreadyTakenAttributes = Object.keys(
        get(currentSchema, ['schema', 'attributes'], {})
      );

      return yup.object().shape({
        name: yup
          .string()
          .unique(errorsTrads.unique, allreadyTakenAttributes)
          .required(errorsTrads.required),
        type: yup.string().required(errorsTrads.required),
        default: yup.string().nullable(),
        required: yup.boolean(),
        unique: yup.boolean(),
        maxLength: yup
          .number()
          .integer()
          .nullable(),
        minLength: yup
          .number()
          .integer()
          .when('maxLength', (maxLength, schema) => {
            if (maxLength) {
              return schema.lessThan(
                maxLength,
                getTrad('error.validation.minSupMax')
              );
            } else {
              return schema;
            }
          })
          .nullable(),
        max: yup.lazy(() => {
          let schema = yup.number();

          if (attributeType === 'integer' || attributeType === 'biginteger') {
            schema = schema.integer();
          }

          return schema.nullable();
        }),
        min: yup.lazy(() => {
          let schema = yup.number();

          if (attributeType === 'integer' || attributeType === 'biginteger') {
            schema = schema.integer();
          }

          return schema
            .nullable()
            .when('max', (max, schema) => {
              if (max) {
                return schema.lessThan(
                  max,
                  getTrad('error.validation.minSupMax')
                );
              } else {
                return schema;
              }
            })
            .nullable();
        }),
        enum: yup
          .array()
          .of(yup.string())
          .min(1, errorsTrads.min),
      });
    },
    form: {
      advanced(data, type) {
        const defaultItems = [
          [
            {
              autoFocus: true,
              name: 'default',
              type: type === 'email' ? 'email' : 'text',
              label: {
                id: getTrad('form.attribute.settings.default'),
              },
              validations: {},
            },
          ],
          [
            {
              type: 'divider',
            },
          ],
          [
            {
              autoFocus: false,
              name: 'required',
              type: 'checkbox',
              label: {
                id: getTrad('form.attribute.item.requiredField'),
              },
              description: {
                id: getTrad('form.attribute.item.requiredField.description'),
              },
              validations: {},
            },
          ],
          [
            {
              autoFocus: false,
              name: 'unique',
              type: 'checkbox',
              label: {
                id: getTrad('form.attribute.item.uniqueField'),
              },
              description: {
                id: getTrad('form.attribute.item.uniqueField.description'),
              },
              validations: {},
            },
          ],
        ];

        const items = defaultItems.slice();

        if (type === 'media') {
          items.splice(0, 1);
        }

        if (type === 'boolean') {
          items.splice(0, 1, [
            {
              autoFocus: false,
              name: 'default',
              type: 'enum',
              label: {
                id: getTrad('form.attribute.settings.default'),
              },
              // description: {
              //   id: getTrad('form.attribute.item.requiredField.description'),
              // },
              options: [
                { value: 'true', label: 'TRUE' },
                { value: '', label: 'NULL' },
                { value: 'false', label: 'FALSE' },
              ],
              validations: {},
            },
          ]);
        }

        if (type === 'enumeration') {
          items.splice(0, 1, [
            {
              autoFocus: false,
              name: 'default',
              type: 'select',
              label: {
                id: getTrad('form.attribute.settings.default'),
              },
              validations: {},
              options: data.enum || [],
            },
          ]);
        }

        if (type === 'date') {
          items.splice(0, 1, [
            {
              autoFocus: false,
              name: 'default',
              type: 'date',
              label: {
                id: getTrad('form.attribute.settings.default'),
              },
              validations: {},
              value: null,
              withDefaultValue: false,
              disabled: data.type !== 'date',
            },
          ]);
        }

        if (type !== 'media' && type !== 'boolean' && type !== 'date') {
          items.push(
            [
              {
                autoFocus: false,
                name: type === 'number' ? 'max' : 'maxLength',
                // type: 'number',
                type: 'customCheckboxWithChildren',
                label: {
                  id: getTrad(
                    `form.attribute.item.maximum${
                      type === 'number' ? '' : 'Length'
                    }`
                  ),
                },

                validations: {},
              },
            ],
            [
              {
                autoFocus: false,
                name: type === 'number' ? 'min' : 'minLength',
                type: 'customCheckboxWithChildren',
                label: {
                  id: getTrad(
                    `form.attribute.item.minimum${
                      type === 'number' ? '' : 'Length'
                    }`
                  ),
                },
                validations: {},
              },
            ]
          );
        }

        return {
          items,
        };
      },
      base(data, type) {
        const items = [
          [
            {
              autoFocus: true,
              name: 'name',
              type: 'text',
              label: {
                id: getTrad('modalForm.attribute.form.base.name'),
              },
              description: {
                id: getTrad('modalForm.attribute.form.base.name.description'),
              },
              validations: {
                required: true,
              },
            },
          ],
        ];

        if (type === 'text' || type === 'media') {
          items.push([
            {
              label: {
                id: getTrad('modalForm.attribute.text.type-selection'),
              },
              name: type === 'text' ? 'type' : 'multiple',
              type: 'booleanBox',
              size: 12,
              options: [
                {
                  headerId: getTrad(
                    `form.attribute.${type}.option.${
                      type === 'text' ? 'short-text' : 'multiple'
                    }`
                  ),
                  descriptionId: getTrad(
                    `form.attribute.${type}.option.${
                      type === 'text' ? 'short-text' : 'multiple'
                    }.description`
                  ),
                  value: type === 'text' ? 'string' : true,
                },
                {
                  headerId: getTrad(
                    `form.attribute.${type}.option.${
                      type === 'text' ? 'long-text' : 'single'
                    }`
                  ),
                  descriptionId: getTrad(
                    `form.attribute.${type}.option.${
                      type === 'text' ? 'long-text' : 'single'
                    }.description`
                  ),
                  value: type === 'text' ? 'text' : false,
                },
              ],
              validations: {},
            },
          ]);
        }

        if (type === 'number') {
          items[0].push({
            label: {
              id: getTrad('form.attribute.item.number.type'),
            },
            name: 'type',
            type: 'select',
            options: [
              { id: 'components.InputSelect.option.placeholder', value: '' },
              {
                id: 'form.attribute.item.number.type.integer',
                value: 'integer',
              },
              {
                id: 'form.attribute.item.number.type.biginteger',
                value: 'biginteger',
              },
              {
                id: 'form.attribute.item.number.type.decimal',
                value: 'decimal',
              },
              { id: 'form.attribute.item.number.type.float', value: 'float' },
            ].map(({ id, value }, index) => {
              const disabled = index === 0;
              const tradId = index === 0 ? id : getTrad(id);

              return (
                <FormattedMessage id={tradId} key={id}>
                  {msg => (
                    <option disabled={disabled} hidden={disabled} value={value}>
                      {msg}
                    </option>
                  )}
                </FormattedMessage>
              );
            }),
            validations: {
              required: true,
            },
          });
        }

        if (type === 'date') {
          items[0].push({
            label: {
              id: getTrad('modalForm.attribute.text.type-selection'),
            },
            name: 'type',
            type: 'select',
            options: [
              { id: 'components.InputSelect.option.placeholder', value: '' },
              {
                id: 'form.attribute.item.date.type.date',
                value: 'date',
              },
              {
                id: 'form.attribute.item.date.type.datetime',
                value: 'datetime',
              },
              // Not sure the ctm supports that one
              // {
              //   id: 'form.attribute.item.date.type.timestamp',
              //   value: 'timestamp',
              // },
              { id: 'form.attribute.item.date.type.time', value: 'time' },
            ].map(({ id, value }, index) => {
              const disabled = index === 0;
              const tradId = index === 0 ? id : getTrad(id);

              return (
                <FormattedMessage id={tradId} key={id}>
                  {msg => (
                    <option disabled={disabled} hidden={disabled} value={value}>
                      {msg}
                    </option>
                  )}
                </FormattedMessage>
              );
            }),
            validations: {
              required: true,
            },
          });
        }

        if (type === 'enumeration') {
          items.push([
            {
              autoFocus: false,
              name: 'enum',
              type: 'textarea',
              size: 8,
              label: {
                id: getTrad('form.attribute.item.enumeration.rules'),
              },
              placeholder: {
                id: getTrad('form.attribute.item.enumeration.placeholder'),
              },
              validations: {
                required: true,
              },
            },
          ]);
        }

        return {
          items,
        };
      },
    },
  },
  contentType: {
    schema(allReadyTakenValues) {
      return yup.object().shape({
        name: yup
          .string()
          .unique(errorsTrads.unique, allReadyTakenValues, createUid)
          .required(errorsTrads.required),
        collectionName: yup.string(),
      });
    },
    form: {
      base(data = {}) {
        return {
          items: [
            [
              {
                autoFocus: true,
                name: 'name',
                type: 'text',
                label: {
                  id: `${pluginId}.contentType.displayName.label`,
                },
                validations: {
                  required: true,
                },
              },
              {
                description: {
                  id: `${pluginId}.contentType.UID.description`,
                },
                label: 'UID',
                name: 'uid',
                type: 'text',
                readOnly: true,
                disabled: true,
                value: data.name ? nameToSlug(data.name) : '',
              },
            ],
          ],
        };
      },
      advanced() {
        return {
          items: [
            [
              {
                autoFocus: true,
                label: {
                  id: `${pluginId}.contentType.collectionName.label`,
                },
                description: {
                  id: `${pluginId}.contentType.collectionName.description`,
                },
                name: 'collectionName',
                type: 'text',
                validations: {},
              },
            ],
          ],
        };
      },
    },
  },
};

export default forms;
