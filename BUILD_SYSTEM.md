# Build System Documentation

## Overview
The build system now generates versioned files and maintains a "latest" version for stable URLs.

## Output Files

### Versioned Build
- **File**: `dist/cookieAutoPlayBeta-v{version}.js`
- **Example**: `dist/cookieAutoPlayBeta-v2.052.3.js`
- **Purpose**: Historical versions for tracking changes

### Latest Build
- **File**: `dist/cookieAutoPlayBeta-latest.js`
- **Purpose**: Stable URL that always points to the most recent version
- **Used by**: Userscript for automatic updates

### Userscript
- **File**: `dist/CookieBot.user.js`
- **Purpose**: Tampermonkey/Greasemonkey userscript loader
- **URL**: `https://lbr88.github.io/CookieBot/dist/CookieBot.user.js`

## Build Commands

```bash
# Build TypeScript to JavaScript with versioning
npm run build

# Build TypeScript + Generate userscript
npm run build:userscript

# Development mode with watch
npm run dev

# Type checking only
npm run type-check
```

## GitHub Pages Setup

The `dist/` folder is now tracked by git and served by GitHub Pages at:
- **Base URL**: `https://lbr88.github.io/CookieBot/dist/`
- **Latest JS**: `https://lbr88.github.io/CookieBot/dist/cookieAutoPlayBeta-latest.js`
- **Userscript**: `https://lbr88.github.io/CookieBot/dist/CookieBot.user.js`

## Version Management

Version is controlled by `package.json`:
```json
{
  "version": "2.052.3"
}
```

To release a new version:
1. Update version in `package.json`
2. Run `npm run build:userscript`
3. Commit and push to GitHub
4. GitHub Pages will automatically serve the new files

## How It Works

1. **Webpack** reads version from `package.json`
2. **Webpack** outputs `cookieAutoPlayBeta-v{version}.js`
3. **post-build.js** copies versioned file to `cookieAutoPlayBeta-latest.js`
4. **build-userscript.js** generates userscript that loads the latest version
5. Users install the userscript, which always loads the latest build

## Benefits

- **Stable URLs**: Users' userscripts never break
- **Version History**: Keep all previous versions
- **Easy Updates**: Users get updates automatically
- **GitHub Pages**: Free hosting for all files
