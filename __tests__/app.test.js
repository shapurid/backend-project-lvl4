import { expect } from '@jest/globals';
import getApp from '../server';

describe('requests', () => {
  let server;
  const requests = [
    [200, '/'],
    [200, '/users/new'],
    [404, '/wrong-path'],
  ];

  beforeAll(() => {
    server = getApp();
  });

  test.each(requests)('GET %d %p', async (status, route) => {
    const res = await server.inject({
      method: 'GET',
      url: route,
    });
    expect(res.statusCode).toBe(status);
  });

  afterAll(() => {
    server.close();
  });
});
