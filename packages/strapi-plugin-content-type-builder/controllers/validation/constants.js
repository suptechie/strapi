'use strict';

const CONTENT_TYPE = 'CONTENT_TYPE';
const COMPONENT = 'COMPONENT';

const SINGLE_TYPE = 'singleType';
const COLLECTION_TYPE = 'collectionType';

const DEFAULT_TYPES = [
  // advanced types
  'media',

  // scalar types
  'string',
  'text',
  'richtext',
  'json',
  'enumeration',
  'password',
  'email',
  'integer',
  'biginteger',
  'float',
  'decimal',
  'date',
  'time',
  'datetime',
  'timestamp',
  'boolean',
];

const FORBIDDEN_ATTRIBUTE_NAMES = ['__component', '__contentType'];

const CONTENT_TYPE_KINDS = [SINGLE_TYPE, COLLECTION_TYPE];

module.exports = {
  DEFAULT_TYPES,
  CONTENT_TYPE_KINDS,
  typeKinds: {
    SINGLE_TYPE,
    COLLECTION_TYPE,
  },
  modelTypes: {
    CONTENT_TYPE,
    COMPONENT,
  },
  FORBIDDEN_ATTRIBUTE_NAMES,
};
