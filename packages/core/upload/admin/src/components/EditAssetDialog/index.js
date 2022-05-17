/**
 *
 * EditAssetDialog
 *
 */

import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import isEqual from 'lodash/isEqual';
import {
  ModalLayout,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@strapi/design-system/ModalLayout';
import { Typography } from '@strapi/design-system/Typography';
import { Stack } from '@strapi/design-system/Stack';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { Button } from '@strapi/design-system/Button';
import { FieldLabel } from '@strapi/design-system/Field';
import { TextInput } from '@strapi/design-system/TextInput';
import { getFileExtension, Form } from '@strapi/helper-plugin';
import { VisuallyHidden } from '@strapi/design-system/VisuallyHidden';
import { Formik } from 'formik';
import * as yup from 'yup';

import { PreviewBox } from './PreviewBox';
import { ContextInfo } from '../ContextInfo';
import { getTrad, findRecursiveFolderByValue } from '../../utils';
import formatBytes from '../../utils/formatBytes';
import { useEditAsset } from '../../hooks/useEditAsset';
import { ReplaceMediaButton } from './ReplaceMediaButton';
import { AssetDefinition } from '../../constants';
import SelectTree from '../SelectTree';

const fileInfoSchema = yup.object({
  name: yup.string().required(),
  alternativeText: yup.string(),
  caption: yup.string(),
});

export const EditAssetDialog = ({
  onClose,
  asset,
  canUpdate,
  canCopyLink,
  canDownload,
  trackedLocation,
  folderStructure,
}) => {
  const { formatMessage, formatDate } = useIntl();
  const submitButtonRef = useRef(null);
  const [isCropping, setIsCropping] = useState(false);
  const [replacementFile, setReplacementFile] = useState();
  const { editAsset, isLoading } = useEditAsset();

  const handleSubmit = async values => {
    if (asset.isLocal) {
      const nextAsset = { ...asset, ...values };

      onClose(nextAsset);
    } else {
      const editedAsset = await editAsset({ ...asset, ...values }, replacementFile);
      onClose(editedAsset);
    }
  };

  const handleStartCropping = () => {
    setIsCropping(true);
  };

  const handleCancelCropping = () => {
    setIsCropping(false);
  };

  const handleFinishCropping = () => {
    setIsCropping(false);
    onClose();
  };

  const formDisabled = !canUpdate || isCropping;

  const handleConfirmClose = () => {
    // eslint-disable-next-line no-alert
    const confirm = window.confirm(
      formatMessage({
        id: 'window.confirm.close-modal.file',
        defaultMessage: 'Are you sure? Your changes will be lost.',
      })
    );

    if (confirm) {
      onClose();
    }
  };

  const activeFolderId = asset?.folder?.id;
  const initialFormData = {
    name: asset.name,
    alternativeText: asset.alternativeText ?? undefined,
    caption: asset.caption ?? undefined,
    parent: {
      value: activeFolderId ?? null,
      label:
        findRecursiveFolderByValue(folderStructure, activeFolderId)?.label ??
        folderStructure[0].label,
    },
  };

  const handleClose = values => {
    if (!isEqual(initialFormData, values)) {
      handleConfirmClose();
    } else {
      onClose();
    }
  };

  return (
    <Formik
      validationSchema={fileInfoSchema}
      validateOnChange={false}
      onSubmit={handleSubmit}
      initialValues={initialFormData}
    >
      {({ values, errors, handleChange, setFieldValue }) => (
        <ModalLayout onClose={() => handleClose(values)} labelledBy="title">
          <ModalHeader>
            <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
              {formatMessage({ id: 'global.details', defaultMessage: 'Details' })}
            </Typography>
          </ModalHeader>
          <ModalBody>
            <Grid gap={4}>
              <GridItem xs={12} col={6}>
                <PreviewBox
                  asset={asset}
                  canUpdate={canUpdate}
                  canCopyLink={canCopyLink}
                  canDownload={canDownload}
                  onDelete={onClose}
                  onCropFinish={handleFinishCropping}
                  onCropStart={handleStartCropping}
                  onCropCancel={handleCancelCropping}
                  replacementFile={replacementFile}
                  trackedLocation={trackedLocation}
                />
              </GridItem>
              <GridItem xs={12} col={6}>
                <Form noValidate>
                  <Stack spacing={3}>
                    <ContextInfo
                      blocks={[
                        {
                          label: formatMessage({
                            id: getTrad('modal.file-details.size'),
                            defaultMessage: 'Size',
                          }),
                          value: formatBytes(asset.size),
                        },

                        {
                          label: formatMessage({
                            id: getTrad('modal.file-details.dimensions'),
                            defaultMessage: 'Dimensions',
                          }),
                          value:
                            asset.height && asset.width ? `${asset.width}✕${asset.height}` : null,
                        },

                        {
                          label: formatMessage({
                            id: getTrad('modal.file-details.date'),
                            defaultMessage: 'Date',
                          }),
                          value: formatDate(new Date(asset.createdAt)),
                        },

                        {
                          label: formatMessage({
                            id: getTrad('modal.file-details.extension'),
                            defaultMessage: 'Extension',
                          }),
                          value: getFileExtension(asset.ext),
                        },
                      ]}
                    />

                    <TextInput
                      label={formatMessage({
                        id: getTrad('form.input.label.file-name'),
                        defaultMessage: 'File name',
                      })}
                      name="name"
                      value={values.name}
                      error={errors.name}
                      onChange={handleChange}
                      disabled={formDisabled}
                    />

                    <TextInput
                      label={formatMessage({
                        id: getTrad('form.input.label.file-alt'),
                        defaultMessage: 'Alternative text',
                      })}
                      name="alternativeText"
                      hint={formatMessage({
                        id: getTrad({ id: getTrad('form.input.decription.file-alt') }),
                        defaultMessage: 'This text will be displayed if the asset can’t be shown.',
                      })}
                      value={values.alternativeText}
                      error={errors.alternativeText}
                      onChange={handleChange}
                      disabled={formDisabled}
                    />

                    <TextInput
                      label={formatMessage({
                        id: getTrad('form.input.label.file-caption'),
                        defaultMessage: 'Caption',
                      })}
                      name="caption"
                      value={values.caption}
                      error={errors.caption}
                      onChange={handleChange}
                      disabled={formDisabled}
                    />

                    <Stack spacing={1}>
                      <FieldLabel htmlFor="asset-folder">
                        {formatMessage({
                          id: getTrad('form.input.label.file-location'),
                          defaultMessage: 'Location',
                        })}
                      </FieldLabel>

                      <SelectTree
                        name="parent"
                        defaultValue={values.parent}
                        options={folderStructure}
                        onChange={value => {
                          setFieldValue('parent', value);
                        }}
                        menuPortalTarget={document.querySelector('body')}
                        inputId="asset-folder"
                        {...(errors.parent
                          ? {
                              'aria-errormessage': 'folder-parent-error',
                              'aria-invalid': true,
                            }
                          : {})}
                      />
                    </Stack>
                  </Stack>

                  <VisuallyHidden>
                    <button
                      type="submit"
                      tabIndex={-1}
                      ref={submitButtonRef}
                      disabled={formDisabled}
                    >
                      {formatMessage({ id: 'submit', defaultMessage: 'Submit' })}
                    </button>
                  </VisuallyHidden>
                </Form>
              </GridItem>
            </Grid>
          </ModalBody>
          <ModalFooter
            startActions={
              <Button onClick={() => handleClose(values)} variant="tertiary">
                {formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
              </Button>
            }
            endActions={
              <>
                <ReplaceMediaButton
                  onSelectMedia={setReplacementFile}
                  acceptedMime={asset.mime}
                  disabled={formDisabled}
                  trackedLocation={trackedLocation}
                />

                <Button
                  onClick={() => submitButtonRef.current.click()}
                  loading={isLoading}
                  disabled={formDisabled}
                >
                  {formatMessage({ id: 'global.finish', defaultMessage: 'Finish' })}
                </Button>
              </>
            }
          />
        </ModalLayout>
      )}
    </Formik>
  );
};

EditAssetDialog.defaultProps = {
  trackedLocation: undefined,
};

EditAssetDialog.propTypes = {
  asset: AssetDefinition.isRequired,
  canUpdate: PropTypes.bool.isRequired,
  canCopyLink: PropTypes.bool.isRequired,
  canDownload: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  folderStructure: PropTypes.array.isRequired,
  trackedLocation: PropTypes.string,
};
