export default (app) => {
  app.get('/', { name: 'root' }, (req, reply) => {
    console.log(req.session);
    reply.render('/welcome/index');
  });
};
