// description: legacy bootstrap replaced by modular setup
const app = require('./src/app');
const config = require('./src/config');

const port = config.port || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('Port ' + port + ' is already in use, trying ' + (port + 1));
    app.listen(port + 1, () => {
      console.log(`Server running on port ${port + 1}`);
    });
  } else {
    console.error('Server error:', err);
  }
});
