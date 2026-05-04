const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DEFAULT_DB_PATH = path.join(__dirname, '..', 'data', 'zookeepr.sqlite');

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    diet TEXT NOT NULL,
    personality_traits TEXT NOT NULL DEFAULT '[]'
  )`,
  `CREATE INDEX IF NOT EXISTS idx_animals_diet ON animals(diet)`,
  `CREATE INDEX IF NOT EXISTS idx_animals_species ON animals(species)`,
  `CREATE INDEX IF NOT EXISTS idx_animals_name ON animals(name)`,
  `CREATE TABLE IF NOT EXISTS zookeepers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age BETWEEN 1 AND 130),
    favorite_animal TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_zookeepers_age ON zookeepers(age)`,
  `CREATE INDEX IF NOT EXISTS idx_zookeepers_name ON zookeepers(name)`
];

let dbInstance = null;

function getDbPath() {
  return process.env.ZOO_DB_PATH || DEFAULT_DB_PATH;
}

function applySchema(db) {
  for (const stmt of SCHEMA_STATEMENTS) {
    db.prepare(stmt).run();
  }
}

function openDatabase(dbPath = getDbPath()) {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  applySchema(db);
  return db;
}

function getDb() {
  if (!dbInstance) {
    dbInstance = openDatabase();
    seedFromJsonIfEmpty(dbInstance);
  }
  return dbInstance;
}

function seedFromJsonIfEmpty(db) {
  const animalCount = db.prepare('SELECT COUNT(*) AS n FROM animals').get().n;
  if (animalCount === 0) {
    const animalsJson = path.join(__dirname, '..', 'data', 'animals.json');
    if (fs.existsSync(animalsJson)) {
      try {
        const { animals = [] } = JSON.parse(fs.readFileSync(animalsJson, 'utf8'));
        const insert = db.prepare(
          'INSERT INTO animals (name, species, diet, personality_traits) VALUES (?, ?, ?, ?)'
        );
        const tx = db.transaction(rows => {
          for (const r of rows) {
            insert.run(
              String(r.name || ''),
              String(r.species || ''),
              String(r.diet || ''),
              JSON.stringify(Array.isArray(r.personalityTraits) ? r.personalityTraits : [])
            );
          }
        });
        tx(animals);
      } catch {
        /* ignore seed errors */
      }
    }
  }

  const zkCount = db.prepare('SELECT COUNT(*) AS n FROM zookeepers').get().n;
  if (zkCount === 0) {
    const zkJson = path.join(__dirname, '..', 'data', 'zookeepers.json');
    if (fs.existsSync(zkJson)) {
      try {
        const { zookeepers = [] } = JSON.parse(fs.readFileSync(zkJson, 'utf8'));
        const insert = db.prepare(
          'INSERT INTO zookeepers (name, age, favorite_animal) VALUES (?, ?, ?)'
        );
        const tx = db.transaction(rows => {
          for (const r of rows) {
            const age = Number(r.age);
            if (Number.isInteger(age) && age >= 1 && age <= 130) {
              insert.run(String(r.name || ''), age, String(r.favoriteAnimal || ''));
            }
          }
        });
        tx(zookeepers);
      } catch {
        /* ignore */
      }
    }
  }
}

function resetDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

function useInMemoryDatabase() {
  resetDatabase();
  process.env.ZOO_DB_PATH = ':memory:';
  dbInstance = openDatabase(':memory:');
  return dbInstance;
}

module.exports = {
  getDb,
  openDatabase,
  resetDatabase,
  useInMemoryDatabase
};
