import { ENTITY_ASSIGNEE_ATTRIBUTE } from '../../constants/workflows';
import assigneeFactory from '../review-workflows/assignees';

const uid = 'uid';
const fromAssigneeId = 1;
const dbMock = {
  findOne: jest.fn(() => {
    return {
      [ENTITY_ASSIGNEE_ATTRIBUTE]: {
        id: fromAssigneeId,
      },
    };
  }),
  update: jest.fn(({ data }) => data),
};
const servicesMock: Record<string, any> = {
  'admin::user': {
    exists: jest.fn(() => true),
  },
  'admin::review-workflows-metrics': {
    sendDidEditAssignee: jest.fn(),
  },
};

const strapiMock = {
  db: {
    query: () => dbMock,
  },
  service: jest.fn((serviceName) => {
    return servicesMock[serviceName];
  }),
  EE: true,
  ee: {
    features: {
      isEnabled() {
        return true;
      },
      getEnabled() {
        return ['review-workflows'];
      },
    },
  },
};

// @ts-expect-error - use strapi mock
const assigneeService = assigneeFactory({ strapi: strapiMock });

describe('Review workflows - Stages service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateEntityAssignee', () => {
    it('should update the assignee of an entity', async () => {
      const id = 10;
      const toId = 2;
      await assigneeService.updateEntityAssignee(id, uid, toId);

      expect(servicesMock['admin::user'].exists).toBeCalled();
      expect(servicesMock['admin::review-workflows-metrics'].sendDidEditAssignee).toBeCalledWith(
        fromAssigneeId,
        toId
      );

      expect(dbMock.update).toBeCalledWith({
        where: { id },
        data: { [ENTITY_ASSIGNEE_ATTRIBUTE]: toId },
        select: [],
        populate: [ENTITY_ASSIGNEE_ATTRIBUTE],
      });
    });
  });
});
