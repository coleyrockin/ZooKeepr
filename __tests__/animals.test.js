const { useInMemoryDatabase, resetDatabase } = require('../lib/db');
const {
  listAnimals,
  findAnimal,
  createAnimal,
  validateAnimalCandidate
} = require('../lib/animals');

let db;

beforeEach(() => {
  db = useInMemoryDatabase();
});

afterEach(() => {
  resetDatabase();
});

function seedAnimals(rows) {
  const insert = db.prepare(
    'INSERT INTO animals (name, species, diet, personality_traits) VALUES (?, ?, ?, ?)'
  );
  rows.forEach(r =>
    insert.run(r.name, r.species, r.diet, JSON.stringify(r.personalityTraits || []))
  );
}

test('creates an animal record and returns it with an integer id', async () => {
  const animal = await createAnimal({
    name: 'Darlene',
    species: 'cat',
    diet: 'omnivore',
    personalityTraits: ['curious']
  });
  expect(animal.name).toBe('Darlene');
  expect(typeof animal.id === 'number' || typeof animal.id === 'bigint').toBe(true);
});

test('rejects an invalid animal payload', async () => {
  await expect(createAnimal({ name: 'X', species: 'Y', diet: '' })).rejects.toThrow(/Invalid/);
});

test('filters by species', () => {
  seedAnimals([
    { name: 'Erica', species: 'gorilla', diet: 'omnivore', personalityTraits: ['quirky'] },
    { name: 'Noel', species: 'bear', diet: 'carnivore', personalityTraits: ['brave'] }
  ]);
  const result = listAnimals({ species: 'gorilla' });
  expect(result.length).toBe(1);
  expect(result[0].name).toBe('Erica');
});

test('filters by personality traits (multi)', () => {
  seedAnimals([
    { name: 'A', species: 's', diet: 'omnivore', personalityTraits: ['quirky', 'rash'] },
    { name: 'B', species: 's', diet: 'omnivore', personalityTraits: ['quirky'] },
    { name: 'C', species: 's', diet: 'omnivore', personalityTraits: ['rash'] }
  ]);
  const both = listAnimals({ personalityTraits: 'quirky,rash' });
  expect(both.map(a => a.name)).toEqual(['A']);
});

test('finds by id', () => {
  seedAnimals([{ name: 'Erica', species: 'gorilla', diet: 'omnivore', personalityTraits: ['q'] }]);
  const result = findAnimal('1');
  expect(result.name).toBe('Erica');
});

test('returns null for unknown id', () => {
  expect(findAnimal('999')).toBeNull();
  expect(findAnimal('not-a-number')).toBeNull();
});

test('paginates with limit and offset', () => {
  seedAnimals(
    Array.from({ length: 5 }, (_, i) => ({
      name: `A${i}`,
      species: 's',
      diet: 'omnivore',
      personalityTraits: ['x']
    }))
  );
  const page1 = listAnimals({ limit: 2, offset: 0 });
  const page2 = listAnimals({ limit: 2, offset: 2 });
  expect(page1.length).toBe(2);
  expect(page2.length).toBe(2);
  expect(page1[0].id).not.toBe(page2[0].id);
});

test('sorts by allowed field with descending prefix', () => {
  seedAnimals([
    { name: 'Beta', species: 's', diet: 'omnivore', personalityTraits: ['x'] },
    { name: 'Alpha', species: 's', diet: 'omnivore', personalityTraits: ['x'] }
  ]);
  const asc = listAnimals({ sort: 'name' });
  const desc = listAnimals({ sort: '-name' });
  expect(asc.map(a => a.name)).toEqual(['Alpha', 'Beta']);
  expect(desc.map(a => a.name)).toEqual(['Beta', 'Alpha']);
});

test('rejects invalid sort field by falling back to id', () => {
  seedAnimals([
    { name: 'B', species: 's', diet: 'omnivore', personalityTraits: ['x'] },
    { name: 'A', species: 's', diet: 'omnivore', personalityTraits: ['x'] }
  ]);
  const result = listAnimals({ sort: '-malicious; DROP TABLE animals' });
  expect(result.length).toBe(2);
});

test('caps limit to MAX_LIMIT', () => {
  seedAnimals(
    Array.from({ length: 3 }, () => ({
      name: 'a',
      species: 's',
      diet: 'omnivore',
      personalityTraits: ['x']
    }))
  );
  const result = listAnimals({ limit: '10000' });
  expect(result.length).toBe(3);
});

test('validateAnimalCandidate returns true for valid object and false otherwise', () => {
  expect(
    validateAnimalCandidate({
      name: 'X',
      species: 'Y',
      diet: 'omnivore',
      personalityTraits: ['x']
    })
  ).toBe(true);
  expect(
    validateAnimalCandidate({ name: '', species: 'Y', diet: 'omnivore', personalityTraits: ['x'] })
  ).toBe(false);
  expect(
    validateAnimalCandidate({
      name: 'X',
      species: 'Y',
      diet: 'omnivore',
      personalityTraits: []
    })
  ).toBe(false);
});
