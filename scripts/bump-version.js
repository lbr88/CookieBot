const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');
const autoPlayPath = path.join(__dirname, '../src/AutoPlay.ts');

// 1. Read and bump package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

// Parse version: 2.052-41 -> 2.052-42
// Or 2.052.41 -> 2.052.42
// Finds the last number in the string and increments it
const versionParts = currentVersion.match(/^(.*?)(\d+)$/);

if (!versionParts) {
  console.error(`Could not parse version: ${currentVersion}`);
  process.exit(1);
}

const prefix = versionParts[1];
const number = parseInt(versionParts[2], 10);
const newVersion = `${prefix}${number + 1}`;

console.log(`Bumping version: ${currentVersion} -> ${newVersion}`);

packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

// 2. Update src/AutoPlay.ts
if (fs.existsSync(autoPlayPath)) {
  let autoPlayContent = fs.readFileSync(autoPlayPath, 'utf8');
  // Look for: static readonly version = '...';
  const autoPlayRegex = /(static readonly version = ')(.*?)(';)/;
  if (autoPlayRegex.test(autoPlayContent)) {
    autoPlayContent = autoPlayContent.replace(autoPlayRegex, `$1${newVersion}$3`);
    fs.writeFileSync(autoPlayPath, autoPlayContent);
    console.log(`Updated src/AutoPlay.ts`);
  } else {
    console.warn(`Could not find version string in src/AutoPlay.ts`);
  }
}

