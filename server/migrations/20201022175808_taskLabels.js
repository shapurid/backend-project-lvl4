exports.up = (knex) => knex.schema.createTable('task_labels', (table) => {
  table.integer('task_id').references('id').inTable('tasks');
  table.integer('label_id').references('id').inTable('labels');
  table.timestamps(true, true);
});

exports.down = (knex) => knex.schema.dropTable('task_labels');
