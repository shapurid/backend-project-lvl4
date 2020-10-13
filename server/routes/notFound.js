export default (app) => {
  app.get('/*', (req, reply) => {
    reply.notFound();
    return reply;
  });
};
