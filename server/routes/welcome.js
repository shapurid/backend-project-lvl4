export default (app) => {
  app.get('/', (req, reply) => {
    const name = req.signedIn ? req.currentUser.firstName : 'Гость';
    reply.render('/welcome/index', { name });
  });
};
