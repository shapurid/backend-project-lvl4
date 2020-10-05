export default (app) => {
  app
    .get('/users/new', (req, reply) => {
      reply.view('/users/new');
    });
  app
    .post('/users', async (req) => {
      console.log(req);
      return req;
    });
};
