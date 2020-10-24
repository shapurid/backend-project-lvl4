import faker from 'faker';
import request from 'supertest';

export const generateUser = () => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
});

export const registerTestUser = async (app) => {
  const user = generateUser();
  const creationRes = await request(app.server)
    .post('/users')
    .type('form')
    .send(user);
  expect(creationRes.status).toBe(302);

  const authorizationRes = await request(app.server)
    .post('/session')
    .type('form')
    .send({ email: user.email, password: user.password });
  expect(authorizationRes.status).toBe(302);

  const sessionCookie = authorizationRes
    .headers['set-cookie']
    .join()
    .split(';')
    .slice(0, 1)
    .join();
  const { id } = await app.objection.models.user.query().findOne({ email: user.email });

  return { data: { id, ...user }, sessionCookie };
};

export const createTestTaskStatus = async (app, sessionCookie) => {
  const taskStatusName = faker.lorem.word();
  const addTaskStatus = await request(app.server)
    .post('/taskStatuses')
    .set('cookie', sessionCookie)
    .type('form')
    .send({ name: taskStatusName });
  expect(addTaskStatus.status).toBe(302);

  const taskStatus = await app
    .objection
    .models
    .taskStatus
    .query()
    .findOne({ name: taskStatusName });
  return taskStatus;
};
