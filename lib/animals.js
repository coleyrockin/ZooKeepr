const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/animals.json');
let writeQueue = Promise.resolve();

function sanitizeString(value, maxLength) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength);
}

function sanitizeTraits(traits) {
  if (!Array.isArray(traits)) {
    return [];
  }

  return traits
    .map(trait => sanitizeString(trait, 40))
    .filter(trait => trait.length > 0)
    .slice(0, 20);
}

function filterByQuery(query, animalsArray) {
  let filteredResults = animalsArray;
  if (query.personalityTraits) {
    const personalityTraits = Array.isArray(query.personalityTraits)
      ? sanitizeTraits(query.personalityTraits)
      : sanitizeString(query.personalityTraits, 256)
          .split(',')
          .map(trait => sanitizeString(trait, 40))
          .filter(Boolean);

    personalityTraits.forEach(trait => {
      filteredResults = filteredResults.filter(animal => animal.personalityTraits.includes(trait));
    });
  }

  if (query.diet) {
    const diet = sanitizeString(query.diet, 30).toLowerCase();
    if (diet) {
      filteredResults = filteredResults.filter(
        animal => sanitizeString(animal.diet, 30).toLowerCase() === diet
      );
    }
  }

  if (query.species) {
    const species = sanitizeString(query.species, 60).toLowerCase();
    if (species) {
      filteredResults = filteredResults.filter(
        animal => sanitizeString(animal.species, 60).toLowerCase() === species
      );
    }
  }

  if (query.name) {
    const name = sanitizeString(query.name, 80).toLowerCase();
    if (name) {
      filteredResults = filteredResults.filter(
        animal => sanitizeString(animal.name, 80).toLowerCase() === name
      );
    }
  }

  return filteredResults;
}

function findById(id, animalsArray) {
  return animalsArray.filter(animal => String(animal.id) === String(id))[0];
}

function validateAnimal(animal) {
  if (!animal || typeof animal !== 'object') {
    return false;
  }

  if (!animal.name || !animal.species || !animal.diet) {
    return false;
  }

  if (!Array.isArray(animal.personalityTraits) || animal.personalityTraits.length === 0) {
    return false;
  }

  if (animal.personalityTraits.length > 20) {
    return false;
  }

  return true;
}

function writeAnimals(animalsArray) {
  const writeOperation = () => new Promise((resolve, reject) => {
    fs.writeFile(DATA_PATH, JSON.stringify({ animals: animalsArray }, null, 2), 'utf8', err => {
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

async function createNewAnimal(body, animalsArray) {
  const animal = {
    id: String(animalsArray.length),
    name: sanitizeString(body.name, 80),
    species: sanitizeString(body.species, 60),
    diet: sanitizeString(body.diet, 30),
    personalityTraits: sanitizeTraits(body.personalityTraits)
  };

  if (!validateAnimal(animal)) {
    throw new Error('Invalid animal payload');
  }

  animalsArray.push(animal);
  await writeAnimals(animalsArray);
  return animal;
}

module.exports = {
  filterByQuery,
  findById,
  createNewAnimal,
  validateAnimal
};
