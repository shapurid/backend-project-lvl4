import { Model } from 'objection';
import objectionUnique from 'objection-unique';

const unique = objectionUnique({ fields: ['name'] });

export default class TaskStatus extends unique(Model) {
  static get tableName() {
    return 'task_statuses';
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
}
