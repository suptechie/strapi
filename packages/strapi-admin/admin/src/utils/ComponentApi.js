import { cloneDeep } from 'lodash';
import invariant from 'invariant';

class ComponentApi {
  components = {};

  getComponent = name => {
    invariant(name, 'A name must be provided');

    return cloneDeep(this.components[name]) || null;
  };

  getComponents = () => {
    return cloneDeep(this.components);
  };

  registerComponent = component => {
    const { name, Component } = component;

    invariant(Component, 'A Component must be provided');
    invariant(name, 'A name must be provided');
    invariant(this.components[name] === undefined, 'A similar field already exists');

    this.components[name] = Component;
  };

  removeComponent = name => {
    invariant(name, 'A name must be provided in order to remove a field');

    delete this.components[name];
  };
}

export default () => {
  return new ComponentApi();
};
