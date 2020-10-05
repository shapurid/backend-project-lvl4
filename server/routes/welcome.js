export default (app) => {
  app.get('/', (req, reply) => {
    reply.view('/welcome/index');
  });
};
