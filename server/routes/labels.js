import i18next from 'i18next';
import { checkSignedIn } from '../lib/preHandlers';

export default (app) => {
  app
    .get('/labels', { name: 'labelsIndex', preHandler: checkSignedIn }, async (req, reply) => {
      const labelsForm = { translationPath: 'labels.index' };
      const labels = await app.objection.models.label.query();
      reply.render('/labels/index', { labelsForm, labels });
      return reply;
    })
    .get('/labels/new', { name: 'labelsNew', preHandler: checkSignedIn }, (req, reply) => {
      const labelsForm = { translationPath: 'labels.new' };
      reply.render('/labels/new', { labelsForm });
      return reply;
    })
    .post('/labels', { name: 'labelsCreate', preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const label = await app.objection.models.label.fromJson(req.body.form);
        await app.objection.models.label.query().insert(label);
        req.flash('success', i18next.t('flash.labels.create.success'));
        reply.redirect(app.reverse('labelsIndex'));
        return reply;
      } catch ({ data }) {
        const labelsForm = { translationPath: 'labels.new' };
        req.flash('danger', i18next.t('flash.labels.create.error'));
        reply
          .code(422)
          .render('/labels/new', { labelsForm, errors: data });
        return reply;
      }
    })
    .get('/labels/:id/edit', { name: 'labelsEdit', preHandler: checkSignedIn }, async (req, reply) => {
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
      const labelsForm = { translationPath: 'label.edit', ...labelName };
      reply.render('/labels/edit', { labelsForm });
      return reply;
    })
    .patch('/labels/:id/edit', { name: 'labelsUpdate', preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const newData = await app.objection.models.label.fromJson(req.body.form);
        const tag = await app.objection.models.label.query().findById(req.params.id);
        await tag.$query().patch(newData);
        req.flash('success', i18next.t('flash.labels.modify.success'));
        reply.redirect(app.reverse('labelsIndex'));
        return reply;
      } catch ({ data }) {
        const labelsForm = { translationPath: 'labels.edit', ...req.body.form };
        req.flash('danger', i18next.t('flash.labels.modify.error'));
        reply
          .code(422)
          .render('/labels/edit', { labelsForm, errors: data });
        return reply;
      }
    })
    .delete('/labels/:id', { name: 'labelsDestroy', preHandler: checkSignedIn }, async (req, reply) => {
      const label = await app.objection.models.label.query().findById(req.params.id);
      await label.$relatedQuery('tasks').unrelate();
      await label.$query().delete();
      req.flash('success', i18next.t('flash.labels.delete.success'));
      reply.redirect(app.reverse('labelsIndex'));
      return reply;
    });
};
