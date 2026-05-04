const { useInMemoryDatabase, resetDatabase } = require('../lib/db');
const {
  listZookeepers,
  findZookeeper,
  createZookeeper,
  validateZookeeperCandidate
} = require('../lib/zookeepers');

let db;

beforeEach(() => {
  db = useInMemoryDatabase();
});

afterEach(() => {
  resetDatabase();
});

function seed(rows) {
  const insert = db.prepare(
    'INSERT INTO zookeepers (name, age, favorite_animal) VALUES (?, ?, ?)'
  );
  rows.forEach(r => insert.run(r.name, r.age, r.favoriteAnimal));
}

test('creates a zookeeper with an integer id', async () => {
  const zk = await createZookeeper({ name: 'Boyd', age: 30, favoriteAnimal: 'cat' });
  expect(zk.name).toBe('Boyd');
  expect(zk.age).toBe(30);
});

test('rejects out-of-range age', async () => {
  await expect(createZookeeper({ name: 'X', age: 200, favoriteAnimal: 'cat' })).rejects.toThrow(
    /Invalid/
  );
  await expect(createZookeeper({ name: 'X', age: 0, favoriteAnimal: 'cat' })).rejects.toThrow(
    /Invalid/
  );
});

test('filters by age', () => {
  seed([
    { name: 'A', age: 25, favoriteAnimal: 'cat' },
    { name: 'B', age: 40, favoriteAnimal: 'dog' }
  ]);
  const result = listZookeepers({ age: '25' });
  expect(result.length).toBe(1);
  expect(result[0].name).toBe('A');
});

test('filters by favoriteAnimal case-insensitively', () => {
  seed([
    { name: 'A', age: 25, favoriteAnimal: 'Cat' },
    { name: 'B', age: 40, favoriteAnimal: 'dog' }
  ]);
  const result = listZookeepers({ favoriteAnimal: 'cat' });
  expect(result.length).toBe(1);
});

test('finds by id', () => {
  seed([{ name: 'Boyd', age: 30, favoriteAnimal: 'cat' }]);
  const result = findZookeeper('1');
  expect(result.name).toBe('Boyd');
});

test('returns null for unknown id', () => {
  expect(findZookeeper('999')).toBeNull();
  expect(findZookeeper('abc')).toBeNull();
});

test('paginates results', () => {
  seed(
    Array.from({ length: 5 }, (_, i) => ({
      name: `Z${i}`,
      age: 20 + i,
      favoriteAnimal: 'cat'
    }))
  );
  const page1 = listZookeepers({ limit: 2, offset: 0 });
  const page2 = listZookeepers({ limit: 2, offset: 2 });
  expect(page1.length).toBe(2);
  expect(page2.length).toBe(2);
  expect(page1[0].id).not.toBe(page2[0].id);
});

test('sorts by age desc', () => {
  seed([
    { name: 'A', age: 25, favoriteAnimal: 'cat' },
    { name: 'B', age: 40, favoriteAnimal: 'dog' }
  ]);
  const result = listZookeepers({ sort: '-age' });
  expect(result.map(z => z.age)).toEqual([40, 25]);
});

test('validateZookeeperCandidate enforces invariants', () => {
  expect(validateZookeeperCandidate({ name: 'X', age: 30, favoriteAnimal: 'cat' })).toBe(true);
  expect(validateZookeeperCandidate({ name: '', age: 30, favoriteAnimal: 'cat' })).toBe(false);
  expect(validateZookeeperCandidate({ name: 'X', age: 1.5, favoriteAnimal: 'cat' })).toBe(false);
});
