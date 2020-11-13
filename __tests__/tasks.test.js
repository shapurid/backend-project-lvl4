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

describe('Test tasks CRUD', () => {
  test('Create new task', async () => {
    const testUser = testData.users.existing1;
    const createData = {
      name: testData.tasks.new.create.name,
      taskStatusId: testData.taskStatuses.existing1.id,
      executorId: testData.users.existing2.data.id,
    };
    const res = await request(app.server)
      .post('/tasks')
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ form: createData });
    expect(res.status).toBe(302);

    const {
      id,
      description,
      createdAt,
      updatedAt,
      ...otherFoundTaskData
    } = await app
      .objection
      .models
      .task
      .query()
      .findOne({ name: testData.tasks.new.create.name });
    expect(otherFoundTaskData).toEqual({ creatorId: testUser.data.id, ...createData });
  });
  test('Read tasks', async () => {
    const testUser = testData.users.existing1;
    const res = await request(app.server)
      .get('/tasks')
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(200);
  });
  test('Update task error', async () => {
    const testTask = testData.tasks.existing;
    const res = await request(app.server)
      .patch(`/tasks/${testTask.id}/edit`)
      .type('form')
      .send({ form: { name: '', taskStatusId: '' } });
    expect(res.status).toBe(403);
  });
  test('Update task', async () => {
    const testUser = testData.users.existing1;
    const testTaskStatus = testData.taskStatuses.existing2;
    const testTask = testData.tasks.existing;
    const res = await request(app.server)
      .patch(`/tasks/${testTask.id}/edit`)
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ form: { name: testTask.name, taskStatusId: testTaskStatus.id } });
    expect(res.status).toBe(302);
    const foundTask = await app
      .objection
      .models
      .task
      .query()
      .findById(testTask.id);
    expect(foundTask).not.toEqual(testTask);
  });
  test('Delete task error', async () => {
    const testUser = testData.users.existing2;
    const testTask = testData.tasks.existing;
    const res = await request(app.server)
      .delete(`/tasks/u${testTask.creatorId}/${testTask.id}`)
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(403);

    const foundTask = await app
      .objection
      .models
      .task
      .query()
      .findById(testTask.id);
    expect(foundTask).not.toBeUndefined();
  });
  test('Delete task', async () => {
    const testUser = testData.users.existing1;
    const testTask = testData.tasks.existing;
    const res = await request(app.server)
      .delete(`/tasks/u${testTask.creatorId}/${testTask.id}`)
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(302);

    const foundTask = await app
      .objection
      .models
      .task
      .query()
      .findById(testTask.id);
    expect(foundTask).toBeUndefined();
  });
});

afterAll(async () => {
  await unsetApp(app);
});
