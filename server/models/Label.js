import { Model } from 'objection';
import { join } from 'path';
import objectionUnique from 'objection-unique';

const unique = objectionUnique({ fields: ['name'] });

export default class Label extends unique(Model) {
  static get tableName() {
    return 'labels';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        id: {
          type: 'integer',
          minimum: -2147483648,
          maximum: 2147483647,
        },
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 255,
        },
      },
    };
  }

  static get relationMappings() {
    return {
      tasks: {
        relation: Model.ManyToManyRelation,
        modelClass: join(__dirname, 'Task'),
        join: {
          from: 'labels.id',
          through: {
            from: 'task_labels.labelId',
            to: 'task_labels.taskId',
          },
          to: 'tasks.id',
        },
      },
    };
  }
}
