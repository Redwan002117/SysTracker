# SysTracker Dashboard

The frontend visualization layer for SysTracker, built with **Next.js** and **Tailwind CSS**.

## Features

- **Live Monitoring Grid:** View all connected machines with live status indicators.
- **Detailed Machine View:** Deep dive into hardware specs (Motherboard, Serial, GPU) and performance history.
- **Floating Profile Card:** Manage machine profiles and nicknames directly from the UI.
- **Glassmorphism Design:** A modern, polished aesthetic with blurred backdrops and smooth animations.

## Setup

### Prerequisites
- Node.js 18+
- NPM or Yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in Development Mode:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

3. Build for Production (Static Export):
   ```bash
   npm run build
   ```
   This generates an `out` folder which can be served by the backend or any static host.

## Project Structure

- `app/`: Next.js App Router pages and layouts.
- `components/`: Reusable UI components (MachineCard, MachineDetails, ProfileCard).
- `types/`: TypeScript definitions for system telemetry data.
- `public/`: Static assets (images, icons).

## Key Components

- **MachineCard:** Displays summary metrics (CPU/RAM/Disk) and status.
- **MachineDetails:** A comprehensive drawer view for deep system inspection.
- **ProfileCard:** A widget for managing user assignments and machine nicknames.
