import React, { useCallback, useEffect, useMemo, useRef, useReducer, useState } from 'react';
import {
  cloneDeep,
  get,
  isEmpty,
  isEqual,
  // pick,
  set,
} from 'lodash';
import PropTypes from 'prop-types';
import {
  Prompt,
  Redirect,
  useParams,
  useLocation,
  useHistory,
  useRouteMatch,
} from 'react-router-dom';
import {
  LoadingIndicatorPage,
  request,
  useGlobalContext,
  useUser,
  OverlayBlocker,
} from 'strapi-helper-plugin';
import EditViewDataManagerContext from '../../contexts/EditViewDataManager';
import { getTrad } from '../../utils';
import pluginId from '../../pluginId';
import init from './init';
import reducer, { initialState } from './reducer';
import {
  cleanData,
  createDefaultForm,
  createYupSchema,
  getFieldsActionMatchingPermissions,
  getFilesToUpload,
  getYupInnerErrors,
  removePasswordFieldsFromData,
} from './utils';

const getRequestUrl = path => `/${pluginId}/explorer/${path}`;

const EditViewDataManagerProvider = ({
  allLayoutData,
  allowedActions: { canCreate, canRead, canUpdate },
  children,
  isSingleType,
  redirectToPreviousPage,
  slug,
}) => {
  // return null;
  const { id } = useParams();
  const [reducerState, dispatch] = useReducer(reducer, initialState, init);
  const { state } = useLocation();
  const abortController = new AbortController();
  const { signal } = abortController;

  const { push, replace } = useHistory();
  // Here in case of a 403 response when fetching data we will either redirect to the previous page
  // Or to the homepage if there's no state in the history stack
  const from = get(state, 'from', '/');
  const {
    formErrors,
    initialData,
    isLoading,
    modifiedData,
    modifiedDZName,
    shouldCheckErrors,
  } = reducerState.toJS();

  // This isCreatingEntry logic will be needed, but it needs to be passed from the parent
  const isCreatingEntry = id === 'create';
  // TODO: remove logic
  const [, setIsCreatingEntry] = useState(id === 'create');

  // TODO: this should be in the reducer
  const [status, setStatus] = useState('resolved');
  const currentContentTypeLayout = get(allLayoutData, ['contentType'], {});

  const hasDraftAndPublish = useMemo(() => {
    return get(currentContentTypeLayout, ['schema', 'options', 'draftAndPublish'], false);
  }, [currentContentTypeLayout]);

  const shouldNotRunValidations = useMemo(() => {
    return hasDraftAndPublish && !initialData.published_at;
  }, [hasDraftAndPublish, initialData.published_at]);

  // TODO: remove
  const {
    params: { contentType },
  } = useRouteMatch('/plugins/content-manager/:contentType');

  // TODO this could be removed and done in the FieldComponent component
  // This is used for the readonly mode when updating an entry
  const allDynamicZoneFields = useMemo(() => {
    const attributes = get(currentContentTypeLayout, ['schema', 'attributes'], {});

    const dynamicZoneFields = Object.keys(attributes).filter(attrName => {
      return get(attributes, [attrName, 'type'], '') === 'dynamiczone';
    });

    return dynamicZoneFields;
  }, [currentContentTypeLayout]);

  const { emitEvent, formatMessage } = useGlobalContext();
  const emitEventRef = useRef(emitEvent);
  const userPermissions = useUser();

  const {
    createActionAllowedFields,
    readActionAllowedFields,
    updateActionAllowedFields,
  } = useMemo(() => {
    return getFieldsActionMatchingPermissions(userPermissions, slug);
  }, [userPermissions, slug]);

  const cleanReceivedDataFromPasswords = useCallback(
    data => {
      return removePasswordFieldsFromData(
        data,
        allLayoutData.contentType,
        allLayoutData.components
      );
    },
    [allLayoutData.components, allLayoutData.contentType]
  );

  const shouldRedirectToHomepageWhenCreatingEntry = useMemo(() => {
    if (isLoading) {
      return false;
    }

    if (!isCreatingEntry) {
      return false;
    }

    if (canCreate === false) {
      return true;
    }

    return false;
  }, [isCreatingEntry, canCreate, isLoading]);

  const shouldRedirectToHomepageWhenEditingEntry = useMemo(() => {
    if (isLoading) {
      return false;
    }

    if (isCreatingEntry) {
      return false;
    }

    if (canRead === false && canUpdate === false) {
      return true;
    }

    return false;
  }, [isLoading, isCreatingEntry, canRead, canUpdate]);

  useEffect(() => {
    if (!isLoading) {
      checkFormErrors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldCheckErrors]);

  useEffect(() => {
    if (shouldRedirectToHomepageWhenEditingEntry) {
      strapi.notification.info(getTrad('permissions.not-allowed.update'));
    }
  }, [shouldRedirectToHomepageWhenEditingEntry]);

  useEffect(() => {
    if (shouldRedirectToHomepageWhenCreatingEntry) {
      strapi.notification.info(getTrad('permissions.not-allowed.create'));
    }
  }, [shouldRedirectToHomepageWhenCreatingEntry]);

  // Reset all props when changing from one ct to another
  useEffect(() => {
    console.log('slug');
    dispatch({ type: 'RESET_PROPS' });
  }, [slug]);

  // Reset all props when navigating from one entry to another in the same ct
  useEffect(() => {
    console.log('id');
    dispatch({ type: 'RESET_FORM' });
  }, [id]);

  // SET THE DEFAULT LAYOUT the effect is applied when the slug changes
  useEffect(() => {
    const componentsDataStructure = Object.keys(allLayoutData.components).reduce((acc, current) => {
      acc[current] = createDefaultForm(
        get(allLayoutData, ['components', current, 'schema', 'attributes'], {}),
        allLayoutData.components
      );

      return acc;
    }, {});

    const contentTypeDataStructure = createDefaultForm(
      currentContentTypeLayout.schema.attributes,
      allLayoutData.components
    );

    console.log('initialize');
    dispatch({
      type: 'SET_DEFAULT_DATA_STRUCTURES',
      componentsDataStructure,
      contentTypeDataStructure,
    });
  }, [allLayoutData, currentContentTypeLayout.schema.attributes]);

  useEffect(() => {
    if (isCreatingEntry) {
      dispatch({ type: 'INITIALIZE_FORM' });
    }
  }, [isCreatingEntry]);

  const fetchURL = useMemo(() => {
    if (isCreatingEntry) {
      return null;
    }

    return getRequestUrl(`${slug}/${id}`);
  }, [slug, id, isCreatingEntry]);

  useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;

    const getData = async signal => {
      dispatch({ type: 'GET_DATA' });

      try {
        const data = await request(fetchURL, { method: 'GET', signal });

        dispatch({
          type: 'GET_DATA_SUCCEEDED',
          data: cleanReceivedDataFromPasswords(data),
        });
      } catch (err) {
        console.error(err);
        const resStatus = get(err, 'response.status', null);

        if (resStatus === 404) {
          push(from);

          return;
        }

        // Not allowed to read a document
        if (resStatus === 403) {
          strapi.notification.info(getTrad('permissions.not-allowed.update'));

          push(from);
        }
      }
    };

    if (fetchURL) {
      console.log('will fetch');
      getData(signal);
    }

    return () => {
      console.log('end fetch');
      abortController.abort();
    };
  }, [fetchURL, push, from, cleanReceivedDataFromPasswords]);

  const addComponentToDynamicZone = useCallback((keys, componentUid, shouldCheckErrors = false) => {
    emitEventRef.current('didAddComponentToDynamicZone');

    dispatch({
      type: 'ADD_COMPONENT_TO_DYNAMIC_ZONE',
      keys: keys.split('.'),
      componentUid,
      shouldCheckErrors,
    });
  }, []);

  const addNonRepeatableComponentToField = useCallback((keys, componentUid) => {
    dispatch({
      type: 'ADD_NON_REPEATABLE_COMPONENT_TO_FIELD',
      keys: keys.split('.'),
      componentUid,
    });
  }, []);

  const addRelation = useCallback(({ target: { name, value } }) => {
    dispatch({
      type: 'ADD_RELATION',
      keys: name.split('.'),
      value,
    });
  }, []);

  const addRepeatableComponentToField = useCallback(
    (keys, componentUid, shouldCheckErrors = false) => {
      dispatch({
        type: 'ADD_REPEATABLE_COMPONENT_TO_FIELD',
        keys: keys.split('.'),
        componentUid,
        shouldCheckErrors,
      });
    },
    []
  );

  // TODO: switch to useCallback
  const checkFormErrors = async (dataToSet = {}) => {
    const schema = createYupSchema(
      currentContentTypeLayout,
      {
        components: get(allLayoutData, 'components', {}),
      },
      { isCreatingEntry, isDraft: shouldNotRunValidations, isFromComponent: false }
    );
    let errors = {};
    const updatedData = cloneDeep(modifiedData);

    if (!isEmpty(updatedData)) {
      set(updatedData, dataToSet.path, dataToSet.value);
    }

    try {
      // Validate the form using yup
      await schema.validate(updatedData, { abortEarly: false });
    } catch (err) {
      errors = getYupInnerErrors(err);

      if (modifiedDZName) {
        errors = Object.keys(errors).reduce((acc, current) => {
          const dzName = current.split('.')[0];

          if (dzName !== modifiedDZName) {
            acc[current] = errors[current];
          }

          return acc;
        }, {});
      }
    }

    dispatch({
      type: 'SET_ERRORS',
      errors,
    });
  };

  const handleChange = useCallback(
    ({ target: { name, value, type } }, shouldSetInitialValue = false) => {
      let inputValue = value;

      // Empty string is not a valid date,
      // Set the date to null when it's empty
      if (type === 'date' && value === '') {
        inputValue = null;
      }

      if (type === 'password' && !value) {
        dispatch({
          type: 'REMOVE_PASSWORD_FIELD',
          keys: name.split('.'),
        });

        return;
      }

      // Allow to reset enum
      if (type === 'select-one' && value === '') {
        inputValue = null;
      }

      // Allow to reset number input
      if (type === 'number' && value === '') {
        inputValue = null;
      }

      dispatch({
        type: 'ON_CHANGE',
        keys: name.split('.'),
        value: inputValue,
        shouldSetInitialValue,
      });
    },
    []
  );

  const yupSchema = useMemo(() => {
    // TODO
    const options = { isCreatingEntry, isDraft: false, isFromComponent: false };

    return createYupSchema(
      currentContentTypeLayout,
      {
        components: allLayoutData.components || {},
      },
      options
    );
  }, [allLayoutData.components, currentContentTypeLayout, isCreatingEntry]);

  const createFormData = useCallback(
    data => {
      // Set the loading state in the plugin header
      const filesToUpload = getFilesToUpload(modifiedData);
      // Remove keys that are not needed
      // Clean relations
      const cleanedData = cleanData(data, currentContentTypeLayout, allLayoutData.components);

      const formData = new FormData();

      formData.append('data', JSON.stringify(cleanedData));

      // We don't do upload anymore since we are using the ML in the CM
      // however, I am leaving the code here just in case we need it sometime and it also a great
      // example on how to do upload upon entry creation/edition.
      Object.keys(filesToUpload).forEach(key => {
        const files = filesToUpload[key];

        files.forEach(file => {
          formData.append(`files.${key}`, file);
        });
      });

      return formData;
    },
    [allLayoutData.components, currentContentTypeLayout, modifiedData]
  );

  const trackerProperty = useMemo(() => {
    if (!hasDraftAndPublish) {
      return {};
    }

    // TODO
    return { status: 'draft' };
    // return isDraft ? { status: 'draft' } : {};
  }, [hasDraftAndPublish]);

  const displayErrors = useCallback(err => {
    const errorPayload = err.response.payload;
    console.error(errorPayload);
    let errorMessage = get(errorPayload, ['message'], 'Bad Request');

    if (typeof errorMessage === 'string') {
      strapi.notification.error(errorMessage);
    }

    // TODO handle errors correctly when back-end ready
    if (Array.isArray(errorMessage)) {
      errorMessage = get(errorMessage, ['0', 'messages', '0', 'id']);

      strapi.notification.error(errorMessage);
    }
  }, []);

  const onPost = useCallback(
    async data => {
      const formData = createFormData(data);
      const endPoint = getRequestUrl(slug);

      try {
        // Show a loading button in the EditView/Header.js && lock the app => no navigation
        setStatus('submit-pending');

        const response = await request(
          endPoint,
          { method: 'POST', headers: {}, body: formData },
          false,
          false
        );

        emitEventRef.current('didCreateEntry', trackerProperty);
        strapi.notification.success(getTrad('success.record.save'));
        // Enable navigation and remove loaders
        setStatus('resolved');

        dispatch({ type: 'SUBMIT_SUCCEEDED', data: response });

        replace(`/plugins/${pluginId}/collectionType/${slug}/${response.id}`);
      } catch (err) {
        displayErrors(err);
        emitEventRef.current('didNotCreateEntry', { error: err, trackerProperty });
        // Enable navigation and remove loaders
        setStatus('resolved');
      }
    },
    [createFormData, displayErrors, replace, slug, trackerProperty]
  );

  const onPut = useCallback(
    async data => {
      const formData = createFormData(data);
      const endPoint = getRequestUrl(`${slug}/${data.id}`);

      try {
        // Show a loading button in the EditView/Header.js && lock the app => no navigation
        setStatus('submit-pending');
        // TODO fix tracker property
        // emitEventRef.current('willEditEntry', trackerProperty);

        const response = await request(
          endPoint,
          { method: 'PUT', headers: {}, body: formData },
          false,
          false
        );

        // TODO
        // emitEventRef.current('didEditEntry', { trackerProperty });
        // Enable navigation and remove loaders
        setStatus('resolved');

        dispatch({ type: 'SUBMIT_SUCCEEDED', data: cleanReceivedDataFromPasswords(response) });
      } catch (err) {
        console.log({ err });
        displayErrors(err);
        // emitEventRef.current('didNotCreateEntry', { error: err, trackerProperty });
        // Enable navigation and remove loaders
        setStatus('resolved');
      }
    },
    [cleanReceivedDataFromPasswords, createFormData, displayErrors, slug]
  );

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault();
      let errors = {};

      // First validate the form
      try {
        await yupSchema.validate(modifiedData, { abortEarly: false });

        if (isCreatingEntry) {
          onPost(modifiedData);
        } else {
          onPut(modifiedData);
        }
      } catch (err) {
        console.error('ValidationError');
        console.error(err);

        errors = getYupInnerErrors(err);
      }
      dispatch({
        type: 'SET_FORM_ERRORS',
        errors,
      });
    },
    [isCreatingEntry, modifiedData, onPost, onPut, yupSchema]
  );

  // TODO split the PUT and POST logic
  const handleSubmitOld = async e => {
    e.preventDefault();
    // TODO fix this because it needs the draft info
    const trackerProperty = hasDraftAndPublish ? { status: 'draft' } : {};

    // Create yup schema
    const schema = createYupSchema(
      currentContentTypeLayout,
      {
        components: get(allLayoutData, 'components', {}),
      },
      { isCreatingEntry, isDraft: shouldNotRunValidations, isFromComponent: false }
    );

    try {
      // Validate the form using yup
      await schema.validate(modifiedData, { abortEarly: false });

      // Show a loading button in the EditView/Header.js
      setStatus('submit-pending');

      // Set the loading state in the plugin header
      const filesToUpload = getFilesToUpload(modifiedData);
      // Remove keys that are not needed
      // Clean relations
      const cleanedData = cleanData(
        cloneDeep(modifiedData),
        currentContentTypeLayout,
        allLayoutData.components
      );

      const formData = new FormData();

      formData.append('data', JSON.stringify(cleanedData));

      Object.keys(filesToUpload).forEach(key => {
        const files = filesToUpload[key];

        files.forEach(file => {
          formData.append(`files.${key}`, file);
        });
      });

      // Change the request helper default headers so we can pass a FormData
      const headers = {};
      const method = isCreatingEntry ? 'POST' : 'PUT';
      let endPoint;

      // All endpoints for creation and edition are the same for both content types
      // But, the id from the URL didn't exist for the single types.
      // So, we use the id of the modified data if this one is setted.
      if (isCreatingEntry) {
        endPoint = slug;
      } else if (modifiedData) {
        endPoint = `${slug}/${modifiedData.id}`;
      } else {
        endPoint = `${slug}/${id}`;
      }

      if (!isCreatingEntry) {
        emitEvent('willEditEntry', trackerProperty);
      }

      try {
        // Time to actually send the data
        const res = await request(
          getRequestUrl(endPoint),
          {
            method,
            headers,
            body: formData,
            signal,
          },
          false,
          false
        );
        emitEvent(isCreatingEntry ? 'didCreateEntry' : 'didEditEntry', trackerProperty);

        setStatus('resolved');

        dispatch({
          type: 'SUBMIT_SUCCESS',
        });
        strapi.notification.success(`${pluginId}.success.record.save`);

        setIsCreatingEntry(false);

        if (!isSingleType) {
          replace(`/plugins/${pluginId}/${contentType}/${slug}/${res.id}`);
        }
      } catch (err) {
        console.error({ err });
        setStatus('resolved');

        const error = get(
          err,
          ['response', 'payload', 'message', '0', 'messages', '0', 'id'],
          'SERVER ERROR'
        );

        // Handle validations errors from the API
        if (error === 'ValidationError') {
          const errors = get(err, ['response', 'payload', 'data', '0', 'errors'], {});
          const formattedErrors = Object.keys(errors).reduce((acc, current) => {
            acc[current] = { id: errors[current][0] };

            return acc;
          }, {});

          dispatch({
            type: 'SUBMIT_ERRORS',
            errors: formattedErrors,
          });
        } else {
          emitEvent(isCreatingEntry ? 'didNotCreateEntry' : 'didNotEditEntry', {
            error: err,
            ...trackerProperty,
          });
        }

        strapi.notification.error(error);
      }
    } catch (err) {
      console.error({ err });
      const errors = getYupInnerErrors(err);
      setStatus('resolved');

      dispatch({
        type: 'SUBMIT_ERRORS',
        errors,
      });
    }
  };

  console.log({ handleSubmitOld });

  const handlePublish = useCallback(async () => {
    // Create yup schema
    const schema = createYupSchema(
      currentContentTypeLayout,
      {
        components: get(allLayoutData, 'components', {}),
      },
      { isCreatingEntry, isDraft: false, isFromComponent: false }
    );

    try {
      // Validate the form using yup
      await schema.validate(modifiedData, { abortEarly: false });

      // Show a loading button in the EditView/Header.js
      setStatus('publish-pending');

      try {
        emitEventRef.current('willPublishEntry');

        // Time to actually send the data
        const data = await request(
          getRequestUrl(`${slug}/publish/${id || modifiedData.id}`),
          {
            method: 'POST',
          },
          false,
          false
        );

        emitEventRef.current('didPublishEntry');

        setStatus('resolved');

        dispatch({
          type: 'PUBLISH_SUCCESS',
          data,
        });
        strapi.notification.success(`${pluginId}.success.record.publish`);
      } catch (err) {
        // ---------- @Soupette Is this error handling still mandatory? ----------
        // The api error send response.payload.message: 'The error message'.
        // There isn't : response.payload.message[0].messages[0].id
        console.error({ err });
        setStatus('resolved');

        const error = get(
          err,
          ['response', 'payload', 'message', '0', 'messages', '0', 'id'],
          'SERVER ERROR'
        );

        if (error === 'ValidationError') {
          const errors = get(err, ['response', 'payload', 'data', '0', 'errors'], {});
          const formattedErrors = Object.keys(errors).reduce((acc, current) => {
            acc[current] = { id: errors[current][0] };

            return acc;
          }, {});

          dispatch({
            type: 'PUBLISH_ERRORS',
            errors: formattedErrors,
          });
        }

        const errorMessage = get(err, ['response', 'payload', 'message'], 'SERVER ERROR');
        strapi.notification.error(errorMessage);
      }
    } catch (err) {
      console.error({ err });
      const errors = getYupInnerErrors(err);
      console.log({ errors });
      setStatus('resolved');

      dispatch({
        type: 'PUBLISH_ERRORS',
        errors,
      });
    }
  }, [allLayoutData, currentContentTypeLayout, id, isCreatingEntry, modifiedData, slug]);

  const handleUnpublish = useCallback(async () => {
    try {
      setStatus('unpublish-pending');

      emitEventRef.current('willUnpublishEntry');

      const data = await request(
        getRequestUrl(`${slug}/unpublish/${id || modifiedData.id}`),
        {
          method: 'POST',
        },
        false,
        false
      );

      emitEventRef.current('didUnpublishEntry');
      setStatus('resolved');

      dispatch({
        type: 'UNPUBLISH_SUCCESS',
        data,
      });
      strapi.notification.success(`${pluginId}.success.record.unpublish`);
    } catch (err) {
      console.error({ err });
      setStatus('resolved');

      const errorMessage = get(err, ['response', 'payload', 'message'], 'SERVER ERROR');
      strapi.notification.error(errorMessage);
    }
  }, [id, modifiedData, slug]);

  const shouldCheckDZErrors = useCallback(
    dzName => {
      const doesDZHaveError = Object.keys(formErrors).some(key => key.split('.')[0] === dzName);
      const shouldCheckErrors = !isEmpty(formErrors) && doesDZHaveError;

      return shouldCheckErrors;
    },
    [formErrors]
  );

  const moveComponentDown = useCallback(
    (dynamicZoneName, currentIndex) => {
      emitEventRef.current('changeComponentsOrder');

      dispatch({
        type: 'MOVE_COMPONENT_DOWN',
        dynamicZoneName,
        currentIndex,
        shouldCheckErrors: shouldCheckDZErrors(dynamicZoneName),
      });
    },
    [shouldCheckDZErrors]
  );

  const moveComponentUp = useCallback(
    (dynamicZoneName, currentIndex) => {
      emitEventRef.current('changeComponentsOrder');

      dispatch({
        type: 'MOVE_COMPONENT_UP',
        dynamicZoneName,
        currentIndex,
        shouldCheckErrors: shouldCheckDZErrors(dynamicZoneName),
      });
    },
    [shouldCheckDZErrors]
  );

  const moveComponentField = useCallback((pathToComponent, dragIndex, hoverIndex) => {
    dispatch({
      type: 'MOVE_COMPONENT_FIELD',
      pathToComponent,
      dragIndex,
      hoverIndex,
    });
  }, []);

  const moveRelation = useCallback((dragIndex, overIndex, name) => {
    dispatch({
      type: 'MOVE_FIELD',
      dragIndex,
      overIndex,
      keys: name.split('.'),
    });
  }, []);

  const onRemoveRelation = useCallback(keys => {
    dispatch({
      type: 'REMOVE_RELATION',
      keys,
    });
  }, []);

  const removeComponentFromDynamicZone = useCallback(
    (dynamicZoneName, index) => {
      emitEventRef.current('removeComponentFromDynamicZone');

      dispatch({
        type: 'REMOVE_COMPONENT_FROM_DYNAMIC_ZONE',
        dynamicZoneName,
        index,
        shouldCheckErrors: shouldCheckDZErrors(dynamicZoneName),
      });
    },
    [shouldCheckDZErrors]
  );

  const removeComponentFromField = useCallback((keys, componentUid) => {
    dispatch({
      type: 'REMOVE_COMPONENT_FROM_FIELD',
      keys: keys.split('.'),
      componentUid,
    });
  }, []);

  const removeRepeatableField = useCallback((keys, componentUid) => {
    dispatch({
      type: 'REMOVE_REPEATABLE_FIELD',
      keys: keys.split('.'),
      componentUid,
    });
  }, []);

  // TODO: same here I am not sure this is needed anymore
  const deleteSuccess = () => {
    dispatch({
      type: 'DELETE_SUCCEEDED',
    });
  };

  // TODO: I am not sure this is needed anymore
  const resetData = () => {
    dispatch({
      type: 'RESET_DATA',
    });
  };

  // TODO
  const clearData = useCallback(() => {
    if (isSingleType) {
      setIsCreatingEntry(true);
    }

    dispatch({
      type: 'SET_DEFAULT_MODIFIED_DATA_STRUCTURE',
      contentTypeDataStructure: {},
    });
  }, [isSingleType]);

  // TODO switch to useCallback
  const triggerFormValidation = () => {
    dispatch({
      type: 'TRIGGER_FORM_VALIDATION',
    });
  };

  const overlayBlockerParams = useMemo(
    () => ({
      children: <div />,
      noGradient: true,
    }),
    []
  );

  // Redirect the user to the homepage if he is not allowed to create a document
  if (shouldRedirectToHomepageWhenCreatingEntry) {
    return <Redirect to="/" />;
  }

  // Redirect the user to the previous page if he is not allowed to read/update a document
  if (shouldRedirectToHomepageWhenEditingEntry) {
    return <Redirect to={from} />;
  }

  return (
    <EditViewDataManagerContext.Provider
      value={{
        addComponentToDynamicZone,
        addNonRepeatableComponentToField,
        addRelation,
        addRepeatableComponentToField,
        allLayoutData,
        allDynamicZoneFields,
        checkFormErrors,
        clearData,
        createActionAllowedFields,
        deleteSuccess,
        formErrors,
        hasDraftAndPublish,
        initialData,
        isCreatingEntry,
        isSingleType,
        shouldNotRunValidations,
        status,
        layout: currentContentTypeLayout,
        modifiedData,
        moveComponentDown,
        moveComponentField,
        moveComponentUp,
        moveRelation,
        onChange: handleChange,
        onPublish: handlePublish,
        onUnpublish: handleUnpublish,
        onRemoveRelation,
        readActionAllowedFields,
        redirectToPreviousPage,
        removeComponentFromDynamicZone,
        removeComponentFromField,
        removeRepeatableField,
        resetData,
        slug,
        triggerFormValidation,
        updateActionAllowedFields,
      }}
    >
      <>
        <OverlayBlocker
          key="overlayBlocker"
          isOpen={status !== 'resolved'}
          {...overlayBlockerParams}
        />
        {isLoading ? (
          <LoadingIndicatorPage />
        ) : (
          <>
            <Prompt
              when={!isEqual(modifiedData, initialData)}
              message={formatMessage({ id: 'global.prompt.unsaved' })}
            />
            <form onSubmit={handleSubmit}>{children}</form>
          </>
        )}
      </>
    </EditViewDataManagerContext.Provider>
  );
};

EditViewDataManagerProvider.defaultProps = {
  redirectToPreviousPage: () => {},
};

EditViewDataManagerProvider.propTypes = {
  allLayoutData: PropTypes.object.isRequired,
  allowedActions: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
  isSingleType: PropTypes.bool.isRequired,
  redirectToPreviousPage: PropTypes.func,
  slug: PropTypes.string.isRequired,
};

export default EditViewDataManagerProvider;
