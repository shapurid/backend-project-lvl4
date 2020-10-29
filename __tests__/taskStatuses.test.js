import request from 'supertest';
import getApp from '../server';
import {
  getTestData,
  setApp,
  unsetApp,
  registerTestUser,
} from './helpers';

let app;
let testUser;
const data = getTestData('taskStatuses');

beforeAll(async () => {
  app = await setApp(getApp);
  testUser = await registerTestUser(app);
});

describe('Task statuses CRUD', () => {
  let testTaskStatus;
  test('Create new task status', async () => {
    const { name } = data.create;
    const res = await request(app.server)
      .post('/taskStatuses')
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ name });
    expect(res.status).toBe(302);

    testTaskStatus = await app
      .objection
      .models
      .taskStatus
      .query()
      .findOne({ name });
  });
  test('Read task statuses', async () => {
    const res = await request(app.server)
      .get('/taskStatuses')
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(200);
  });
  test('Update task status', async () => {
    const { name } = data.update;
    const res = await request(app.server)
      .patch(`/taskStatuses/${testTaskStatus.id}/edit`)
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ name });
    expect(res.status).toBe(302);

    const newTaskStatusData = await app
      .objection
      .models
      .taskStatus
      .query()
      .findOne({ name });

    expect(testTaskStatus.id).toBe(newTaskStatusData.id);
    expect(testTaskStatus.name).not.toBe(newTaskStatusData.name);
    testTaskStatus = newTaskStatusData;
  });
  test('Delete task status', async () => {
    const res = await request(app.server)
      .delete(`/taskStatuses/${testTaskStatus.id}`)
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(302);
  });
});

afterAll(async () => {
  await unsetApp(app);
});
