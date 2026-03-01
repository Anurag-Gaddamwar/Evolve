const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const config = require('./config');

const aiRouter = require('./routes/ai');
const botRouter = require('./routes/bot');
const videosRouter = require('./routes/videos');

const app = express();

// security headers
app.use(helmet());

// logging
app.use(morgan('combined'));

// basic rate limiting
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // limit each IP to 60 requests per windowMs
  })
);

// middleware
app.use(express.json({ limit: '10mb' }));
app.use(
  cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// mount routes
app.use('/api', aiRouter);
app.use('/api', botRouter);
app.use('/api', videosRouter);

// health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;