exports.up = (knex) => knex.schema.createTable('labels', (table) => {
  table.increments('id').primary();
  table.string('name').unique().notNullable();
  table.timestamps(true, true);
});

exports.down = (knex) => knex.schema.dropTable('labels');
