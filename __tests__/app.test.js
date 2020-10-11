import { expect } from '@jest/globals';
import faker from 'faker';
import knex from 'knex';
import request from 'supertest';
import { test as testConfig } from '../knexfile';
import getApp from '../server';

const db = knex(testConfig);
const generateUser = () => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
});

describe('requests', () => {
  let server;
  const getRequests = [
    [200, '/'],
    [200, '/users/new'],
    [200, '/session/new'],
    [404, '/wrong-path'],
  ];

  beforeAll(async () => {
    server = getApp().server;
    await db.migrate.latest();
  });

  test.each(getRequests)('GET %d %p', async (expectedStatus, route) => {
    const res = await request(server).get(route);
    expect(res.status).toBe(expectedStatus);
  });
  test('POST /users', async () => {
    const user = generateUser();
    const res = await request(server)
      .post('/users')
      .type('form')
      .send(user);
    expect(res.status).toBe(302);
  });
  test('POST /session', async () => {
    const user = generateUser();
    const res = await request(server)
      .post('/users')
      .type('form')
      .send(user);
    expect(res.status).toBe(302);
    const sessionRes = await request(server)
      .post('/session')
      .type('form')
      .send({ email: user.email, password: user.password });
    expect(sessionRes.status).toBe(302);
  });

  afterAll(async () => {
    server.close();
    await db.migrate.down();
    await db.destroy();
  });
});
