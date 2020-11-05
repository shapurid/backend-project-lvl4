import request from 'supertest';
import getApp from '../server';
import {
  setApp,
  unsetApp,
  getSettedDataFromDb,
} from './helpers';

let app;
let testUserForAuth;
const guestGetRequests = [
  ['/', { expectedGuestCode: 200, expectedUserCode: 200 }],
  ['/users/new', { expectedGuestCode: 200, expectedUserCode: 200 }],
  ['/session/new', { expectedGuestCode: 200, expectedUserCode: 200 }],
  ['/users', { expectedGuestCode: 403, expectedUserCode: 200 }],
  ['/taskStatuses', { expectedGuestCode: 403, expectedUserCode: 200 }],
  ['/taskStatuses/new', { expectedGuestCode: 403, expectedUserCode: 200 }],
  ['/tasks', { expectedGuestCode: 403, expectedUserCode: 200 }],
  ['/tasks/new', { expectedGuestCode: 403, expectedUserCode: 200 }],
  ['/labels', { expectedGuestCode: 403, expectedUserCode: 200 }],
  ['/labels/new', { expectedGuestCode: 403, expectedUserCode: 200 }],
  ['/wrong-path', { expectedGuestCode: 404, expectedUserCode: 404 }],
];

beforeAll(async () => {
  app = await setApp(getApp);
  const dbData = await getSettedDataFromDb(app);
  testUserForAuth = dbData.user1;
});

describe('Guest requests', () => {
  test.each(guestGetRequests)('Guest GET %s', async (route, { expectedGuestCode }) => {
    const res = await request(app.server).get(route);
    expect(res.status).toBe(expectedGuestCode);
  });
});
describe('Authorized user requests', () => {
  test.each(guestGetRequests)('Authorized user GET %s', async (route, { expectedUserCode }) => {
    const res = await request(app.server)
      .get(route)
      .set('cookie', testUserForAuth.sessionCookie);
    expect(res.status).toBe(expectedUserCode);
  });
});

afterAll(async () => {
  await unsetApp(app);
});
