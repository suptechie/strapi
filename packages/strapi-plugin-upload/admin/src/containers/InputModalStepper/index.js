import React from 'react';
import PropTypes from 'prop-types';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import DragLayer from '../../components/DragLayer';
import InputModalStepper from './InputModalStepper';
import InputModalStepperProvider from '../InputModalStepperProvider';

const InputModal = ({
  allowedTypes,
  filesToUpload,
  fileToEdit,
  isOpen,
  multiple,
  noNavigation,
  onClosed,
  onInputMediaChange,
  onToggle,
  selectedFiles,
  step,
}) => {
  const singularTypes = allowedTypes.map(type => type.substring(0, type.length - 1));

  return (
    <DndProvider backend={HTML5Backend}>
      <DragLayer />
      <InputModalStepperProvider
        onClosed={onClosed}
        initialFilesToUpload={filesToUpload}
        initialFileToEdit={fileToEdit}
        isOpen={isOpen}
        multiple={multiple}
        noNavigation={noNavigation}
        selectedFiles={selectedFiles}
        step={step}
        allowedTypes={singularTypes}
      >
        <InputModalStepper
          isOpen={isOpen}
          noNavigation={noNavigation}
          onToggle={onToggle}
          onInputMediaChange={onInputMediaChange}
        />
      </InputModalStepperProvider>
    </DndProvider>
  );
};

InputModal.defaultProps = {
  allowedTypes: [],
  filesToUpload: null,
  fileToEdit: null,
  noNavigation: false,
  onInputMediaChange: () => {},
  onToggle: () => {},
  selectedFiles: [],
  step: 'list',
};

InputModal.propTypes = {
  allowedTypes: PropTypes.arrayOf(PropTypes.string),
  filesToUpload: PropTypes.object,
  fileToEdit: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  multiple: PropTypes.bool.isRequired,
  noNavigation: PropTypes.bool,
  onClosed: PropTypes.func.isRequired,
  onInputMediaChange: PropTypes.func,
  onToggle: PropTypes.func,
  selectedFiles: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  step: PropTypes.string,
};

export default InputModal;
