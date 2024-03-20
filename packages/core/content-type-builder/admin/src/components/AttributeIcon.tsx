import { useStrapiApp } from '@strapi/admin/strapi-admin';
import { Box } from '@strapi/design-system';
import {
  Boolean,
  CollectionType,
  Component,
  Date,
  DynamicZone,
  Email,
  Enumeration,
  Json,
  Media,
  Number,
  Password,
  Relation,
  RichText,
  SingleType,
  Text,
  Uid,
  Blocks,
} from '@strapi/icons';
import styled from 'styled-components';

const iconByTypes = {
  biginteger: Number,
  blocks: Blocks,
  boolean: Boolean,
  collectionType: CollectionType,
  component: Component,
  contentType: CollectionType,
  date: Date,
  datetime: Date,
  decimal: Number,
  dynamiczone: DynamicZone,
  email: Email,
  enum: Enumeration,
  enumeration: Enumeration,
  file: Media,
  files: Media,
  float: Number,
  integer: Number,
  json: Json,
  JSON: Json,
  media: Media,
  number: Number,
  password: Password,
  relation: Relation,
  richtext: RichText,
  singleType: SingleType,
  string: Text,
  text: Text,
  time: Date,
  timestamp: Date,
  uid: Uid,
};

const IconBox = styled(Box)`
  svg {
    height: 100%;
    width: 100%;
  }
`;

export type IconByType = keyof typeof iconByTypes;

type AttributeIconProps = {
  type: IconByType;
  customField?: string | null;
};

export const AttributeIcon = ({ type, customField = null, ...rest }: AttributeIconProps) => {
  const getCustomField = useStrapiApp('AttributeIcon', (state) => state.customFields.get);

  let Compo: any = iconByTypes[type];

  if (customField) {
    const customFieldObject = getCustomField(customField);
    const icon = customFieldObject?.icon;
    if (icon) {
      Compo = icon;
    }
  }

  if (!iconByTypes[type]) {
    return null;
  }

  return (
    <IconBox height={`${24 / 16}rem`} width={`${32 / 16}rem`} shrink={0} {...rest} aria-hidden>
      <Box as={Compo} />
    </IconBox>
  );
};
