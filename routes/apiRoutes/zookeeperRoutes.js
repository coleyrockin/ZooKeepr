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
  if (!result) {
    return res.status(404).json({ error: `Zookeeper with id '${req.params.id}' not found.` });
  }

  return res.json(result);
});

router.post('/zookeepers', rateLimitWrites, requireWriteAuth, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }

    const zookeeper = await createNewZookeeper(req.body, zookeepers);
    res.status(201).json(zookeeper);
  } catch (err) {
    if (err.message.includes('Invalid zookeeper payload')) {
      return res.status(400).json({ error: 'The zookeeper is not properly formatted.' });
    }

    console.error(`Could not create zookeeper: ${err.message}`);
    return res.status(500).json({ error: 'Unable to save zookeeper data.' });
  }
});

module.exports = router;
