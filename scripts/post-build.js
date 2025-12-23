#!/usr/bin/env node
/**
 * Post-build script to create "latest" version of the build
 * Copies the versioned file to cookieAutoPlayBeta-latest.js for stable URLs
 */

const fs = require('fs');
const path = require('path');

// Read version from package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const version = packageJson.version;

const distDir = path.resolve(__dirname, '../dist');
const versionedFile = path.join(distDir, `cookieAutoPlayBeta-v${version}.js`);
const latestFile = path.join(distDir, 'cookieAutoPlayBeta-latest.js');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy versioned file to latest
if (fs.existsSync(versionedFile)) {
  fs.copyFileSync(versionedFile, latestFile);
  console.log(`✓ Created ${path.basename(latestFile)} from v${version}`);
} else {
  console.error(`✗ Error: ${versionedFile} not found`);
  process.exit(1);
}
