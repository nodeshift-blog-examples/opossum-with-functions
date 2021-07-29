const Opossum = require('opossum');
const db = require('./db');
const cruds = require('./cruds');

function nameService() {
  return Promise.reject();
}

let circuit;
const circuitName = 'funtimes';

async function init() {

  try {
    // is there anything that should be init;d more globally,  but this is the entry point i guess
    // should the functions be decelared by themeselsves
    const initd = await db.init();
    console.log(initd);
  } catch (err) {
    console.log('error', err);
  }

  let circuitExport;

  try {
    // import stats/status from the DB
    // This should only get loaded when the function starts back up
    const result = await cruds.find(circuitName);

    if (result.rowCount !== 0) {
      circuitExport = JSON.parse(result.rows[0].circuit);
    }

    console.log(circuitExport);
  } catch (err) {
    console.log('err', err);
  }

  // Set some circuit breaker options
  const circuitOptions = {
    name: circuitName,
    timeout: 3000, // If name service takes longer than .3 seconds, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
    resetTimeout: 10000, // After 10 seconds, try again.
    ...circuitExport // the saved off status/state if any
  };

  // Use a circuit breaker for the name service and define fallback function
  circuit = new Opossum(nameService, circuitOptions);
  circuit.fallback(_ => 'Fallback');

}

init();


/**
 * If you don't need any of the HTTP information from the
 * context instance, you may choose to have your function
 * invoked with destructured query parameters. For example,
 * this function expects a URL such as:
 *
 * curl -X GET localhost:8080?name=tiger
 *
 * @param {string} name the "name" query parameter
 */
async function invokeDestructured({ name }) {
  // debug: inspect --brk for faas-js
  const result = await circuit.fire();

  const circuitAsJSON = circuit.toJSON();
  console.log(circuitAsJSON);
  // Right out to somewhere
  // Now write the json to a  DB
  try {
    await cruds.create(JSON.stringify(circuitAsJSON), circuitName);
  } catch (err) {
    console.log('errrrr', err);
  }

  return `Hello ${result}!`;
}

module.exports = invokeDestructured;
