import React, { forwardRef, useEffect, useState } from 'react';

import { useField, useNotification } from '@strapi/admin/strapi-admin';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import getAllowedFiles from '../../utils/getAllowedFiles';
import getTrad from '../../utils/getTrad';
import { AssetDialog } from '../AssetDialog';
import { EditFolderDialog } from '../EditFolderDialog';
import { UploadAssetDialog } from '../UploadAssetDialog/UploadAssetDialog';

import { CarouselAssets } from './Carousel/CarouselAssets';

const STEPS = {
  AssetSelect: 'SelectAsset',
  AssetUpload: 'UploadAsset',
  FolderCreate: 'FolderCreate',
};

export const MediaLibraryInput = forwardRef(
  (
    { attribute: { allowedTypes, multiple }, label, hint, disabled, labelAction, name, required },
    forwardedRef
  ) => {
    const { formatMessage } = useIntl();
    const { onChange, value, error } = useField(name);
    const fieldAllowedTypes = allowedTypes || ['files', 'images', 'videos', 'audios'];
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [step, setStep] = useState(undefined);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [droppedAssets, setDroppedAssets] = useState();
    const [folderId, setFolderId] = useState(null);
    const { toggleNotification } = useNotification();

    useEffect(() => {
      // Clear the uploaded files on close
      if (step === undefined) {
        setUploadedFiles([]);
      }
    }, [step]);

    let selectedAssets = [];

    if (Array.isArray(value)) {
      selectedAssets = value;
    } else if (value) {
      selectedAssets = [value];
    }

    const handleValidation = (nextSelectedAssets) => {
      onChange({
        target: { name, value: multiple ? nextSelectedAssets : nextSelectedAssets[0] },
      });
      setStep(undefined);
    };

    const handleDeleteAssetFromMediaLibrary = () => {
      let nextValue;

      if (multiple) {
        const nextSelectedAssets = selectedAssets.filter(
          (_, assetIndex) => assetIndex !== selectedIndex
        );
        nextValue = nextSelectedAssets.length > 0 ? nextSelectedAssets : null;
      } else {
        nextValue = null;
      }

      onChange({
        target: { name, value: nextValue },
      });

      setSelectedIndex(0);
    };

    const handleDeleteAsset = (asset) => {
      let nextValue;

      if (multiple) {
        const nextSelectedAssets = selectedAssets.filter((prevAsset) => prevAsset.id !== asset.id);

        nextValue = nextSelectedAssets.length > 0 ? nextSelectedAssets : null;
      } else {
        nextValue = null;
      }

      onChange({
        target: { name, value: nextValue },
      });

      setSelectedIndex(0);
    };

    const handleAssetEdit = (asset) => {
      const nextSelectedAssets = selectedAssets.map((prevAsset) =>
        prevAsset.id === asset.id ? asset : prevAsset
      );

      onChange({
        target: { name, value: multiple ? nextSelectedAssets : nextSelectedAssets[0] },
      });
    };

    const validateAssetsTypes = (assets, callback) => {
      const allowedAssets = getAllowedFiles(fieldAllowedTypes, assets);

      if (allowedAssets.length > 0) {
        callback(allowedAssets);
      } else {
        toggleNotification({
          type: 'danger',
          timeout: 4000,
          message: formatMessage(
            {
              id: getTrad('input.notification.not-supported'),
              defaultMessage: `You can't upload this type of file.`,
            },
            {
              fileTypes: fieldAllowedTypes.join(','),
            }
          ),
        });
      }
    };

    const handleAssetDrop = (assets) => {
      validateAssetsTypes(assets, (allowedAssets) => {
        setDroppedAssets(allowedAssets);
        setStep(STEPS.AssetUpload);
      });
    };

    if (multiple && selectedAssets.length > 0) {
      label = `${label} (${selectedIndex + 1} / ${selectedAssets.length})`;
    }

    const handleNext = () => {
      setSelectedIndex((current) => (current < selectedAssets.length - 1 ? current + 1 : 0));
    };

    const handlePrevious = () => {
      setSelectedIndex((current) => (current > 0 ? current - 1 : selectedAssets.length - 1));
    };

    const handleFilesUploadSucceeded = (uploadedFiles) => {
      setUploadedFiles((prev) => [...prev, ...uploadedFiles]);
    };

    let initiallySelectedAssets = selectedAssets;

    if (uploadedFiles.length > 0) {
      const allowedUploadedFiles = getAllowedFiles(fieldAllowedTypes, uploadedFiles);

      initiallySelectedAssets = multiple
        ? [...allowedUploadedFiles, ...selectedAssets]
        : [allowedUploadedFiles[0]];
    }

    return (
      <>
        <CarouselAssets
          ref={forwardedRef}
          assets={selectedAssets}
          disabled={disabled}
          label={label}
          labelAction={labelAction}
          onDeleteAsset={handleDeleteAsset}
          onDeleteAssetFromMediaLibrary={handleDeleteAssetFromMediaLibrary}
          onAddAsset={() => setStep(STEPS.AssetSelect)}
          onDropAsset={handleAssetDrop}
          onEditAsset={handleAssetEdit}
          onNext={handleNext}
          onPrevious={handlePrevious}
          error={error}
          hint={hint}
          required={required}
          selectedAssetIndex={selectedIndex}
          trackedLocation="content-manager"
        />

        {step === STEPS.AssetSelect && (
          <AssetDialog
            allowedTypes={fieldAllowedTypes}
            initiallySelectedAssets={initiallySelectedAssets}
            folderId={folderId}
            onClose={() => {
              setStep(undefined);
              setFolderId(null);
            }}
            open={step === STEPS.AssetSelect}
            onValidate={handleValidation}
            multiple={multiple}
            onAddAsset={() => setStep(STEPS.AssetUpload)}
            onAddFolder={() => setStep(STEPS.FolderCreate)}
            onChangeFolder={(folder) => setFolderId(folder)}
            trackedLocation="content-manager"
          />
        )}

        {step === STEPS.AssetUpload && (
          <UploadAssetDialog
            open={step === STEPS.AssetUpload}
            onClose={() => setStep(STEPS.AssetSelect)}
            initialAssetsToAdd={droppedAssets}
            addUploadedFiles={handleFilesUploadSucceeded}
            trackedLocation="content-manager"
            folderId={folderId}
            validateAssetsTypes={validateAssetsTypes}
          />
        )}

        {step === STEPS.FolderCreate && (
          <EditFolderDialog
            open={step === STEPS.FolderCreate}
            onClose={() => setStep(STEPS.AssetSelect)}
            parentFolderId={folderId}
          />
        )}
      </>
    );
  }
);

MediaLibraryInput.defaultProps = {
  attribute: { allowedTypes: ['videos', 'files', 'images', 'audios'], multiple: false },
  disabled: false,
  hint: undefined,
  label: undefined,
  labelAction: undefined,
  required: false,
};

MediaLibraryInput.propTypes = {
  attribute: PropTypes.shape({
    allowedTypes: PropTypes.arrayOf(PropTypes.string),
    multiple: PropTypes.bool,
  }),
  disabled: PropTypes.bool,
  hint: PropTypes.string,
  label: PropTypes.string,
  labelAction: PropTypes.node,

  name: PropTypes.string.isRequired,
  required: PropTypes.bool,
};
