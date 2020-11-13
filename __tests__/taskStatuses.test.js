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
let testUser;
let testData;

beforeAll(async () => {
  app = await setApp(getApp);
});

beforeEach(async () => {
  await setMigrationsAndData(app);
  testData = await getTestData(app);
  testUser = testData.users.existing1;
});

afterEach(async () => {
  await unsetMigrationsAndData(app);
});

describe('Task statuses CRUD', () => {
  test('Create new task status', async () => {
    const { name } = testData.taskStatuses.new.create;
    const res = await request(app.server)
      .post('/taskStatuses')
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ form: { name } });
    expect(res.status).toBe(302);

    const { name: foundTaskName } = await app
      .objection
      .models
      .taskStatus
      .query()
      .findOne({ name });
    expect(foundTaskName).toBe(name);
  });
  test('Read task statuses', async () => {
    const res = await request(app.server)
      .get('/taskStatuses')
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(200);
  });
  test('Update task status', async () => {
    const testTaskStatus = testData.taskStatuses.existing1;
    const { name } = testData.taskStatuses.new.update;
    const res = await request(app.server)
      .patch(`/taskStatuses/${testTaskStatus.id}/edit`)
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ form: { name } });
    expect(res.status).toBe(302);

    const { name: updatedTaskName } = await app
      .objection
      .models
      .taskStatus
      .query()
      .findById(testTaskStatus.id);
    expect(updatedTaskName).toBe(name);
  });
  test('Delete related with task status error', async () => {
    const testTaskStatus = testData.taskStatuses.existing1;
    const res = await request(app.server)
      .delete(`/taskStatuses/${testTaskStatus.id}`)
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(422);

    const foundTask = await app
      .objection
      .models
      .taskStatus
      .query()
      .findById(testTaskStatus.id);
    expect(foundTask).not.toBeUndefined();
  });
  test('Delete task status', async () => {
    const testTaskStatus = testData.taskStatuses.existing2;
    const res = await request(app.server)
      .delete(`/taskStatuses/${testTaskStatus.id}`)
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(302);

    const foundTask = await app
      .objection
      .models
      .taskStatus
      .query()
      .findById(testTaskStatus.id);
    expect(foundTask).toBeUndefined();
  });
});

afterAll(async () => {
  await unsetApp(app);
});
