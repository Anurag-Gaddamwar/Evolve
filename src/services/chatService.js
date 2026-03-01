const NodeCache = require('node-cache');
// store last N messages per session
const MAX_CONTEXT_LENGTH = parseInt(process.env.CHAT_CONTEXT_LENGTH || '10', 10);
const contextCache = new NodeCache({ stdTTL: parseInt(process.env.CHAT_CONTEXT_TTL || '3600', 10), checkperiod: 60 });

function getContext(sessionId) {
  const ctx = contextCache.get(sessionId);
  return ctx ? [...ctx] : [];
}

function addMessage(sessionId, message) {
  let ctx = contextCache.get(sessionId) || [];
  ctx.push(message);
  if (ctx.length > MAX_CONTEXT_LENGTH) {
    ctx = ctx.slice(ctx.length - MAX_CONTEXT_LENGTH);
  }
  contextCache.set(sessionId, ctx);
}

module.exports = { getContext, addMessage };