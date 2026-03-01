const express = require('express');
const { botReply } = require('../services/groqService');

const router = express.Router();

router.post('/bot-response', async (req, res) => {
  try {
    const rawRequest = req.body?.userRequest;
    const userRequest = typeof rawRequest === 'string' ? rawRequest.trim() : '';
    const rawChatSessionId = req.body?.chatSessionId;
    const chatSessionId = typeof rawChatSessionId === 'string' ? rawChatSessionId.trim() : '';
    const rawChatId = req.body?.chatId;
    const chatId = typeof rawChatId === 'string' ? rawChatId.trim() : 'default';
    const rawChatHistory = req.body?.chatHistory;
    if (!userRequest) {
      return res.status(400).json({ error: 'userRequest is required' });
    }

    // identify session via explicit browser chat session id, then JWT, then IP+UA fallback
    let sessionId;
    if (chatSessionId) {
      sessionId = `chat:${chatSessionId}`;
    }

    try {
      const cookie = req.headers.cookie || '';
      const match = cookie.match(/token=([^;]+)/);
      if (!sessionId && match) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(match[1], process.env.TOKEN_SECRET || '');
        sessionId = `user:${decoded.id}`;
      }
    } catch (_e) {
      // ignore and fallback
    }

    if (!sessionId) {
      const ip = req.ip || 'unknown-ip';
      const ua = req.get('user-agent') || 'unknown-ua';
      sessionId = `anon:${ip}:${ua.slice(0, 80)}`;
    }

    const contextKey = `${sessionId}:chat:${chatId || 'default'}`;

    const context = Array.isArray(rawChatHistory)
      ? rawChatHistory
          .filter((msg) => msg && typeof msg.text === 'string' && msg.text.trim())
          .map((msg) => ({
            from: msg.from === 'assistant' ? 'assistant' : 'user',
            text: msg.text.trim(),
          }))
          .slice(-20)
      : [];

    const text = await botReply(userRequest, context);

    res.json({ text, contextKey });
  } catch (err) {
    console.error('Bot route error', err);
    res.status(500).json({ error: 'Failed to generate bot response' });
  }
});

module.exports = router;
