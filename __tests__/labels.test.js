import {
  beforeAll,
  afterAll,
  describe,
  expect,
  test,
} from '@jest/globals';
import request from 'supertest';
import faker from 'faker';
import getApp from '../server';
import { registerTestUser } from './helpers';

let app;
let testUser;

beforeAll(async () => {
  app = await getApp().ready();
  await app
    .objection
    .knex
    .migrate
    .latest();
  testUser = await registerTestUser(app);
});

describe('Labels CRUD', () => {
  let testLabel;
  test('Create new label', async () => {
    const name = faker.lorem.word();
    const res = await request(app.server)
      .post('/labels')
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ name });
    expect(res.status).toBe(302);

    testLabel = await app
      .objection
      .models
      .label
      .query()
      .findOne({ name });
  });
  test('Read labels', async () => {
    const res = await request(app.server)
      .get('/labels')
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(200);
  });
  test('Update label', async () => {
    const newName = faker.lorem.word();
    const res = await request(app.server)
      .patch(`/labels/${testLabel.id}/edit`)
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ name: newName });
    expect(res.status).toBe(302);

    const newTestLabelData = await app
      .objection
      .models
      .label
      .query()
      .findOne({ name: newName });

    expect(testLabel.id).toBe(newTestLabelData.id);
    expect(testLabel.name).not.toBe(newTestLabelData.name);
    testLabel = newTestLabelData;
  });
  test('Delete label', async () => {
    const res = await request(app.server)
      .delete(`/labels/${testLabel.id}`)
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(302);
  });
});

afterAll(async () => {
  await app
    .objection
    .knex
    .destroy();
  await app.close();
});
