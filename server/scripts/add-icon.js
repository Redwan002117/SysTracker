#!/usr/bin/env node

/**
 * Script to embed icon into Windows EXE files
 * Uses rcedit to update the icon resource
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const iconPath = path.join(__dirname, '..', 'app.ico');
const exeFile = path.join(__dirname, '..', 'systracker-server-win.exe');
const exeFileDist = path.join(__dirname, '..', 'dist', 'systracker-server-win.exe');

async function addIcon() {
  try {
    // Check if icon exists
    if (!fs.existsSync(iconPath)) {
      console.error('❌ Icon file not found:', iconPath);
      process.exit(1);
    }

    // Try to add icon to main exe
    if (fs.existsSync(exeFile)) {
      console.log('📦 Embedding icon into systracker-server-win.exe...');
      try {
        execSync(`rcedit --set-icon "${iconPath}" "${exeFile}"`, { stdio: 'inherit' });
        console.log('✅ Icon embedded successfully into main EXE');
      } catch (e) {
        console.warn('⚠️  Icon embedding skipped (rcedit not available on this platform)');
      }
    }

    // Try to add icon to dist exe if it exists
    if (fs.existsSync(exeFileDist)) {
      console.log('📦 Embedding icon into dist/systracker-server-win.exe...');
      try {
        execSync(`rcedit --set-icon "${iconPath}" "${exeFileDist}"`, { stdio: 'inherit' });
        console.log('✅ Icon embedded successfully into dist EXE');
      } catch (e) {
        console.warn('⚠️  Icon embedding skipped (rcedit not available on this platform)');
      }
    }

    console.log('✅ Icon update process completed');
  } catch (error) {
    console.warn('⚠️  Warning: Could not embed icon (this is common on non-Windows platforms)');
    console.warn('   The EXE will work fine without it, but will use default Windows icon');
  }
}

addIcon().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
