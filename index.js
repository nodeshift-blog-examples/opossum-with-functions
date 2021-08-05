const Opossum = require('opossum');
const db = require('./db');
const cruds = require('./cruds');

let circuit;
const circuitName = 'funtimes';

function externalService () {
  return Promise.reject('Fail');
}

function outputCircuitOptions (message, circuit) {
  let circuitAsJSON = circuit.toJSON();
  console.log(message, circuitAsJSON.state);
}

async function init() {

  try {
    // is there anything that should be init;d more globally,  but this is the entry point i guess
    // should the functions be decelared by themeselsves
    const initd = await db.init();
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

    console.log('init export state', circuitExport.state);
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
  circuit = new Opossum(externalService, circuitOptions);
  circuit.fallback(_ => 'Fallback');

  circuit.on('success',
    (result) => {
      outputCircuitOptions(`SUCCESS: ${JSON.stringify(result)}`, circuit)
  });

  circuit.on('timeout',
    (result) => {
      outputCircuitOptions('TIMEOUT: Service is taking too long to respond.', circuit)
    });

  circuit.on('reject',
    () => {
      outputCircuitOptions('REJECTED: The circuit for ${route} is open. Failing fast.', circuit)
    });

  circuit.on('open',
    () => {
      outputCircuitOptions('OPEN: The circuit for the service just opened.', circuit)
    });

  circuit.on('halfOpen',
    () => {
      outputCircuitOptions('HALF_OPEN: The circuit for the service is half open.', circuit)
    });

  circuit.on('close',
    () => {
      outputCircuitOptions('CLOSE: The circuit has closed. Service OK.', circuit)
    });

  circuit.on('fallback',
    (data) => {
      outputCircuitOptions(`FALLBACK: ${JSON.stringify(data)}`, circuit)
    });

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
  // export the current circuit
  outputCircuitOptions('invoke circuit state before', circuit);

  const result = await circuit.fire();

  // export the current circuit
  outputCircuitOptions('invoke circuit state after', circuit);
  // Now write the json to a  DB
  try {
    await cruds.create(JSON.stringify(circuit.toJSON()), circuitName);
  } catch (err) {
    console.log('errrrr', err);
  }

  return `Hello ${result}!`;
}

module.exports = invokeDestructured;
