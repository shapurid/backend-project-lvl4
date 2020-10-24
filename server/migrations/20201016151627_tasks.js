exports.up = (knex) => knex.schema.createTable('tasks', (table) => {
  table.increments('id').primary();
  table.string('name').notNullable();
  table.string('description').nullable();
  table.integer('task_status_id').notNullable().references('id').inTable('task_statuses');
  table.integer('creator_id').notNullable().references('id').inTable('users');
  table.integer('executor_id').nullable().references('id').inTable('users');
  table.timestamps(true, true);
});

exports.down = (knex) => knex.schema.dropTable('tasks');
