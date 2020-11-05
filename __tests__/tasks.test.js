import request from 'supertest';
import getApp from '../server';
import {
  getTestData,
  setApp,
  unsetApp,
  getSettedDataFromDb,
} from './helpers';

let app;
let mainTestUser;
let auxiliaryTestUser;
let testLabel;
let testTaskStatus;
const testData = getTestData('tasks');

beforeAll(async () => {
  app = await setApp(getApp);
  const dbData = await getSettedDataFromDb(app);
  mainTestUser = dbData.user1;
  auxiliaryTestUser = dbData.user2;
  testLabel = dbData.label;
  testTaskStatus = dbData.taskStatus;
});

describe('Test tasks CRUD', () => {
  let testTask;
  test('Create new task', async () => {
    const { name } = testData.create;
    const res = await request(app.server)
      .post('/tasks')
      .set('cookie', mainTestUser.sessionCookie)
      .type('form')
      .send({
        form: {
          name,
          taskStatusId: testTaskStatus.id,
          executorId: auxiliaryTestUser.id,
          labels: testLabel.id,
        },
      });
    expect(res.status).toBe(302);

    const foundTask = await app
      .objection
      .models
      .task
      .query()
      .findOne({ name });

    testTask = await foundTask.$query().withGraphJoined('[taskStatus, creator, executor, labels]');
  });
  test('Read tasks', async () => {
    const res = await request(app.server)
      .get('/tasks')
      .set('cookie', mainTestUser.sessionCookie);
    expect(res.status).toBe(200);
  });
  test('Update task error', async () => {
    const res = await request(app.server)
      .patch(`/tasks/${testTask.id}/edit`)
      .type('form')
      .send({ form: { name: '', taskStatusId: '' } });
    expect(res.status).toBe(403);
  });
  test('Update task', async () => {
    const res = await request(app.server)
      .patch(`/tasks/${testTask.id}/edit`)
      .set('cookie', mainTestUser.sessionCookie)
      .type('form')
      .send({ form: { name: testTask.name, taskStatusId: testTaskStatus.id } });
    expect(res.status).toBe(302);
    const foundTask = await app
      .objection
      .models
      .task
      .query()
      .findOne({ name: testTask.name });
    expect(foundTask).not.toEqual(testTask);
    testTask = foundTask;
  });
  test('Delete task error', async () => {
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
  await unsetApp(app);
});
