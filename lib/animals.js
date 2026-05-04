const { getDb } = require('./db');
const { sanitizeString } = require('./dataUtils');

const ANIMAL_SORT_FIELDS = new Set(['id', 'name', 'species', 'diet']);
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function sanitizeTraits(traits) {
  if (!Array.isArray(traits)) {
    return [];
  }
  return traits
    .map(trait => sanitizeString(trait, 40))
    .filter(trait => trait.length > 0)
    .slice(0, 20);
}

function rowToAnimal(row) {
  if (!row) return null;
  let traits = [];
  try {
    const parsed = JSON.parse(row.personality_traits || '[]');
    if (Array.isArray(parsed)) traits = parsed;
  } catch {
    /* ignore corrupt JSON */
  }
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    diet: row.diet,
    personalityTraits: traits
  };
}

function parsePagination(query) {
  const limitRaw = Number.parseInt(query.limit, 10);
  const offsetRaw = Number.parseInt(query.offset, 10);
  const limit = Number.isInteger(limitRaw) && limitRaw > 0
    ? Math.min(limitRaw, MAX_LIMIT)
    : DEFAULT_LIMIT;
  const offset = Number.isInteger(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;
  return { limit, offset };
}

function parseSort(query, allowedFields, fallback = 'id') {
  const raw = sanitizeString(query.sort, 40);
  if (!raw) return { field: fallback, direction: 'ASC' };
  const direction = raw.startsWith('-') ? 'DESC' : 'ASC';
  const field = raw.replace(/^-/, '');
  if (!allowedFields.has(field)) {
    return { field: fallback, direction: 'ASC' };
  }
  return { field, direction };
}

function listAnimals(query = {}) {
  const db = getDb();
  const where = [];
  const params = {};

  if (query.diet) {
    const diet = sanitizeString(query.diet, 30).toLowerCase();
    if (diet) {
      where.push('LOWER(diet) = @diet');
      params.diet = diet;
    }
  }
  if (query.species) {
    const species = sanitizeString(query.species, 60).toLowerCase();
    if (species) {
      where.push('LOWER(species) = @species');
      params.species = species;
    }
  }
  if (query.name) {
    const name = sanitizeString(query.name, 80).toLowerCase();
    if (name) {
      where.push('LOWER(name) = @name');
      params.name = name;
    }
  }

  const sort = parseSort(query, ANIMAL_SORT_FIELDS);
  const { limit, offset } = parsePagination(query);

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `
    SELECT id, name, species, diet, personality_traits
    FROM animals
    ${whereClause}
    ORDER BY ${sort.field} ${sort.direction}
    LIMIT @limit OFFSET @offset
  `;

  const rows = db.prepare(sql).all({ ...params, limit, offset }).map(rowToAnimal);

  // Personality-trait filter is applied in JS (stored as JSON, not normalized).
  let result = rows;
  if (query.personalityTraits) {
    const traits = Array.isArray(query.personalityTraits)
      ? sanitizeTraits(query.personalityTraits)
      : sanitizeString(query.personalityTraits, 256)
          .split(',')
          .map(t => sanitizeString(t, 40))
          .filter(Boolean);

    traits.forEach(trait => {
      const lower = trait.toLowerCase();
      result = result.filter(animal =>
        animal.personalityTraits.some(item => String(item).toLowerCase() === lower)
      );
    });
  }

  return result;
}

function findAnimal(id) {
  const db = getDb();
  const numericId = Number.parseInt(id, 10);
  if (!Number.isInteger(numericId)) return null;
  const row = db
    .prepare('SELECT id, name, species, diet, personality_traits FROM animals WHERE id = ?')
    .get(numericId);
  return rowToAnimal(row);
}

function validateAnimalCandidate(candidate) {
  return Boolean(
    candidate &&
      candidate.name &&
      candidate.species &&
      candidate.diet &&
      Array.isArray(candidate.personalityTraits) &&
      candidate.personalityTraits.length > 0 &&
      candidate.personalityTraits.length <= 20
  );
}

async function createAnimal(body) {
  const candidate = {
    name: sanitizeString(body?.name, 80),
    species: sanitizeString(body?.species, 60),
    diet: sanitizeString(body?.diet, 30),
    personalityTraits: sanitizeTraits(body?.personalityTraits)
  };

  if (!validateAnimalCandidate(candidate)) {
    throw new Error('Invalid animal payload');
  }

  const db = getDb();
  const info = db
    .prepare(
      'INSERT INTO animals (name, species, diet, personality_traits) VALUES (?, ?, ?, ?)'
    )
    .run(
      candidate.name,
      candidate.species,
      candidate.diet,
      JSON.stringify(candidate.personalityTraits)
    );
  return { id: info.lastInsertRowid, ...candidate };
}

module.exports = {
  listAnimals,
  findAnimal,
  createAnimal,
  validateAnimalCandidate
};
