import { expect } from '@jest/globals';
import faker from 'faker';
import knex from 'knex';
import { test as testConfig } from '../knexfile';
import getApp from '../server';

const db = knex(testConfig);

describe('requests', () => {
  let server;
  const getRequests = [
    [200, '/'],
    [200, '/users/new'],
    [200, '/session/new'],
    [404, '/wrong-path'],
  ];
  const postRequests = [
    [302, '/users'],
  ];

  beforeAll(async () => {
    server = getApp();
    await db.migrate.latest();
  });

  test.each(getRequests)('GET %d %p', async (expectedStatus, route) => {
    const res = await server.inject({
      method: 'GET',
      url: route,
    });
    expect(res.statusCode).toBe(expectedStatus);
  });
  test.each(postRequests)('POST %d %p', async (expectedStatus, route) => {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const res = await server.inject({
      method: 'POST',
      url: route,
      body: {
        firstName,
        lastName,
        email,
        password,
      },
    });
    expect(res.statusCode).toBe(expectedStatus);
  });

  afterAll(() => {
    server.close();
  });
});
