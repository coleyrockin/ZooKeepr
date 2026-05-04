const path = require('path');
const { sanitizeString, createNextId, writeJsonFile } = require('./dataUtils');

const DATA_PATH = path.join(__dirname, '../data/zookeepers.json');

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
  return zookeepers.find(zookeeper => String(zookeeper.id) === String(id));
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
    id: createNextId(zookeepers),
    name: sanitizeString(body.name, 80),
    age: Number(body.age),
    favoriteAnimal: sanitizeString(body.favoriteAnimal, 80)
  };

  if (!validateZookeeper(zookeeper)) {
    throw new Error('Invalid zookeeper payload');
  }

  zookeepers.push(zookeeper);
  await writeJsonFile(DATA_PATH, { zookeepers });
  return zookeeper;
}

module.exports = {
  filterByQuery,
  findById,
  createNewZookeeper,
  validateZookeeper
};
