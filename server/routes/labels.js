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
        await app.objection.models.label.query().insert(tag);
        req.flash('success', i18next.t('flash.labels.create.success'));
        reply.redirect(app.reverse('labels'));
        return reply;
      } catch ({ data }) {
        const isNameUniqErr = data.name
          ? data.name.some((el) => el.keyword === 'unique')
          : false;
        if (isNameUniqErr) {
          req.flash('danger', i18next.t('flash.labels.create.error'));
        }
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
      try {
        const newData = await app.objection.models.label.fromJson(req.body);
        const tag = await app.objection.models.label.query().findById(req.params.id);
        await tag.$query().patch(newData);
        req.flash('success', i18next.t('flash.labels.modify.success'));
        reply.redirect(app.reverse('labels'));
        return reply;
      } catch ({ data }) {
        const isNameUniqErr = data.name
          ? data.name.some((el) => el.keyword === 'unique')
          : false;
        if (isNameUniqErr) {
          req.flash('danger', i18next.t('flash.labels.modify.error'));
        }
        reply
          .code(422)
          .render('/labels/edit', { errors: data });
        return reply;
      }
    })
    .delete('/labels/:id', { preHandler: checkSignedIn }, async (req, reply) => {
      await Promise.all([
        app.objection.models.label.query().deleteById(req.params.id),
        app.objection.models.taskLabel.query().delete().where('labelId', req.params.id),
      ]);
      req.flash('success', i18next.t('flash.labels.delete.success'));
      reply.redirect(app.reverse('labels'));
      return reply;
    });
};
