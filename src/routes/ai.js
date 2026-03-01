const express = require('express');
const { generateContent } = require('../services/groqService');

const router = express.Router();

router.post('/generate-content', async (req, res) => {
  try {
    const data = req.body;
    const result = await generateContent(data); // { raw, parsed }
    res.json(result);
  } catch (err) {
    console.error('AI route error', err);
    res.status(500).json({ error: 'AI generation failed' });
  }
});

module.exports = router;