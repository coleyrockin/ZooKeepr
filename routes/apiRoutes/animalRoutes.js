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
  if (result) {
    res.json(result);
  } else {
    res.send(404);
  }
});

router.post('/animals', rateLimitWrites, requireWriteAuth, async (req, res) => {
  try {
    const animal = await createNewAnimal(req.body, animals);
    res.status(201).json(animal);
  } catch (err) {
    if (err.message.includes('Invalid animal payload')) {
      res.status(400).send('The animal is not properly formatted.');
      return;
    }

    console.error(`Could not create animal: ${err.message}`);
    res.status(500).send('Unable to save animal data.');
  }
});

module.exports = router;
