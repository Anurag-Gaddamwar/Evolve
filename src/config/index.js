require('dotenv').config();

const config = {
  port: process.env.PORT || 3001,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  groqApiKey: process.env.GROQ_API_KEY,
  tokenSecret: process.env.TOKEN_SECRET,
  mongoUrl: process.env.MONGODB_URI || process.env.MONGO_URL,
  youtubeKey: process.env.YOUTUBE_API_KEY,
};

// validate required
['groqApiKey', 'tokenSecret', 'mongoUrl', 'youtubeKey'].forEach((key) => {
  if (!config[key]) {
    console.warn(`WARNING: missing config ${key}`);
  }
});

module.exports = config;