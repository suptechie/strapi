/* eslint-disable react/no-array-index-key */
/* eslint-disable import/no-cycle */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@strapi/design-system/Box';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { Stack } from '@strapi/design-system/Stack';
import { useContentTypeLayout } from '../../hooks';
import FieldComponent from '../FieldComponent';
import Inputs from '../Inputs';
import useLazyComponents from '../../hooks/useLazyComponents';
import { ItemTypes } from '../../utils';

const NonRepeatableComponent = ({ componentUid, isNested, name, source }) => {
  const { getComponentLayout } = useContentTypeLayout();
  const componentLayoutData = useMemo(
    () => getComponentLayout(componentUid),
    [componentUid, getComponentLayout]
  );
  const fields = componentLayoutData.layouts.edit;

  const { lazyComponentStore } = useLazyComponents();

  const isFromDynamicZone = source.type === ItemTypes.DYNAMIC_ZONE;

  return (
    <Box
      background={isFromDynamicZone ? '' : 'neutral100'}
      paddingLeft={6}
      paddingRight={6}
      paddingTop={6}
      paddingBottom={6}
      hasRadius={isNested}
      borderColor={isNested ? 'neutral200' : ''}
    >
      <Stack spacing={6}>
        {fields.map((fieldRow, key) => {
          return (
            <Grid gap={4} key={key}>
              {fieldRow.map(({ name: fieldName, size, metadatas, fieldSchema, queryInfos }) => {
                const isComponent = fieldSchema.type === 'component';
                const keys = `${name}.${fieldName}`;

                if (isComponent) {
                  const compoUid = fieldSchema.component;

                  return (
                    <GridItem col={size} s={12} xs={12} key={fieldName}>
                      <FieldComponent
                        componentUid={compoUid}
                        intlLabel={{
                          id: metadatas.label,
                          defaultMessage: metadatas.label,
                        }}
                        isNested
                        isRepeatable={fieldSchema.repeatable}
                        max={fieldSchema.max}
                        min={fieldSchema.min}
                        name={keys}
                        required={fieldSchema.required || false}
                      />
                    </GridItem>
                  );
                }

                return (
                  <GridItem col={size} key={fieldName} s={12} xs={12}>
                    <Inputs
                      source={source}
                      componentUid={componentUid}
                      keys={keys}
                      fieldSchema={fieldSchema}
                      metadatas={metadatas}
                      queryInfos={queryInfos}
                      size={size}
                      customFieldInputs={lazyComponentStore}
                    />
                  </GridItem>
                );
              })}
            </Grid>
          );
        })}
      </Stack>
    </Box>
  );
};

NonRepeatableComponent.defaultProps = {
  isNested: false,
};

NonRepeatableComponent.propTypes = {
  componentUid: PropTypes.string.isRequired,
  isNested: PropTypes.bool,
  name: PropTypes.string.isRequired,
  source: PropTypes.shape({
    type: PropTypes.string,
    componentId: PropTypes.number,
  }).isRequired,
};

export default NonRepeatableComponent;
