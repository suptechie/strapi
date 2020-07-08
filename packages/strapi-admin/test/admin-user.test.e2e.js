'use strict';

const _ = require('lodash');
const { login, registerAndLogin, getUser } = require('../../../test/helpers/auth');
const { createAuthRequest } = require('../../../test/helpers/request');
const { SUPER_ADMIN_CODE } = require('../services/constants');

const omitTimestamps = obj => _.omit(obj, ['updatedAt', 'createdAt', 'updated_at', 'created_at']);

const getAuthToken = async () => {
  let token = await login();

  if (!token) {
    token = await registerAndLogin();
  }

  return token;
};

const createUserRole = async () => {
  const res = await rq({
    url: '/admin/roles',
    method: 'POST',
    body: {
      name: 'user_test_role',
      description: 'Only used for user crud test (e2e)',
    },
  });

  return res && res.body && res.body.data;
};

const deleteUserRole = async id => {
  await rq({
    url: `/admin/roles/${id}`,
    method: 'DELETE',
  });
};

const getSuperAdminRole = async () => {
  const res = await rq({
    url: '/admin/roles',
    method: 'GET',
  });

  return res.body.data.find(r => r.code === SUPER_ADMIN_CODE);
};

let rq;

/**
 * == Test Suite Overview ==
 *
 * N°   Description
 * -------------------------------------------
 * 1.   Create a user (fail/body)
 * 2.   Create a user (success)
 * 3.   Update a user (success)
 * 4.   Create a user with superAdmin role (success)
 * 5.   Update a user (fail/body)
 * 6.   Get a user (success)
 * 7.   Get a list of users (success/full)
 * 8.   Delete a user (success)
 * 9.   Delete a user (fail/notFound)
 * 10.  Deletes a super admin user (successfully)
 * 11.  Deletes last super admin user (bad request)
 * 12.  Update a user (fail/notFound)
 * 13.  Get a user (fail/notFound)
 * 14.  Get a list of users (success/empty)
 */

describe('Admin User CRUD (e2e)', () => {
  // Local test data used across the test suite
  let testData = {
    firstSuperAdminUser: undefined,
    user: undefined,
    secondSuperAdminUser: undefined,
    role: undefined,
    superAdminRole: undefined,
  };

  // Initialization Actions
  beforeAll(async () => {
    const token = await getAuthToken();
    rq = createAuthRequest(token);
    testData.role = await createUserRole();
    testData.firstSuperAdminUser = await getUser();
    testData.superAdminRole = await getSuperAdminRole();
  });

  // Cleanup actions
  afterAll(async () => {
    await deleteUserRole(testData.role.id);
  });

  test('1. Creates a user (wrong body)', async () => {
    const body = {
      firstname: 'user_tests-firstname',
      lastname: 'user_tests-lastname',
      roles: [testData.role.id],
    };

    const res = await rq({
      url: '/admin/users',
      method: 'POST',
      body,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'ValidationError',
      data: {
        email: ['email is a required field'],
      },
    });
  });

  test('2. Creates a user (successfully)', async () => {
    const body = {
      email: 'user-tests@strapi-e2e.com',
      firstname: 'user_tests-firstname',
      lastname: 'user_tests-lastname',
      roles: [testData.role.id],
    };

    const res = await rq({
      url: '/admin/users',
      method: 'POST',
      body,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).not.toBeNull();

    // Using the created user as an example for the rest of the tests
    testData.user = res.body.data;
  });

  test('3. Creates a user with superAdmin role (success)', async () => {
    const body = {
      email: 'user-tests2@strapi-e2e.com',
      firstname: 'user_tests-firstname',
      lastname: 'user_tests-lastname',
      roles: [testData.superAdminRole.id],
    };

    const res = await rq({
      url: '/admin/users',
      method: 'POST',
      body,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).not.toBeNull();

    // Using the created user as an example for the rest of the tests
    testData.secondSuperAdminUser = res.body.data;
  });

  test('4. Updates a user (wrong body)', async () => {
    const body = {
      email: 42,
    };

    const res = await rq({
      url: `/admin/users/${testData.user.id}`,
      method: 'PUT',
      body,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'ValidationError',
      data: {
        email: ['email must be a `string` type, but the final value was: `42`.'],
      },
    });
  });

  test('5. Updates a user (successfully)', async () => {
    const body = {
      firstname: 'foobar',
    };

    const res = await rq({
      url: `/admin/users/${testData.user.id}`,
      method: 'PUT',
      body,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).not.toBeNull();
    expect(omitTimestamps(res.body.data)).toMatchObject({
      ...omitTimestamps(testData.user),
      ...body,
    });

    // Update the local copy of the user
    testData.user = res.body.data;
  });

  test('6. Finds a user (successfully)', async () => {
    const res = await rq({
      url: `/admin/users/${testData.user.id}`,
      method: 'GET',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toMatchObject(testData.user);
  });

  describe('7. Finds a list of users (contains user)', () => {
    const expectedBodyFormat = () => ({
      data: {
        pagination: {
          page: 1,
          pageSize: expect.any(Number),
          pageCount: expect.any(Number),
          total: expect.any(Number),
        },
        results: expect.any(Array),
      },
    });

    test('7.1. Using findPage', async () => {
      const res = await rq({
        url: `/admin/users?email=${testData.user.email}`,
        method: 'GET',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject(expectedBodyFormat());
      expect(res.body.data.results).toContainEqual(testData.user);
    });

    test('7.2. Using searchPage', async () => {
      const res = await rq({
        url: `/admin/users?_q=${testData.user.email}`,
        method: 'GET',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject(expectedBodyFormat());
      expect(res.body.data.results).toContainEqual(testData.user);
    });
  });

  test('8. Deletes a user (successfully)', async () => {
    const res = await rq({
      url: `/admin/users/${testData.user.id}`,
      method: 'DELETE',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toMatchObject(testData.user);
  });

  test('9. Deletes a user (not found)', async () => {
    const res = await rq({
      url: `/admin/users/${testData.user.id}`,
      method: 'DELETE',
    });

    expect(res.statusCode).toBe(404);
  });

  test('10. Deletes a super admin user (successfully)', async () => {
    const res = await rq({
      url: `/admin/users/${testData.secondSuperAdminUser.id}`,
      method: 'DELETE',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toMatchObject(testData.secondSuperAdminUser);
  });

  test('11. Deletes last super admin user (bad request)', async () => {
    const res = await rq({
      url: `/admin/users/${testData.firstSuperAdminUser.id}`,
      method: 'DELETE',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'ValidationError',
      data: 'You must have at least one user with super admin role.',
    });
  });

  test('12. Updates a user (not found)', async () => {
    const body = {
      lastname: 'doe',
    };

    const res = await rq({
      url: `/admin/users/${testData.user.id}`,
      method: 'PUT',
      body,
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({
      error: 'Not Found',
      message: 'entry.notFound',
      statusCode: 404,
    });
  });

  test('13. Finds a user (not found)', async () => {
    const res = await rq({
      url: `/admin/users/${testData.user.id}`,
      method: 'GET',
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({
      error: 'Not Found',
      message: 'User does not exist',
      statusCode: 404,
    });
  });

  test('14. Finds a list of users (missing user)', async () => {
    const res = await rq({
      url: `/admin/users?email=${testData.user.email}`,
      method: 'GET',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toMatchObject({
      pagination: {
        page: 1,
        pageSize: expect.any(Number),
        pageCount: expect.any(Number),
        total: expect.any(Number),
      },
      results: expect.any(Array),
    });
    expect(res.body.data.results).toHaveLength(0);
  });
});
