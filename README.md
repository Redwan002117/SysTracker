# SysTracker Portfolio App

A standalone, statically-exported Next.js app for the SysTracker download/marketing site. Independently hostable on Vercel, Netlify, GitHub Pages, or any static host — no dependency on the main SysTracker dashboard server.

## Pages

| Route | Description |
|---|---|
| `/` | Redirects to `/download` |
| `/download` | Main download page with GitHub releases, install instructions, feature grid |
| `/contact` | Contact form (mailto) + FAQ |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Use |
| `/data-retention` | Data Retention Policy |
| `/acceptable-use` | Acceptable Use Policy |

## Setup

### 1. Clone the Portfolio App
Since this app lives in a standalone branch of the SysTracker repo, clone it specifically:

```bash
git clone -b Portfolio --single-branch https://github.com/Redwan002117/SysTracker.git portfolio-app
cd portfolio-app
```

### 2. Install Dependencies (for local dev)

```bash
npm install
```

Copy the environment file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_DASHBOARD_URL` | URL of your deployed SysTracker dashboard | `http://localhost:7777` |
| `NEXT_PUBLIC_GITHUB_REPO` | GitHub repo slug | `Redwan002117/SysTracker` |

## Development

```bash
npm run dev        # Starts on http://localhost:3001
```

## Production Build (Static Export)

```bash
npm run build      # Outputs static files to ./out/
```

The `out/` directory can be deployed directly to any static host.

## Docker Deployment

The portfolio app can be run as a lightweight container using nginx.

### Using Docker Compose (Recommended)

```bash
docker-compose up -d
```

Access the app at `http://localhost:2222`.

### Manual Build & Run

```bash
# Build the image
docker build -t systracker-portfolio .

# Run container (map port 2222 to container port 80)
docker run -d -p 2222:80 --name portfolio systracker-portfolio
```

## Updating

To update the portfolio app to the latest version (pulls code and rebuilds container):

### Windows (PowerShell)
```powershell
.\update.ps1
```

### Linux / Mac
```bash
chmod +x update.sh
./update.sh
```

## Deployment

### Vercel
1. Import the `portfolio/` folder as a new Vercel project.
2. Set environment variables in the Vercel dashboard.
3. Deploy — Vercel auto-detects Next.js static export.

### Netlify
1. Set **Base directory** to `portfolio`.
2. Set **Build command** to `npm run build`.
3. Set **Publish directory** to `portfolio/out`.

### GitHub Pages
Use the included CI/CD workflow (`.github/workflows/portfolio.yml`) to auto-deploy on push to the `Portfolio` branch.
