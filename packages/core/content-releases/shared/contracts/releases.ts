import type { Entity } from '../types';
import type { ReleaseAction } from './release-actions';
import type { UserInfo } from '../types';
import { errors } from '@strapi/utils';

export interface Release extends Entity {
  name: string;
  releasedAt: string;
  actions: ReleaseAction[];
}

export type Pagination = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};

export interface ReleaseDataResponse extends Omit<Release, 'actions'> {
  actions: { meta: { count: number } };
}

export interface ReleaseForContentTypeEntryDataResponse extends Omit<Release, 'actions'> {
  action: { type: ReleaseAction['type'] };
}

/**
 * GET /content-releases/ - Get all releases
 */
export declare namespace GetReleases {
  export interface Request {
    state: {
      userAbility: {};
    };
    query?: Partial<Pick<Pagination, 'page' | 'pageSize'>>;
  }

  export interface Response {
    data: ReleaseDataResponse[];
    meta: {
      pagination?: Pagination;
    };
    error?: errors.ApplicationError;
  }
}

/**
 * GET /content-releases/ - Get all releases for a given entry
 */
export declare namespace GetContentTypeEntryReleases {
  export interface Request {
    state: {
      userAbility: {};
    };
    query: {
      contentTypeUid: ReleaseAction['contentType'];
      entryId: ReleaseAction['entry']['id'];
      hasEntryAttached?: boolean;
    };
  }

  export interface Response {
    data: ReleaseForContentTypeEntryDataResponse[];
    error?: errors.ApplicationError;
  }
}

/**
 * GET /content-releases/:id - Get a single release
 */
export declare namespace GetRelease {
  export interface Request {
    state: {
      userAbility: {};
    };
    params: {
      id: Release['id'];
    };
  }

  export interface Response {
    data: ReleaseDataResponse;
    error?: errors.ApplicationError | errors.NotFoundError;
  }
}

/**
 * POST /content-releases/ - Create a release
 */
export declare namespace CreateRelease {
  export interface Request {
    state: {
      user: UserInfo;
    };
    body: {
      name: string;
    };
  }

  export interface Response {
    data: ReleaseDataResponse;
    error?: errors.ApplicationError | errors.ValidationError;
  }
}

/**
 * PUT /content-releases/:id - Update a release
 */
export declare namespace UpdateRelease {
  export interface Request {
    state: {
      user: UserInfo;
    };
    params: {
      id: Release['id'];
    };
    body: {
      name: string;
    };
  }

  export interface Response {
    data: ReleaseDataResponse;
    error?: errors.ApplicationError | errors.ValidationError;
  }
}

/**
 * DELETE /content-releases/:id - Delete a release
 */
export declare namespace DeleteRelease {
  export interface Request {
    state: {
      user: UserInfo;
    };
    params: {
      id: Release['id'];
    };
  }

  export interface Response {
    data: ReleaseDataResponse;
    error?: errors.ApplicationError | errors.NotFoundError;
  }
}

/**
 * POST /content-releases/:releaseId/publish - Publish a release
 */
export declare namespace PublishRelease {
  export interface Request {
    state: {
      user: UserInfo;
    };
    params: {
      id: Release['id'];
    };
  }

  export interface Response {
    data: ReleaseDataResponse;
    error?: errors.ApplicationError | errors.ValidationError;
  }
}
