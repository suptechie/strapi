module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/totos',
      handler: 'toto.find',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/totos/:id',
      handler: 'toto.findOne',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/totos',
      handler: 'toto.create',
      config: {
        policies: [],
      },
    },
    {
      method: 'PUT',
      path: '/totos/:id',
      handler: 'toto.update',
      config: {
        policies: [],
      },
    },
    {
      method: 'DELETE',
      path: '/totos/:id',
      handler: 'toto.delete',
      config: {
        policies: [],
      },
    },
  ],
};
