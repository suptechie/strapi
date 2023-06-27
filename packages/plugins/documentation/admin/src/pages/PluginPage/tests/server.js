import { rest } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  rest.get('*/getInfos', (req, res, ctx) => {
    return res(
      ctx.delay(100),
      ctx.status(200),
      ctx.json({
        currentVersion: '1.0.0',
        docVersions: [
          { version: '1.0.0', generatedDoc: '10/05/2021 2:52:44 PM' },
          { version: '1.2.0', generatedDoc: '11/05/2021 3:00:00 PM' },
        ],
        prefix: '/documentation',
      })
    );
  }),
];

const server = setupServer(...handlers);

export default server;
