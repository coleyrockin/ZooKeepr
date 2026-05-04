const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/zookeepers.json');
let writeQueue = Promise.resolve();

function sanitizeString(value, maxLength) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength);
}

function filterByQuery(query, zookeepers) {
  let filteredResults = zookeepers;

  if (query.age) {
    const age = Number(query.age);
    if (!Number.isNaN(age)) {
      filteredResults = filteredResults.filter(zookeeper => zookeeper.age === age);
    }
  }

  if (query.favoriteAnimal) {
    const favoriteAnimal = sanitizeString(query.favoriteAnimal, 60).toLowerCase();
    if (favoriteAnimal) {
      filteredResults = filteredResults.filter(
        zookeeper => sanitizeString(zookeeper.favoriteAnimal, 60).toLowerCase() === favoriteAnimal
      );
    }
  }

  if (query.name) {
    const name = sanitizeString(query.name, 80).toLowerCase();
    if (name) {
      filteredResults = filteredResults.filter(
        zookeeper => sanitizeString(zookeeper.name, 80).toLowerCase() === name
      );
    }
  }

  return filteredResults;
}

function findById(id, zookeepers) {
  return zookeepers.filter(zookeeper => String(zookeeper.id) === String(id))[0];
}

function writeZookeepers(zookeepers) {
  const writeOperation = () => new Promise((resolve, reject) => {
    fs.writeFile(DATA_PATH, JSON.stringify({ zookeepers }, null, 2), 'utf8', err => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });

  writeQueue = writeQueue.then(writeOperation, writeOperation);
  return writeQueue;
}

function validateZookeeper(zookeeper) {
  if (!zookeeper || typeof zookeeper !== 'object') {
    return false;
  }

  if (!zookeeper.name || !zookeeper.favoriteAnimal) {
    return false;
  }

  if (typeof zookeeper.age !== 'number' || !Number.isInteger(zookeeper.age)) {
    return false;
  }

  if (zookeeper.age < 1 || zookeeper.age > 130) {
    return false;
  }

  return true;
}

async function createNewZookeeper(body, zookeepers) {
  const zookeeper = {
    id: String(zookeepers.length),
    name: sanitizeString(body.name, 80),
    age: Number(body.age),
    favoriteAnimal: sanitizeString(body.favoriteAnimal, 80)
  };

  if (!validateZookeeper(zookeeper)) {
    throw new Error('Invalid zookeeper payload');
  }

  zookeepers.push(zookeeper);
  await writeZookeepers(zookeepers);
  return zookeeper;
}

module.exports = {
  filterByQuery,
  findById,
  createNewZookeeper,
  validateZookeeper
};
