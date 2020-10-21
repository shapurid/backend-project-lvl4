exports.up = (knex) => knex.schema.createTable('tasks', (table) => {
  table.increments('id').primary();
  table.string('name').notNullable();
  table.string('description').nullable();
  table.integer('task_status_id').notNullable();
  table.integer('creator_id').notNullable();
  table.integer('executor_id').nullable();
  table.timestamps(true, true);

  table.foreign('task_status_id').references('id').inTable('task_statuses');
  table.foreign('creator_id').references('id').inTable('users');
  table.foreign('executor_id').references('id').inTable('users');
});

exports.down = (knex) => knex.schema.dropTable('tasks');
