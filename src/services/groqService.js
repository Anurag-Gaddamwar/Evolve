const Groq = require('groq-sdk');
const NodeCache = require('node-cache');

// 5 minute cache for AI responses
const aiCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// configure from env
const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: parseInt(process.env.GROQ_TIMEOUT || '30000', 10),
  maxRetries: parseInt(process.env.GROQ_MAX_RETRIES || '2', 10),
});

function isCreatorIntent(text = '') {
  const q = text.toLowerCase();
  const keywords = [
    'youtube', 'video', 'channel', 'thumbnail', 'title', 'hook', 'retention',
    'script', 'editing', 'views', 'subscribers', 'shorts', 'reel', 'upload',
    'cta', 'tags', 'keywords', 'content idea', 'content plan', 'content'
  ];
  return keywords.some((k) => q.includes(k));
}

/* =========================================================
   BUILD PROMPT FOR ANALYTICS JSON RESPONSE
========================================================= */
function buildPrompt(data) {
  const {
    comments = '',
    videoTitle = '',
    likes = 0,
    // If the dislike count is missing we represent that as null so callers
    // know the value wasn't zero but hidden by the creator.
    dislikes = null,
    commentsCount = 0,
    datePosted = '',
    engagementRate = '',
    subscriberCount = 0,
    channelName = '',
    views = 0
  } = data;

  const displayDislikes = dislikes == null ? 'hidden' : dislikes;

  return `
You are a YouTube analytics intelligence engine.

You must ONLY analyze based on:
- The real video statistics provided
- The actual comment text provided

Do NOT fabricate large numbers.
Do NOT invent signals that are not present in comments.

VIDEO DATA:
Title: ${videoTitle}
Channel: ${channelName}
Subscribers: ${subscriberCount}
Views: ${views}
Likes: ${likes}
Dislikes: ${displayDislikes}
Comments Count: ${commentsCount}
Engagement Rate: ${engagementRate}
Published: ${datePosted}

COMMENTS:
${comments}

INSTRUCTIONS:

1. Sentiment must be derived from the tone of the comments.  Output an
   object with percentages for \`positive\`, \`neutral\`, and \`negative\`.
2. \`questions\` should be an array of distinct viewer questions found in the
   comments (up to 10).
3. \`topComments\` should list the 10-15 most representative or insightful
   top-level comments.
4. \`suggestions\` (now called contentRecommendations) must be an array of 5-8 detailed, actionable recommendations for future video content. Each item should explain the recommendation, why it's suggested based on data/feedback, and how to implement it.
5. \`conclusion\` should be an array of key points summarizing the video's performance, including strengths, weaknesses, lessons, and future advice.
6. \`highlights\` should be a bulleted list of the most notable signals or
   findings (positive or negative).
7. \`actionableSteps\` should be an array of 3-5 specific, actionable steps the creator can take immediately to improve future videos.
8. \`opportunities\` should be an array of potential opportunities or areas for growth identified from the data.

IMPORTANT:
If comment count < 20, reduce confidence metrics.
If comment count < 5, most advanced metrics should be low.

Return ONLY valid JSON.

{
  "sentiment": { "positive": 0, "neutral": 0, "negative": 0 },
  "questions": [],
  "topComments": [],
  "suggestions": [],
  "conclusion": [],
  "highlights": [],
  "actionableSteps": [],
  "opportunities": []
}
`;
}

/* =========================================================
   GENERATE CONTENT (ANALYTICS MODE)
========================================================= */
// helper that mirrors the cleanup logic we previously had on the client
function parseAIResponse(responseText) {
  if (!responseText || typeof responseText !== 'string') return null;
  let cleaned = responseText.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();

  // if the entire payload is wrapped in single backticks (e.g. `json
  // {...}`) strip them as well, since our test suite and some malformed
  // outputs have used that style.
  if (cleaned.startsWith('`') && cleaned.endsWith('`')) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // peel off an outer quoted string if present
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    try {
      const unquoted = JSON.parse(cleaned);
      if (typeof unquoted === 'string') {
        cleaned = unquoted;
        // console.log('backend unwrapped quoted JSON string');
      }
    } catch (e) {
      console.warn('backend failed to unquote JSON; continuing with cleaned text', e.message);
    }
  }

  try {
    const obj = JSON.parse(cleaned);
    // some LLMs have started using the name
    // "contentRecommendations" instead of "suggestions"; normalize here
    if ((!obj.suggestions || (Array.isArray(obj.suggestions) && obj.suggestions.length === 0)) && obj.contentRecommendations) {
      obj.suggestions = obj.contentRecommendations;
    }
    return obj;
  } catch (err) {
    // if trailing junk (like "Note: ..." or similar) was appended after
    // the JSON, attempt to chop everything after the last closing brace.
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < cleaned.length - 1) {
      const truncated = cleaned.slice(0, lastBrace + 1);
      try {
        return JSON.parse(truncated);
      } catch (e2) {
        console.warn('backend parse after truncating trailing text still failed', e2.message);
        // fall through to regex extraction below
      }
    }

    console.warn('backend JSON parse failed after cleanup, attempting regex extraction');
    const tryExtract = (name) => {
      const re = new RegExp(`"${name}"\s*:\s*(\{[^\}]*\}|\[[^\]]*\]|"[^"]*"|[^,\}]+)`,'s');
      const m = cleaned.match(re);
      if (m) {
        let txt = m[1];
        try {
          return JSON.parse(txt);
        } catch (e) {
          return txt.replace(/^"|"$/g, '');
        }
      }
      return null;
    };
    return {
      sentiment: tryExtract('sentiment'),
      questions: tryExtract('questions'),
      topComments: tryExtract('topComments'),
      suggestions: tryExtract('suggestions'),
      conclusion: tryExtract('conclusion'),
      highlights: tryExtract('highlights'),
      actionableSteps: tryExtract('actionableSteps'),
      opportunities: tryExtract('opportunities'),
    };
  }
}

