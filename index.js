const express = require('express');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0'; // Bind to all available network interfaces
const configFile = path.join(__dirname, 'config.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let apps = [];

// Load app configurations from the config file
try {
  const configData = fs.readFileSync(configFile, 'utf8');
  apps = JSON.parse(configData);
} catch (err) {
  if (err.code !== 'ENOENT') {
    console.error('Error reading config file:', err);
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/config', [
  body('ip').isIP().withMessage('Invalid IP address'),
  body('port').isInt({ min: 1, max: 65535 }).withMessage('Invalid port number'),
  body('uri').isString().withMessage('Invalid URI'),
  body('buildPath').custom((value) => {
    if (!fs.existsSync(value)) {
      throw new Error('Build path does not exist');
    }
    const stats = fs.statSync(value);
    if (!stats.isDirectory()) {
      throw new Error('Build path is not a directory');
    }
    const files = fs.readdirSync(value);
    if (files.length === 0) {
      throw new Error('Build path is empty');
    }
    return true;
  }).withMessage('Invalid build path'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const app = {
    ip: req.body.ip,
    port: req.body.port,
    uri: req.body.uri,
    buildPath: req.body.buildPath
  };

  apps.push(app);
  saveConfigs();
  res.json({ message: 'App added successfully' });
});

apps.forEach(app => {
  app.use(app.uri, express.static(path.join(__dirname, app.buildPath)));
});

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});

function saveConfigs() {
  const configData = JSON.stringify(apps, null, 2);
  fs.writeFileSync(configFile, configData);
}
