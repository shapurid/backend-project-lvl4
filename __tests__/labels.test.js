import request from 'supertest';
import getApp from '../server';
import Label from '../server/models/Label';
import {
  getTestData,
  setApp,
  unsetApp,
} from './helpers';

let app;
let testUser;
let createLabelData;
let updateLabelData;

beforeAll(async () => {
  app = await setApp(getApp);
  const testData = await getTestData(app);
  testUser = testData.users.existing1;
  createLabelData = testData.labels.new.create;
  updateLabelData = testData.labels.new.update;
});

describe('Labels CRUD', () => {
  let testLabel;
  test('Create new label', async () => {
    const { name } = createLabelData;
    const res = await request(app.server)
      .post('/labels')
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ form: { name } });
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
    const { name } = updateLabelData;
    const res = await request(app.server)
      .patch(`/labels/${testLabel.id}/edit`)
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ form: { name } });
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
