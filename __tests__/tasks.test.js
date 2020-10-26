import request from 'supertest';
import getApp from '../server';
import {
  mapData,
  prepareApp,
  closeApp,
  registerTestUser,
  createTestTaskStatus,
  createTestLabel,
} from './helpers';

let app;
let mainTestUser;
let auxiliaryTestUser;
let testLabel;
let testTaskStatus;
const data = mapData(__filename);

beforeAll(async () => {
  app = await prepareApp(getApp);
  mainTestUser = await registerTestUser(app);
  [
    auxiliaryTestUser,
    testTaskStatus,
    testLabel,
  ] = await Promise.all([
    registerTestUser(app),
    createTestTaskStatus(app, mainTestUser.sessionCookie),
    createTestLabel(app, mainTestUser.sessionCookie),
  ]);
});

describe('Test tasks CRUD', () => {
  let testTask;
  test('Create new task', async () => {
    const { name } = data.create;
    const res = await request(app.server)
      .post('/tasks')
      .set('cookie', mainTestUser.sessionCookie)
      .type('form')
      .send({
        name,
        taskStatusId: testTaskStatus.id,
        executorId: auxiliaryTestUser.id,
        labels: testLabel.id,
      });
    expect(res.status).toBe(302);

    const foundedTask = await app
      .objection
      .models
      .task
      .query()
      .findOne({ name });

    testTask = await foundedTask.$query().withGraphJoined('[taskStatus, creator, executor, labels]');
  });
  test('Read tasks', async () => {
    const res = await request(app.server)
      .get('/tasks')
      .set('cookie', mainTestUser.sessionCookie);
    expect(res.status).toBe(200);
  });
  test('Update task err', async () => {
    const res = await request(app.server)
      .patch(`/tasks/${testTask.id}/edit`)
      .type('form')
      .send({ name: '', taskStatusId: '' });
    expect(res.status).toBe(403);
  });
  test('Update task', async () => {
    const res = await request(app.server)
      .patch(`/tasks/${testTask.id}/edit`)
      .set('cookie', mainTestUser.sessionCookie)
      .type('form')
      .send({ name: testTask.name, taskStatusId: testTaskStatus.id });
    expect(res.status).toBe(302);
    const foundedTask = await app
      .objection
      .models
      .task
      .query()
      .findOne({ name: testTask.name });
    expect(foundedTask).not.toEqual(testTask);
    testTask = foundedTask;
  });
  test('Delete task err1', async () => {
    const res = await request(app.server)
      .delete(`/tasks/u${testTask.creatorId}/${testTask.id}`)
      .set('cookie', auxiliaryTestUser.sessionCookie);
    expect(res.status).toBe(403);
  });
  test('Delete task', async () => {
    const res = await request(app.server)
      .delete(`/tasks/u${testTask.creatorId}/${testTask.id}`)
      .set('cookie', mainTestUser.sessionCookie);
    expect(res.status).toBe(302);
  });
});

afterAll(async () => {
  await closeApp(app);
});
