const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'src', 'data');
const targetDir = path.join(__dirname, '..', 'build', 'data');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const copyFile = (from, to) => {
  fs.copyFileSync(from, to);
};

const copyDataDirectory = () => {
  if (!fs.existsSync(sourceDir)) {
    console.warn(`Source data directory not found: ${sourceDir}`);
    return;
  }

  ensureDir(targetDir);

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  entries.forEach((entry) => {
    if (entry.isFile() && entry.name.endsWith('.json')) {
      const from = path.join(sourceDir, entry.name);
      const to = path.join(targetDir, entry.name);
      copyFile(from, to);
    }
  });
};

copyDataDirectory();
