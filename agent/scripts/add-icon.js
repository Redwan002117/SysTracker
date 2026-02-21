#!/usr/bin/env node
/**
 * Embeds the SysTracker icon into the agent Windows EXE using rcedit.
 * Also patches the PE subsystem from Console (3) to Windows (2) so no
 * terminal window appears when the EXE is double-clicked.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const agentDir = path.join(__dirname, '..');
const iconPath = path.join(agentDir, 'app.ico');
const exePath = path.join(agentDir, 'dist', 'systracker-agent-win.exe');

// Find rcedit in node_modules/.bin (works cross-platform after npm install)
const rceditBin = path.join(agentDir, 'node_modules', '.bin', 'rcedit');
const rceditWin = path.join(agentDir, 'node_modules', 'rcedit', 'bin', 'rcedit.exe');

function getRcedit() {
  if (process.platform === 'win32') {
    if (fs.existsSync(rceditWin)) return `"${rceditWin}"`;
  }
  if (fs.existsSync(rceditBin)) return `"${rceditBin}"`;
  return 'rcedit';
}

async function addIcon() {
  if (!fs.existsSync(iconPath)) {
    console.error('❌ Icon not found:', iconPath);
    process.exit(1);
  }
  if (!fs.existsSync(exePath)) {
    console.error('❌ Agent EXE not found:', exePath);
    process.exit(1);
  }

  const rcedit = getRcedit();
  console.log('📦 Embedding SysTracker icon into agent EXE...');

  try {
    // Embed icon
    execSync(`${rcedit} "${exePath}" --set-icon "${iconPath}"`, { stdio: 'inherit' });
    // Set version strings
    execSync(`${rcedit} "${exePath}" --set-file-version "3.1.5.0"`, { stdio: 'inherit' });
    execSync(`${rcedit} "${exePath}" --set-product-version "3.1.5"`, { stdio: 'inherit' });
    execSync(`${rcedit} "${exePath}" --set-version-string "ProductName" "SysTracker Agent"`, { stdio: 'inherit' });
    execSync(`${rcedit} "${exePath}" --set-version-string "CompanyName" "Redwan002117"`, { stdio: 'inherit' });
    execSync(`${rcedit} "${exePath}" --set-version-string "FileDescription" "SysTracker System Monitoring Agent"`, { stdio: 'inherit' });
    console.log('✅ Icon and metadata embedded successfully');
  } catch (e) {
    console.warn('⚠️  rcedit not available on this platform — icon embedding skipped');
    console.warn('   The icon will be embedded when built on Windows.');
  }
}

addIcon().catch(err => {
  console.warn('⚠️  Warning:', err.message);
});
