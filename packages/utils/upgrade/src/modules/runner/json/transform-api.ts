import { cloneDeep, get, has, set, merge } from 'lodash/fp';

import type { JSONObject, JSONTransformAPI as JSONTransformAPIInterface, JSONValue } from './types';

export class JSONTransformAPI implements JSONTransformAPIInterface {
  private json: JSONObject;

  constructor(json: JSONObject) {
    this.json = cloneDeep(json);
  }

  get<T extends JSONValue>(path?: string, defaultValue?: T): T | undefined {
    if (!path) {
      return this.root() as T;
    }

    return cloneDeep(get(path, this.json) ?? defaultValue) as T;
  }

  has(path: string) {
    return has(path, this.json);
  }

  merge(other: JSONObject) {
    this.json = merge(other, this.json);

    return this;
  }

  root(): JSONObject {
    return cloneDeep(this.json);
  }

  set(path: string, value: JSONValue) {
    this.json = set(path, value, this.json);

    return this;
  }
}

export const createJSONTransformAPI = (object: JSONObject) => new JSONTransformAPI(object);
