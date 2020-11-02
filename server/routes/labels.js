import i18next from 'i18next';
import { checkSignedIn } from '../lib/preHandlers';

export default (app) => {
  app
    .get('/labels', { name: 'labels', preHandler: checkSignedIn }, async (req, reply) => {
      const labelsForm = { entityName: 'labels.index' };
      const labels = await app.objection.models.label.query();
      reply.render('/labels/index', { labelsForm, labels });
      return reply;
    })
    .get('/labels/new', { name: 'newLabel', preHandler: checkSignedIn }, (req, reply) => {
      const labelsForm = { entityName: 'labels.new' };
      reply.render('/labels/new', { labelsForm });
      return reply;
    })
    .post('/labels', { name: 'createLabel', preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const tag = await app.objection.models.label.fromJson(req.body);
        await app.objection.models.label.query().insert(tag);
        req.flash('success', i18next.t('flash.labels.create.success'));
        reply.redirect(app.reverse('labels'));
        return reply;
      } catch ({ data }) {
        const labelsForm = { entityName: 'labels.new' };
        const isNameUniqError = data.name
          ? data.name.some((el) => el.keyword === 'unique')
          : false;
        if (isNameUniqError) {
          req.flash('danger', i18next.t('flash.labels.create.error'));
        }
        reply
          .code(422)
          .render('/labels/new', { labelsForm, errors: data });
        return reply;
      }
    })
    .get('/labels/:id/edit', { name: 'labelProfile', preHandler: checkSignedIn }, async (req, reply) => {
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
      const labelsForm = { entityName: 'label.edit', ...labelName };
      reply.render('/labels/edit', { labelsForm });
      return reply;
    })
    .patch('/labels/:id/edit', { name: 'editLabel', preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const newData = await app.objection.models.label.fromJson(req.body);
        const tag = await app.objection.models.label.query().findById(req.params.id);
        await tag.$query().patch(newData);
        req.flash('success', i18next.t('flash.labels.modify.success'));
        reply.redirect(app.reverse('labels'));
        return reply;
      } catch ({ data }) {
        const labelsForm = { entityName: 'label.edit', ...req.body };
        const isNameUniqError = data.name
          ? data.name.some((el) => el.keyword === 'unique')
          : false;
        if (isNameUniqError) {
          req.flash('danger', i18next.t('flash.labels.modify.error'));
        }
        reply
          .code(422)
          .render('/labels/edit', { labelsForm, errors: data });
        return reply;
      }
    })
    .delete('/labels/:id', { name: 'deleteLabel', preHandler: checkSignedIn }, async (req, reply) => {
      const label = await app.objection.models.label.query().findById(req.params.id);
      await label.$relatedQuery('tasks').unrelate();
      await label.$query().delete();
      req.flash('success', i18next.t('flash.labels.delete.success'));
      reply.redirect(app.reverse('labels'));
      return reply;
    });
};
