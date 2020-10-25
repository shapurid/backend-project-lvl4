import i18next from 'i18next';
import { checkSignedIn } from '../lib/preHandlers';

export default (app) => {
  app
    .get('/labels', { name: 'labels', preHandler: checkSignedIn }, async (req, reply) => {
      const labels = await app.objection.models.label.query();
      reply.render('/labels/index', { labels });
      return reply;
    })
    .get('/labels/new', { name: 'newLabel', preHandler: checkSignedIn }, (req, reply) => {
      reply.render('/labels/new', { errors: {} });
      return reply;
    })
    .post('/labels', { preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const tag = await app.objection.models.label.fromJson(req.body);
        const foundLabel = await app
          .objection
          .models
          .label
          .query()
          .findOne(tag);
        if (foundLabel) {
          req.flash('danger', i18next.t('flash.labels.create.error'));
          reply
            .code(422)
            .render('/labels/new', { errors: req.body });
          return reply;
        }
        await app.objection.models.label.query().insert(tag);
        req.flash('success', i18next.t('flash.labels.create.success'));
        reply.redirect(app.reverse('labels'));
        return reply;
      } catch ({ data }) {
        reply
          .code(422)
          .render('/labels/new', { errors: data });
        return reply;
      }
    })
    .get('/labels/:id/edit', { preHandler: checkSignedIn }, async (req, reply) => {
      const labelName = await app
        .objection
        .models
        .label
        .query()
        .findById(req.params.id);
      if (!labelName) {
        reply.notFound();
        return reply;
      }
      reply.render('/labels/edit', { errors: {}, ...labelName });
      return reply;
    })
    .patch('/labels/:id/edit', { preHandler: checkSignedIn }, async (req, reply) => {
      const { name } = req.body;
      if (!name) {
        reply
          .code(422)
          .render('/labels/edit', { errors: { name: {} } });
        return reply;
      }
      const tag = await app.objection.models.label.query().findById(req.params.id);
      await tag.$query().patch({ name });
      req.flash('success', i18next.t('flash.labels.modify.success'));
      reply.redirect(app.reverse('labels'));
      return reply;
    })
    .delete('/labels/:id', { preHandler: checkSignedIn }, async (req, reply) => {
      await app.objection.models.label.query().deleteById(req.params.id);
      req.flash('success', i18next.t('flash.labels.delete.success'));
      reply.redirect(app.reverse('labels'));
      return reply;
    });
};
