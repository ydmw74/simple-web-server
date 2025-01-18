const express = require('express');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
const configFile = path.join(__dirname, 'config.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let apps = [];

function loadConfigs() {
  try {
    const configData = fs.readFileSync(configFile, 'utf8');
    apps = JSON.parse(configData);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Error reading config file:', err);
    }
  }
}

function saveConfigs() {
  const configData = JSON.stringify(apps, null, 2);
  fs.writeFileSync(configFile, configData);
}

function validateBuildPath(value) {
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
}

loadConfigs();

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/config', [
  body('name').isString().withMessage('Invalid app name'),
  body('ip').isIP().withMessage('Invalid IP address'),
  body('port').isInt({ min: 1, max: 65535 }).withMessage('Invalid port number'),
  body('uri').isString().withMessage('Invalid URI'),
  body('buildPath').custom(validateBuildPath).withMessage('Invalid build path'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const appConfig = {
    name: req.body.name,
    ip: req.body.ip,
    port: req.body.port,
    uri: req.body.uri,
    buildPath: req.body.buildPath
  };

  apps.push(appConfig);
  saveConfigs();
  res.json({ message: 'App added successfully' });
});

app.get('/config', (req, res) => {
  res.json(apps);
});

apps.forEach(appConfig => {
  app.use(appConfig.uri, express.static(path.join(__dirname, appConfig.buildPath)));
});

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