async function generateContent(data) {
  const cacheKey = `ai:${JSON.stringify(data).substring(0, 200)}`;
  const cached = aiCache.get(cacheKey);
  if (cached) return cached;

  const prompt = buildPrompt(data);

  try {
    const response = await groqClient.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      temperature: parseFloat(process.env.GROQ_TEMP || '0.7'),
      max_tokens: parseInt(process.env.GROQ_MAX_TOKENS || '2048', 10),
      top_p: parseFloat(process.env.GROQ_TOP_P || '0.9'),
    });

    const text = response.choices?.[0]?.message?.content || '';
    const parsed = parseAIResponse(text);

    const result = { raw: text, parsed };

    aiCache.set(cacheKey, result);

    // log both raw and parsed so developers can see exactly what is sent
    // console.log('AI generateContent returning raw text:', result.raw);
    // console.log('AI generateContent returning parsed object:', result.parsed);

    return result;
  } catch (err) {
    console.error('Groq API error (generateContent):', err.message);
    throw err;
  }
}

/* =========================================================
   CHAT ASSISTANT MODE
========================================================= */
async function botReply(userRequest, context = []) {
  const cleanedRequest =
    typeof userRequest === 'string' ? userRequest.trim() : '';

  const normalizedContext = Array.isArray(context)
    ? context
        .filter((msg) => msg && typeof msg.text === 'string' && msg.text.trim())
        .map((msg) => ({
          role: msg.from === 'assistant' ? 'assistant' : 'user',
          content: msg.text.trim(),
        }))
        .slice(-12)
    : [];

  const creatorIntent = isCreatorIntent(cleanedRequest);

  const recentUserMessages = normalizedContext
    .filter((msg) => msg.role === 'user')
    .slice(-2)
    .map((msg) => msg.content)
    .join(' | ');

  const systemInstruction = `
You are Evolve Assistant, a production-grade AI copilot for YouTube creators.

Primary objective:
Provide practical, accurate, safe, and context-aware help for ideation,
scripting, titles, thumbnails, hooks, retention, posting strategy,
and audience growth.

Rules:
- Answer the latest user message first
- Use only the provided context
- Never fabricate facts
- Avoid harmful/illegal instructions
- Keep tone concise and direct
- Do NOT respond with general advice unrelated to YouTube/content creation; instead politely decline when off-topic.
- Do not ask more than one clarifying question; if input is ambiguous, make a reasonable assumption or give a brief answer.
`;

  const modeInstruction = creatorIntent
    ? `
Mode: creator_assistant.
Provide structured output:
Goal
Audience
Hook Options
Outline/Script Beats
CTA
Title Ideas
Thumbnail Angles
Tags/Keywords
Next Step
`
    : `
Mode: general_chat.
Only answer if question can be framed in a YouTube/content-creation context; otherwise decline politely.
Reply in 1-4 concise lines and avoid unnecessary back-and-forth.
`;

  const recencyInstruction = `
Latest user message: "${cleanedRequest}"
Recent context (for continuity only): "${recentUserMessages}"
`;

  const messages = [
    { role: 'system', content: systemInstruction },
    { role: 'system', content: modeInstruction },
    { role: 'system', content: recencyInstruction },
    ...normalizedContext,
    { role: 'user', content: cleanedRequest },
  ];

  try {
    const response = await groqClient.chat.completions.create({
      messages,
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      temperature: parseFloat(process.env.GROQ_TEMP || '0.7'),
      max_tokens: parseInt(process.env.GROQ_MAX_TOKENS || '2048', 10),
      top_p: parseFloat(process.env.GROQ_TOP_P || '0.9'),
    });

    return response.choices?.[0]?.message?.content || '';
  } catch (err) {
    console.error('Groq API error (botReply):', err.message);
    throw err;
  }
}

/* =========================================================
   EXPORTS
========================================================= */
module.exports = {
  generateContent,
  botReply,
  // expose the parser for unit tests and debugging
  parseAIResponse,
};