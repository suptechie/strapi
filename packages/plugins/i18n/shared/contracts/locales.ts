import { Entity as StrapiEntity } from '@strapi/types';
import { errors } from '@strapi/utils';

interface Entity {
  id: StrapiEntity.ID;
  createdAt: string;
  updatedAt: string;
}

export interface Locale extends Entity {
  code: string;
  isDefault: boolean;
  name: string;
}

/**
 * GET /i18n/locales - Get all the locales
 */
export declare namespace GetLocales {
  export interface Request {
    query: {};
    body: {};
  }

  /**
   * TODO: this should follow the usual `data/error` pattern.
   */
  export type Response =
    | Locale[]
    | {
        data: null;
        error: errors.ApplicationError;
      };
}

/**
 * POST /i18n/locales - Create a single locale
 */
export declare namespace CreateLocale {
  export interface Request {
    query: {};
    body: Omit<Locale, keyof Entity>;
  }

  /**
   * TODO: this should follow the usual `data/error` pattern.
   */
  export type Response =
    | Locale
    | {
        data: null;
        error: errors.ApplicationError;
      };
}

/**
 * DEL /i18n/locales/:id - Delete a single locale
 */
export declare namespace DeleteLocale {
  export interface Request {
    params: { id: Locale['id'] };
    query: {};
    body: {};
  }

  /**
   * TODO: this should follow the usual `data/error` pattern.
   */
  export type Response =
    | Locale
    | {
        data: null;
        error: errors.ApplicationError;
      };
}

/**
 * PUT /i18n/locales/:id - Update a single locale
 */
export declare namespace UpdateLocale {
  export interface Request {
    params: { id: Locale['id'] };
    query: {};
    body: Pick<Locale, 'name' | 'isDefault'>;
  }

  /**
   * TODO: this should follow the usual `data/error` pattern.
   */
  export type Response =
    | Locale
    | {
        data: null;
        error: errors.ApplicationError;
      };
}
