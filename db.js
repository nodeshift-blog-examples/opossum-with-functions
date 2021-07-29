'use strict';
const { Pool } = require('pg');

const serviceHost = process.env.MY_DATABASE_SERVICE_HOST || process.env.POSTGRESQL_SERVICE_HOST || 'localhost';
const user = process.env.DB_USERNAME || process.env.POSTGRESQL_USER || 'luke';
const password = process.env.DB_PASSWORD || process.env.POSTGRESQL_PASSWORD || 'secret';
const databaseName = process.env.POSTGRESQL_DATABASE || 'opossum';
const connectionString = `postgresql://${user}:${password}@${serviceHost}:5432/${databaseName}`;

const pool = new Pool({
  connectionString
});

async function didInitHappen () {
  const query = 'select * from circuits';

  try {
    await pool.query(query);
    console.log('Database Already Created');
    return true;
  } catch (err) {
    return false;
  }
}

// -- Create the products table if not present
const initScript = `CREATE TABLE IF NOT EXISTS circuits (
  id        SERIAL PRIMARY KEY,
  circuit      VARCHAR(4000) NOT NULL,
  name      VARCHAR(40) NOT NULL,
  the_date timestamp default current_timestamp
);`;

async function query (text, parameters) {
  // Check that we have initialized the DB on each Query request
  const initHappened = await didInitHappen();
  if (!initHappened) {
    await init();
  }

  return pool.query(text, parameters);
}

async function init () {
  const initHappened = await didInitHappen();
  if (!initHappened) {
    return pool.query(initScript);
  }
}

module.exports = {
  query,
  init
};
