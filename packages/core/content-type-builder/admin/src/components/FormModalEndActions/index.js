/**
 *
 * FormModalEndActions
 *
 */

import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Button } from '@strapi/parts/Button';
import AddIcon from '@strapi/icons/AddIcon';
import { getTrad } from '../../utils';

const FormModalEndActions = ({
  categoryName,
  deleteCategory,
  deleteContentType,
  deleteComponent,
  isAttributeModal,
  isEditingAttribute,
  isContentTypeModal,
  isCreatingContentType,
  isCreatingComponent,
  isComponentModal,
  isEditingCategory,
  onSubmitEditAttribute,
  onSubmitCreateContentType,
  onSubmitCreateComponent,
  onSubmitEditCategory,
  onSubmitEditContentType,
  onSubmitEditComponent,
}) => {
  const { formatMessage } = useIntl();

  if (isComponentModal) {
    console.log('is component modal');

    return (
      <>
        {!isCreatingComponent && (
          <>
            <Button
              type="button"
              variant="danger"
              onClick={e => {
                e.preventDefault();
                deleteComponent();
              }}
            >
              {formatMessage({
                id: getTrad('form.button.delete'),
                defaultMessage: 'Delete',
              })}
            </Button>
            <Button
              type="submit"
              variant="default"
              onClick={e => {
                e.preventDefault();

                onSubmitEditComponent(e, false);
              }}
            >
              {formatMessage({
                id: getTrad('form.button.finish'),
                defaultMessage: 'Finish',
              })}
            </Button>
          </>
        )}
        {isCreatingComponent && (
          <Button
            type="submit"
            variant="secondary"
            onClick={e => {
              e.preventDefault();

              onSubmitCreateComponent(e, true);
            }}
          >
            {formatMessage({
              id: getTrad('form.button.continue'),
              defaultMessage: 'Continue',
            })}
          </Button>
        )}
      </>
    );
  }

  if (isAttributeModal) {
    console.log('is attribute modal');

    return (
      <>
        <Button
          type={isEditingAttribute ? 'button' : 'submit'}
          variant="secondary"
          onClick={e => {
            e.preventDefault();

            onSubmitEditAttribute(e, true);
          }}
          startIcon={<AddIcon />}
        >
          {formatMessage({
            id: getTrad('form.button.add-field'),
            defaultMessage: 'Add another field',
          })}
        </Button>
        <Button
          type={isEditingAttribute ? 'submit' : 'button'}
          variant="default"
          onClick={e => {
            e.preventDefault();

            onSubmitEditAttribute(e, false);
          }}
        >
          {formatMessage({
            id: getTrad('form.button.finish'),
            defaultMessage: 'Finish',
          })}
        </Button>
      </>
    );
  }

  if (isContentTypeModal) {
    console.log('is contentType modal');

    return (
      <>
        {!isCreatingContentType && (
          <>
            <Button
              type="button"
              variant="danger"
              onClick={e => {
                e.preventDefault();
                deleteContentType();
              }}
            >
              {formatMessage({
                id: getTrad('form.button.delete'),
                defaultMessage: 'Delete',
              })}
            </Button>
            <Button
              type="submit"
              variant="default"
              onClick={e => {
                e.preventDefault();

                onSubmitEditContentType(e, false);
              }}
            >
              {formatMessage({
                id: getTrad('form.button.finish'),
                defaultMessage: 'Finish',
              })}
            </Button>
          </>
        )}
        {isCreatingContentType && (
          <Button
            type="submit"
            variant="secondary"
            onClick={e => {
              e.preventDefault();

              onSubmitCreateContentType(e, true);
            }}
          >
            {formatMessage({
              id: getTrad('form.button.continue'),
              defaultMessage: 'Continue',
            })}
          </Button>
        )}
      </>
    );
  }

  if (isEditingCategory) {
    console.log('is editing category');

    return (
      <>
        <Button
          type="button"
          variant="danger"
          onClick={e => {
            e.preventDefault();

            deleteCategory(categoryName);
          }}
        >
          {formatMessage({
            id: getTrad('form.button.delete'),
            defaultMessage: 'Delete',
          })}
        </Button>
        <Button
          type="submit"
          variant="default"
          onClick={e => {
            e.preventDefault();

            onSubmitEditCategory(e);
          }}
        >
          {formatMessage({
            id: getTrad('form.button.finish'),
            defaultMessage: 'finish',
          })}
        </Button>
      </>
    );
  }

  return (
    <div>
      <p>
        {formatMessage({ id: getTrad('component.name'), defaultMessage: 'Form Modal End Actions' })}
      </p>
    </div>
  );
};

FormModalEndActions.defaultProps = {
  categoryName: null,
};

FormModalEndActions.propTypes = {
  categoryName: PropTypes.string,
  deleteCategory: PropTypes.func.isRequired,
  deleteComponent: PropTypes.func.isRequired,
  deleteContentType: PropTypes.func.isRequired,
  isAttributeModal: PropTypes.bool.isRequired,
  isContentTypeModal: PropTypes.bool.isRequired,
  isCreatingContentType: PropTypes.bool.isRequired,
  isCreatingComponent: PropTypes.bool.isRequired,
  isComponentModal: PropTypes.bool.isRequired,
  isEditingAttribute: PropTypes.bool.isRequired,
  isEditingCategory: PropTypes.bool.isRequired,
  onSubmitEditAttribute: PropTypes.func.isRequired,
  onSubmitCreateContentType: PropTypes.func.isRequired,
  onSubmitCreateComponent: PropTypes.func.isRequired,
  onSubmitEditCategory: PropTypes.func.isRequired,
  onSubmitEditContentType: PropTypes.func.isRequired,
  onSubmitEditComponent: PropTypes.func.isRequired,
};

export default FormModalEndActions;
