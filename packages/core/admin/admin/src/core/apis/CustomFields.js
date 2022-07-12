import invariant from 'invariant';

class CustomFields {
  constructor() {
    this.customFields = {};
  }

  register(customFields) {
    if (Array.isArray(customFields)) {
      // If several custom fields are passed, register them one by one
      customFields.forEach(customField => {
        this.register(customField);
      });
    } else {
      // Handle individual custom field
      const { name, pluginId, type, intlLabel, intlDescription, components } = customFields;

      // Ensure required attributes are provided
      invariant(name, 'A name must be provided');
      invariant(type, 'A type must be provided');
      invariant(intlLabel, 'An intlLabel must be provided');
      invariant(intlDescription, 'An intlDescription must be provided');
      invariant(components, 'A components object must be provided');
      invariant(components.Input, 'An Input component must be provided');

      // Ensure name has no special characters
      const isValidObjectKey = /^(?![0-9])[a-zA-Z0-9$_-]+$/g;
      invariant(
        isValidObjectKey.test(name),
        `Custom field name: '${name}' is not a valid object key`
      );

      // When no plugin is specified, default to the global namespace
      const uid = pluginId ? `plugin::${pluginId}.${name}` : `global::${name}`;

      // Ensure the uid is unique
      const uidAlreadyUsed = Object.prototype.hasOwnProperty.call(this.customFields, uid);
      invariant(!uidAlreadyUsed, `Custom field: '${uid}' has already been registered`);

      this.customFields[uid] = customFields;
    }
  }
}

export default () => new CustomFields();
