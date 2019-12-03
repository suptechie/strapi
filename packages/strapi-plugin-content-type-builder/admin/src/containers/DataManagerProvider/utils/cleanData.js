import { get, has, isEqual, omit } from 'lodash';
import makeUnique from '../../../utils/makeUnique';

const getCreatedAndModifiedComponents = (allComponents, initialComponents) => {
  const componentUIDsToReturn = Object.keys(allComponents).filter(compoUid => {
    const currentCompo = get(allComponents, compoUid, {});
    const initialCompo = get(initialComponents, compoUid, {});
    const hasComponentBeenCreated = get(currentCompo, ['isTemporary'], false);
    const hasComponentBeenModified = !isEqual(currentCompo, initialCompo);

    return hasComponentBeenCreated || hasComponentBeenModified;
  });

  return makeUnique(componentUIDsToReturn);
};

const formatComponent = (component, mainDataUID, isCreatingData = false) => {
  const formattedAttributes = formatAttributes(
    get(component, 'schema.attributes', {}),
    mainDataUID,
    isCreatingData,
    true
  );

  // Set tmpUID if the component has just been created
  // Keep the uid if the component already exists
  const compoUID = get(component, 'isTemporary', false)
    ? { tmpUID: component.uid }
    : { uid: component.uid };

  const formattedComponent = Object.assign(
    {},
    compoUID,
    { category: component.category },
    // Omit the attributes since we want to format them
    omit(component.schema, 'attributes'),
    // Add the formatted attributes
    { attributes: formattedAttributes }
  );

  return formattedComponent;
};

const formatContentType = data => {
  const isCreatingData = get(data, 'isTemporary', true);
  const mainDataUID = get(data, 'uid', null);

  const formattedAttributes = formatAttributes(
    get(data, 'schema.attributes', {}),
    mainDataUID,
    isCreatingData,
    false
  );

  const formattedContentType = Object.assign(
    {},
    omit(data.schema, 'attributes'),
    { attributes: formattedAttributes }
  );

  delete formattedContentType.uid;
  delete formattedContentType.isTemporary;

  return formattedContentType;
};

/**
 *
 * @param {Object} attributes
 * @param {String} mainDataUID uid of the main data type
 * @param {Boolean} isCreatingMainData
 * @param {Boolean} isComponent
 */
const formatAttributes = (
  attributes,
  mainDataUID,
  isCreatingMainData,
  isComponent
) => {
  return Object.keys(attributes).reduce((acc, current) => {
    const currentAttribute = get(attributes, current, {});
    const hasARelationWithMainDataUID = currentAttribute.target === mainDataUID;
    const isRelationType = has(currentAttribute, 'nature');
    const currentTargetAttribute = get(
      currentAttribute,
      'targetAttribute',
      null
    );

    if (!hasARelationWithMainDataUID) {
      if (isRelationType) {
        const relationAttr = Object.assign({}, currentAttribute, {
          targetAttribute: formatRelationTargetAttribute(
            currentTargetAttribute
          ),
        });

        acc[current] = relationAttr;
      } else {
        acc[current] = currentAttribute;
      }
    }

    if (hasARelationWithMainDataUID) {
      let target = currentTargetAttribute.target;

      if (isCreatingMainData) {
        target = isComponent ? '__contentType__' : '__self__';
      }

      const formattedRelationAttribute = Object.assign({}, currentAttribute, {
        target,
        targetAttribute: formatRelationTargetAttribute(currentTargetAttribute),
      });

      acc[current] = formattedRelationAttribute;
    }

    return acc;
  }, {});
};

const formatRelationTargetAttribute = targetAttribute =>
  targetAttribute === '-' ? null : targetAttribute;

const getComponentsToPost = (
  allComponents,
  initialComponents,
  mainDataUID,
  isCreatingData = false
) => {
  const componentsToFormat = getCreatedAndModifiedComponents(
    allComponents,
    initialComponents
  );
  const formattedComponents = componentsToFormat.map(compoUID => {
    const currentCompo = get(allComponents, compoUID, {});
    const formattedComponent = formatComponent(
      currentCompo,
      mainDataUID,
      isCreatingData
    );

    return formattedComponent;
  });

  return formattedComponents;
};

export {
  formatComponent,
  getComponentsToPost,
  getCreatedAndModifiedComponents,
  formatContentType,
};
