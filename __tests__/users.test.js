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

describe('User "CRUD"', () => {
  test('Create new user', async () => {
    const { password, ...otherTestUserData } = testData
      .users
      .new
      .user
      .data;
    const res = await request(app.server)
      .post('/users')
      .type('form')
      .send({ form: { password, ...otherTestUserData } });
    expect(res.status).toBe(302);

    const { id, passwordDigest, ...otherFoundUserData } = await app
      .objection
      .models
      .user
      .query()
      .findOne({ email: otherTestUserData.email });

    expect(otherTestUserData).toEqual(otherFoundUserData);
  });
  test('User authorization', async () => {
    const { email, password } = testData.users.existing1.data;
    const res = await request(app.server)
      .post('/session')
      .type('form')
      .send({ form: { email, password } });
    expect(res.status).toBe(302);
  });
  test('User self-read', async () => {
    const testUser = testData.users.existing1;
    const res = await request(app.server)
      .get(`/users/${testUser.data.id}`)
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(200);
  });
  test('User change other user error', async () => {
    const mainUser = testData.users.existing1;
    const otherUser = testData.users.existing2;
    const { password: newPassword, ...otherDataToUpdate } = testData.users.new.update;
    const res = await request(app.server)
      .patch(`/users/${otherUser.data.id}`)
      .set('cookie', mainUser.sessionCookie)
      .type('form')
      .send({ form: { password: newPassword, ...otherDataToUpdate } });
    expect(res.status).toBe(403);

    const foundUser = await app
      .objection
      .models
      .user
      .query()
      .findOne({ email: otherDataToUpdate.email });
    expect(foundUser).toBeUndefined();
  });
  test('User change yourself', async () => {
    const testUser = testData.users.existing1;
    const { password: newPassword, ...otherDataToUpdate } = testData.users.new.update;
    const res = await request(app.server)
      .patch(`/users/${testUser.data.id}`)
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ form: { password: newPassword, ...otherDataToUpdate } });
    expect(res.status).toBe(302);

    const { id, passwordDigest, ...otherUpdatedUserData } = await app
      .objection
      .models
      .user
      .query()
      .findById(testUser.data.id);
    expect(otherUpdatedUserData).toEqual(otherDataToUpdate);
  });
  test('Delete session', async () => {
    const testUser = testData.users.existing1;
    const res = await request(app.server)
      .delete('/session')
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(302);
  });
  test('User delete other user error', async () => {
    const mainUser = testData.users.existing1;
    const otherUser = testData.users.existing2;
    const res = await request(app.server)
      .delete(`/users/${otherUser.data.id}`)
      .set('cookie', mainUser.sessionCookie);
    expect(res.status).toBe(403);

    const foundUser = await await app
      .objection
      .models
      .user
      .query()
      .findById(otherUser.data.id);
    expect(foundUser).not.toBeUndefined();
  });
  test('User with created task delete error', async () => {
    const userCreatorOfTask = testData.users.existing1;
    const res = await request(app.server)
      .delete(`/users/${userCreatorOfTask.data.id}`)
      .set('cookie', userCreatorOfTask.sessionCookie);
    expect(res.status).toBe(422);

    const foundUser = await app
      .objection
      .models
      .user
      .query()
      .findById(userCreatorOfTask.data.id);
    expect(foundUser).not.toBeUndefined();
  });
  test('User delete', async () => {
    const testUser = testData.users.existing2;
    const res = await request(app.server)
      .delete(`/users/${testUser.data.id}`)
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(302);

    const foundUser = await app
      .objection
      .models
      .user
      .query()
      .findById(testUser.data.id);
    expect(foundUser).toBeUndefined();
  });
});

afterAll(async () => {
  await unsetApp(app);
});
