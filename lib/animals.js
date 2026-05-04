const path = require('path');
const { sanitizeString, createNextId, writeJsonFileRaw, withFileLock } = require('./dataUtils');

const DATA_PATH = path.join(__dirname, '../data/animals.json');

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
      filteredResults = filteredResults.filter(animal =>
        Array.isArray(animal.personalityTraits)
          ? animal.personalityTraits.some(item => item.toLowerCase() === trait.toLowerCase())
          : false
      );
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
  return animalsArray.find(animal => String(animal.id) === String(id));
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

async function createNewAnimal(body, animalsArray) {
  const candidate = {
    name: sanitizeString(body.name, 80),
    species: sanitizeString(body.species, 60),
    diet: sanitizeString(body.diet, 30),
    personalityTraits: sanitizeTraits(body.personalityTraits)
  };

  if (!validateAnimal(candidate)) {
    throw new Error('Invalid animal payload');
  }

  return withFileLock(DATA_PATH, async () => {
    const animal = { id: createNextId(animalsArray), ...candidate };
    await writeJsonFileRaw(DATA_PATH, { animals: [...animalsArray, animal] });
    animalsArray.push(animal);
    return animal;
  });
}

module.exports = {
  filterByQuery,
  findById,
  createNewAnimal,
  validateAnimal
};
