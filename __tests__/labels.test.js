import request from 'supertest';
import getApp from '../server';
import Label from '../server/models/Label';
import {
  getTestData,
  setApp,
  unsetApp,
  registerTestUser,
} from './helpers';

let app;
let testUser;
const data = getTestData('labels');

beforeAll(async () => {
  app = await setApp(getApp);
  testUser = await registerTestUser(app);
});

describe('Labels CRUD', () => {
  let testLabel;
  test('Create new label', async () => {
    const { name } = data.create;
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
    expect(testLabel).toBeInstanceOf(Label);
  });
  test('Read labels', async () => {
    const res = await request(app.server)
      .get('/labels')
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(200);
  });
  test('Update label', async () => {
    const { name } = data.update;
    const res = await request(app.server)
      .patch(`/labels/${testLabel.id}/edit`)
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ name });
    expect(res.status).toBe(302);

    const newTestLabelData = await app
      .objection
      .models
      .label
      .query()
      .findOne({ name });

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
  await unsetApp(app);
});