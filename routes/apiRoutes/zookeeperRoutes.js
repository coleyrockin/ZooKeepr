const router = require('express').Router();
const {
  filterByQuery,
  findById,
  createNewZookeeper
} = require('../../lib/zookeepers');
const { rateLimitWrites, requireWriteAuth } = require('./writeSecurity');
const { zookeepers } = require('../../data/zookeepers');

router.get('/zookeepers', (req, res) => {
  let results = zookeepers;
  if (req.query) {
    results = filterByQuery(req.query, results);
  }
  res.json(results);
});

router.get('/zookeepers/:id', (req, res) => {
  const result = findById(req.params.id, zookeepers);
  if (result) {
    res.json(result);
  } else {
    res.send(404);
  }
});

router.post('/zookeepers', rateLimitWrites, requireWriteAuth, async (req, res) => {
  try {
    const zookeeper = await createNewZookeeper(req.body, zookeepers);
    res.status(201).json(zookeeper);
  } catch (err) {
    if (err.message.includes('Invalid zookeeper payload')) {
      res.status(400).send('The zookeeper is not properly formatted.');
      return;
    }

    console.error(`Could not create zookeeper: ${err.message}`);
    res.status(500).send('Unable to save zookeeper data.');
  }
});

module.exports = router;
