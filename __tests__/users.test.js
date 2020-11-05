import request from 'supertest';
import getApp from '../server';
import {
  getTestData,
  setApp,
  unsetApp,
  getSettedDataFromDb,
} from './helpers';

let app;
let otherUser;
const testData = getTestData('users');

beforeAll(async () => {
  app = await setApp(getApp);
  const dbData = await getSettedDataFromDb(app);
  otherUser = dbData.user1;
});

describe('User "CRUD"', () => {
  let testUser = testData.user;
  test('Create new user', async () => {
    const res = await request(app.server)
      .post('/users')
      .type('form')
      .send({ form: { ...testUser.data } });
    expect(res.status).toBe(302);
  });
  test('User authorization', async () => {
    const { email, password } = testUser.data;
    const res = await request(app.server)
      .post('/session')
      .type('form')
      .send({ form: { email, password } });
    expect(res.status).toBe(302);
    const sessionCookie = res
      .headers['set-cookie']
      .join()
      .split(';')
      .slice(0, 1)
      .join();
    const userId = await app.objection.models.user.query().findOne({ email });
    testUser.sessionCookie = sessionCookie;
    testUser.data.id = userId.id;
  });
  test('User self-read', async () => {
    const res = await request(app.server)
      .get(`/users/${testUser.data.id}`)
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(200);
  });
  test('User change yourself', async () => {
    const { password: newPassword, ...otherDataToUpdate } = testData.update;
    const res = await request(app.server)
      .patch(`/users/${testUser.data.id}`)
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ form: { password: newPassword, ...otherDataToUpdate } });
    expect(res.status).toBe(302);

    const { passwordDigest, id, ...newData } = await app
      .objection
      .models
      .user
      .query()
      .findById(testUser.data.id);
    const { password, id: testUserId, ...oldData } = testUser.data;

    expect(newData).not.toEqual(oldData);
    expect(newData).toEqual(otherDataToUpdate);
    const sessionCookie = res
      .headers['set-cookie']
      .join()
      .split(';')
      .slice(0, 1)
      .join();
    testUser = {
      data: {
        id: testUserId,
        ...otherDataToUpdate,
        password: newPassword,
      },
      sessionCookie,
    };
  });
  test('Delete session', async () => {
    const res = await request(app.server)
      .delete('/session')
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(302);
  });
  test('User authorization with upd data', async () => {
    const { email, password } = testUser.data;
    const res = await request(app.server)
      .post('/session')
      .type('form')
      .send({ form: { email, password } });
    expect(res.status).toBe(302);
  });
  test('User change other user error', async () => {
    const res = await request(app.server)
      .patch(`/users/${otherUser.data.id}`)
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ form: { name: 'f' } });
    expect(res.status).toBe(403);
  });
  test('User delete', async () => {
    const res = await request(app.server)
      .delete(`/users/${testUser.data.id}`)
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(302);
  });
});

afterAll(async () => {
  await unsetApp(app);
});
