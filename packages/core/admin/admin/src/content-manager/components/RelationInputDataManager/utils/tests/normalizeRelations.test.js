import { normalizeRelations } from '../normalizeRelations';

const FIXTURE_RELATIONS = {
  data: {
    pages: [
      {
        results: [
          {
            id: 3,
            name: 'Relation 3',
            publishedAt: '2022-08-24T09:29:11.38',
          },

          {
            id: 2,
            name: 'Relation 2',
            publishedAt: '',
          },

          {
            id: 1,
            name: 'Relation 1',
          },
        ],
      },
    ],
  },
};

describe('RelationInputDataManager || normalizeRelations', () => {
  test('filters out deleted relations', () => {
    expect(
      normalizeRelations(FIXTURE_RELATIONS, {
        modifiedData: { disconnect: [{ id: 1 }] },
      })
    ).toStrictEqual({
      data: {
        pages: [
          [
            expect.objectContaining(FIXTURE_RELATIONS.data.pages[0].results[0]),
            expect.objectContaining(FIXTURE_RELATIONS.data.pages[0].results[1]),
          ],
        ],
      },
    });
  });

  test('returns empty array if all relations are deleted', () => {
    expect(
      normalizeRelations(FIXTURE_RELATIONS, {
        modifiedData: { disconnect: [{ id: 1 }, { id: 2 }, { id: 3 }] },
      })
    ).toStrictEqual({
      data: {
        pages: [],
      },
    });
  });

  test('filter disconnected relations', () => {
    expect(
      normalizeRelations(FIXTURE_RELATIONS, {
        modifiedData: { disconnect: [{ id: 2 }] },
      })
    ).toStrictEqual({
      data: {
        pages: [
          [
            expect.objectContaining(FIXTURE_RELATIONS.data.pages[0].results[0]),
            expect.objectContaining(FIXTURE_RELATIONS.data.pages[0].results[2]),
          ],
        ],
      },
    });
  });

  test('add link to each relation', () => {
    expect(
      normalizeRelations(FIXTURE_RELATIONS, {
        modifiedData: { disconnect: [] },
        shouldAddLink: true,
        targetModel: 'something',
      })
    ).toStrictEqual({
      data: {
        pages: [
          [
            expect.objectContaining({ href: '/content-manager/collectionType/something/3' }),
            expect.objectContaining({ href: '/content-manager/collectionType/something/2' }),
            expect.objectContaining({ href: '/content-manager/collectionType/something/1' }),
          ],
        ],
      },
    });
  });

  test('add publicationState attribute to each relation', () => {
    expect(
      normalizeRelations(FIXTURE_RELATIONS, {
        modifiedData: { disconnect: [] },
      })
    ).toStrictEqual({
      data: {
        pages: [
          [
            expect.objectContaining({ publicationState: 'published' }),
            expect.objectContaining({ publicationState: 'draft' }),
            expect.objectContaining({ publicationState: false }),
          ],
        ],
      },
    });
  });

  test('add mainField attribute to each relation', () => {
    expect(
      normalizeRelations(FIXTURE_RELATIONS, {
        modifiedData: { disconnect: [] },
        mainFieldName: 'name',
      })
    ).toStrictEqual({
      data: {
        pages: [
          [
            expect.objectContaining({
              mainField: FIXTURE_RELATIONS.data.pages[0].results[0].name,
            }),
            expect.objectContaining({
              mainField: FIXTURE_RELATIONS.data.pages[0].results[1].name,
            }),
            expect.objectContaining({
              mainField: FIXTURE_RELATIONS.data.pages[0].results[2].name,
            }),
          ],
        ],
      },
    });
  });

  test('allows to connect new relations, even though pages is empty', () => {
    expect(
      normalizeRelations(
        {
          data: {
            pages: [],
          },
        },
        {
          modifiedData: { connect: [{ id: 1 }] },
        }
      )
    ).toStrictEqual({
      data: {
        pages: [
          [
            expect.objectContaining({
              id: 1,
            }),
          ],
        ],
      },
    });
  });

  test('reverse order of relations pages', () => {
    const fixtureExtended = {
      pages: [
        ...FIXTURE_RELATIONS.data.pages,
        {
          results: [
            {
              id: 6,
              name: 'Relation 6',
              publishedAt: '2022-08-24T09:29:11.38',
            },

            {
              id: 5,
              name: 'Relation 5',
              publishedAt: '',
            },

            {
              id: 4,
              name: 'Relation 4',
            },
          ],
        },
      ],
    };

    expect(
      normalizeRelations(
        {
          data: fixtureExtended,
        },
        {
          modifiedData: { connect: [{ id: 6 }] },
        }
      )
    ).toStrictEqual({
      data: {
        pages: [
          [
            expect.objectContaining({ id: 6 }),
            expect.objectContaining({ id: 5 }),
            expect.objectContaining({ id: 4 }),
          ],
          [
            expect.objectContaining({ id: 3 }),
            expect.objectContaining({ id: 2 }),
            expect.objectContaining({ id: 1 }),
          ],
          [expect.objectContaining({ id: 6 })],
        ],
      },
    });
  });
});
