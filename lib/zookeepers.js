const { getDb } = require('./db');
const { sanitizeString } = require('./dataUtils');

const ZK_SORT_FIELDS = new Set(['id', 'name', 'age', 'favorite_animal']);
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function rowToZookeeper(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    favoriteAnimal: row.favorite_animal
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

function parseSort(query) {
  const raw = sanitizeString(query.sort, 40);
  if (!raw) return { field: 'id', direction: 'ASC' };
  const direction = raw.startsWith('-') ? 'DESC' : 'ASC';
  const apiField = raw.replace(/^-/, '');
  // map api field names to column names
  const map = { id: 'id', name: 'name', age: 'age', favoriteAnimal: 'favorite_animal' };
  const column = map[apiField];
  if (!column || !ZK_SORT_FIELDS.has(column)) {
    return { field: 'id', direction: 'ASC' };
  }
  return { field: column, direction };
}

function listZookeepers(query = {}) {
  const db = getDb();
  const where = [];
  const params = {};

  if (query.age) {
    const age = Number.parseInt(query.age, 10);
    if (Number.isInteger(age)) {
      where.push('age = @age');
      params.age = age;
    }
  }
  if (query.favoriteAnimal) {
    const fa = sanitizeString(query.favoriteAnimal, 80).toLowerCase();
    if (fa) {
      where.push('LOWER(favorite_animal) = @favorite_animal');
      params.favorite_animal = fa;
    }
  }
  if (query.name) {
    const name = sanitizeString(query.name, 80).toLowerCase();
    if (name) {
      where.push('LOWER(name) = @name');
      params.name = name;
    }
  }

  const sort = parseSort(query);
  const { limit, offset } = parsePagination(query);
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sql = `
    SELECT id, name, age, favorite_animal
    FROM zookeepers
    ${whereClause}
    ORDER BY ${sort.field} ${sort.direction}
    LIMIT @limit OFFSET @offset
  `;

  return db.prepare(sql).all({ ...params, limit, offset }).map(rowToZookeeper);
}

function findZookeeper(id) {
  const db = getDb();
  const numericId = Number.parseInt(id, 10);
  if (!Number.isInteger(numericId)) return null;
  const row = db
    .prepare('SELECT id, name, age, favorite_animal FROM zookeepers WHERE id = ?')
    .get(numericId);
  return rowToZookeeper(row);
}

function validateZookeeperCandidate(candidate) {
  return Boolean(
    candidate &&
      candidate.name &&
      candidate.favoriteAnimal &&
      Number.isInteger(candidate.age) &&
      candidate.age >= 1 &&
      candidate.age <= 130
  );
}

async function createZookeeper(body) {
  const candidate = {
    name: sanitizeString(body?.name, 80),
    age: Number(body?.age),
    favoriteAnimal: sanitizeString(body?.favoriteAnimal, 80)
  };

  if (!validateZookeeperCandidate(candidate)) {
    throw new Error('Invalid zookeeper payload');
  }

  const db = getDb();
  const info = db
    .prepare('INSERT INTO zookeepers (name, age, favorite_animal) VALUES (?, ?, ?)')
    .run(candidate.name, candidate.age, candidate.favoriteAnimal);
  return { id: info.lastInsertRowid, ...candidate };
}

module.exports = {
  listZookeepers,
  findZookeeper,
  createZookeeper,
  validateZookeeperCandidate
};
