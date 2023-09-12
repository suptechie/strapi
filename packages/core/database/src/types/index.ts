const SCALAR_TYPES = [
  'increments',
  'password',
  'email',
  'string',
  'uid',
  'richtext',
  'text',
  'json',
  'enumeration',
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

const STRING_TYPES = ['string', 'text', 'uid', 'email', 'enumeration', 'richtext'];
const NUMBER_TYPES = ['biginteger', 'integer', 'decimal', 'float'];

export const isString = (type: string) => STRING_TYPES.includes(type);
export const isNumber = (type: string) => NUMBER_TYPES.includes(type);
export const isScalar = (type: string) => SCALAR_TYPES.includes(type);
export const isComponent = (type: string) => type === 'component';
export const isDynamicZone = (type: string) => type === 'dynamiczone';
export const isRelation = (type: string) => type === 'relation';
