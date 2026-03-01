// description: legacy bootstrap replaced by modular setup
const app = require('./src/app');
const config = require('./src/config');

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
