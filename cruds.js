'use strict';

const db = require('./db');

function find (name) {
  return db.query('SELECT * FROM circuits WHERE name = $1 order by the_date desc', [name]);
}

// function findAll () {
//   return db.query('SELECT * FROM products');
// }

function create (circuit, name) {
  return db.query('INSERT INTO circuits (circuit, name) VALUES ($1, $2)', [circuit, name]);
}

// function update (options = {}) {
//   return db.query('UPDATE products SET name = $1, stock = $2 WHERE id = $3', [options.name, options.stock, options.id]);
// }

// function remove (id) {
//   return db.query('DELETE FROM products WHERE id = $1', [id]);
// }

module.exports = {
  find,
  create
  // findAll,
  // update,
  // remove
};
