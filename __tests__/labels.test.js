import request from 'supertest';
import getApp from '../server';
import {
  getTestData,
  setMigrationsAndData,
  unsetMigrationsAndData,
  setApp,
  unsetApp,
} from './helpers';

let app;
let testData;

beforeAll(async () => {
  app = await setApp(getApp);
});

beforeEach(async () => {
  await setMigrationsAndData(app);
  testData = await getTestData(app);
});

afterEach(async () => {
  await unsetMigrationsAndData(app);
});

describe('Labels CRUD', () => {
  test('Create new label', async () => {
    const testUser = testData.users.existing1;
    const { name } = testData.labels.new.create;
    const res = await request(app.server)
      .post('/labels')
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ form: { name } });
    expect(res.status).toBe(302);

    const foundLabel = await app
      .objection
      .models
      .label
      .query()
      .findOne({ name });
    expect(foundLabel.name).toBe(name);
  });
  test('Read labels', async () => {
    const testUser = testData.users.existing1;
    const res = await request(app.server)
      .get('/labels')
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(200);
  });
  test('Update label', async () => {
    const testUser = testData.users.existing1;
    const testLabel = testData.labels.existing;
    const { name } = testData.labels.new.update;
    const res = await request(app.server)
      .patch(`/labels/${testLabel.id}/edit`)
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ form: { name } });
    expect(res.status).toBe(302);

    const foundLabel = await app
      .objection
      .models
      .label
      .query()
      .findById(testLabel.id);
    expect(foundLabel.name).toBe(name);
  });
  test('Delete label', async () => {
    const testUser = testData.users.existing1;
    const testLabel = testData.labels.existing;
    const res = await request(app.server)
      .delete(`/labels/${testLabel.id}`)
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(302);

    const foundLabel = await app
      .objection
      .models
      .label
      .query()
      .findById(testLabel.id);
    expect(foundLabel).toBeUndefined();
  });
});

afterAll(async () => {
  await unsetApp(app);
});
