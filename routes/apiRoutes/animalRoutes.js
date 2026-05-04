const router = require('express').Router();
const { filterByQuery, findById, createNewAnimal } = require('../../lib/animals');
const { rateLimitWrites, requireWriteAuth } = require('./writeSecurity');
const { animals } = require('../../data/animals');

router.get('/animals', (req, res) => {
  let results = animals;
  if (req.query) {
    results = filterByQuery(req.query, results);
  }
  res.json(results);
});

router.get('/animals/:id', (req, res) => {
  const result = findById(req.params.id, animals);
  if (!result) {
    return res.status(404).json({ error: `Animal with id '${req.params.id}' not found.` });
  }

  return res.json(result);
});

router.post('/animals', rateLimitWrites, requireWriteAuth, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }

    const animal = await createNewAnimal(req.body, animals);
    res.status(201).json(animal);
  } catch (err) {
    if (err.message.includes('Invalid animal payload')) {
      return res.status(400).json({ error: 'The animal is not properly formatted.' });
    }

    console.error(`Could not create animal: ${err.message}`);
    return res.status(500).json({ error: 'Unable to save animal data.' });
  }
});

module.exports = router;
