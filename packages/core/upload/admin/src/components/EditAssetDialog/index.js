/**
 *
 * EditAssetDialog
 *
 */

import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import { useIntl } from 'react-intl';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@strapi/parts/ModalLayout';
import { ButtonText } from '@strapi/parts/Text';
import { Stack } from '@strapi/parts/Stack';
import { Grid, GridItem } from '@strapi/parts/Grid';
import { Button } from '@strapi/parts/Button';
import { TextInput } from '@strapi/parts/TextInput';
import { getFileExtension, Form } from '@strapi/helper-plugin';
import { VisuallyHidden } from '@strapi/parts/VisuallyHidden';
import { Formik } from 'formik';
import * as yup from 'yup';
import { PreviewBox } from './PreviewBox';
import { AssetMeta } from './AssetMeta';
import { getTrad } from '../../utils';
import formatBytes from '../../utils/formatBytes';
import { useEditAsset } from '../../hooks/useEditAsset';

const fileInfoSchema = yup.object({
  name: yup.string().required(),
  alternativeText: yup.string(),
  caption: yup.string(),
});

export const EditAssetDialog = ({ onClose, asset }) => {
  const { formatMessage, formatDate } = useIntl();
  const submitButtonRef = useRef(null);
  const { editAsset, isLoading } = useEditAsset();

  const handleSubmit = async values => {
    await editAsset({ ...asset, ...values });
    onClose();
  };

  return (
    <>
      <ModalLayout onClose={onClose} labelledBy="title">
        <ModalHeader>
          <ButtonText textColor="neutral800" as="h2" id="title">
            {formatMessage({ id: getTrad('modal.edit.title'), defaultMessage: 'Details' })}
          </ButtonText>
        </ModalHeader>
        <ModalBody>
          <Grid gap={4}>
            <GridItem xs={12} col={6}>
              <PreviewBox asset={asset} onDelete={onClose} />
            </GridItem>
            <GridItem xs={12} col={6}>
              <Formik
                validationSchema={fileInfoSchema}
                validateOnChange={false}
                onSubmit={handleSubmit}
                initialValues={{
                  name: asset.name,
                  alternativeText: asset.alternativeText || asset.name,
                  caption: asset.caption || asset.name,
                }}
              >
                {({ values, errors, handleChange }) => (
                  <Form noValidate>
                    <Stack size={3}>
                      <AssetMeta
                        size={formatBytes(asset.size)}
                        dimension={
                          asset.height && asset.width ? `${asset.height}✕${asset.width}` : ''
                        }
                        date={formatDate(new Date(asset.createdAt))}
                        extension={getFileExtension(asset.ext)}
                      />

                      <TextInput
                        size="S"
                        label={formatMessage({
                          id: getTrad('form.input.label.file-name'),
                          defaultMessage: 'File name',
                        })}
                        name="name"
                        value={values.name}
                        error={errors.name}
                        onChange={handleChange}
                      />

                      <TextInput
                        size="S"
                        label={formatMessage({
                          id: getTrad('form.input.label.file-alt'),
                          defaultMessage: 'Alternative text',
                        })}
                        name="alternativeText"
                        hint={formatMessage({
                          id: getTrad({ id: getTrad('form.input.decription.file-alt') }),
                          defaultMessage:
                            'This text will be displayed if the asset can’t be shown.',
                        })}
                        value={values.alternativeText}
                        error={errors.alternativeText}
                        onChange={handleChange}
                      />

                      <TextInput
                        size="S"
                        label={formatMessage({
                          id: getTrad('form.input.label.file-caption'),
                          defaultMessage: 'Caption',
                        })}
                        name="caption"
                        value={values.caption}
                        error={errors.caption}
                        onChange={handleChange}
                      />
                    </Stack>

                    <VisuallyHidden>
                      <button type="submit" tabIndex={-1} ref={submitButtonRef}>
                        {formatMessage({ id: 'submit', defaultMessage: 'Submit' })}
                      </button>
                    </VisuallyHidden>
                  </Form>
                )}
              </Formik>
            </GridItem>
          </Grid>
        </ModalBody>
        <ModalFooter
          startActions={
            <Button onClick={onClose} variant="tertiary">
              {formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
            </Button>
          }
          endActions={
            <>
              <Button variant="secondary">
                {formatMessage({
                  id: getTrad('control-card.replace-media'),
                  defaultMessage: 'Replace media',
                })}
              </Button>
              <Button onClick={() => submitButtonRef.current.click()} loading={isLoading}>
                {formatMessage({ id: 'form.button.finish', defaultMessage: 'Finish' })}
              </Button>
            </>
          }
        />
      </ModalLayout>
    </>
  );
};

EditAssetDialog.propTypes = {
  asset: PropTypes.shape({
    id: PropTypes.number,
    height: PropTypes.number,
    width: PropTypes.number,
    size: PropTypes.number,
    createdAt: PropTypes.string,
    ext: PropTypes.string,
    name: PropTypes.string,
    url: PropTypes.string,
    alternativeText: PropTypes.string,
    caption: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};
