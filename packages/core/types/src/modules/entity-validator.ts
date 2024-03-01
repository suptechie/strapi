import type { ContentTypes } from '../schema';
import type { UID } from '../public';

import type * as EntityService from './entity-service';

type Entity = {
  id: ID;
  [key: string]: unknown;
} | null;

type ID = { id: string | number };

type Options = { isDraft?: boolean; locale?: string };

export interface EntityValidator {
  validateEntityCreation: <TUID extends UID.ContentType>(
    model: ContentTypes[TUID],
    data: EntityService.Params.Data.Input<TUID>,
    options?: Options
  ) => Promise<EntityService.Params.Data.Input<TUID>>;
  validateEntityUpdate: <TUID extends UID.ContentType>(
    model: ContentTypes[TUID],
    data: Partial<EntityService.Params.Data.Input<TUID>> | undefined,
    options?: Options,
    entity?: Entity
  ) => Promise<EntityService.Params.Data.Input<TUID>>;
}
