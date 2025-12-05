# 🚀 How to Run the Tourism System

## Quick Start

### Option 1: Use the Start Script (Easiest)
```bash
./start.sh
```

This will start both servers and keep them running until you press `Ctrl+C`.

### Option 2: Run from Root (One Command)
```bash
bun run dev
```

### Option 3: Run Separately (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd apps/api
bun run dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
bun run dev
```

---

## Server URLs

Once running, access:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

---

## What Each Server Does

### Backend API (`apps/api`)
- **Port:** 3000
- **Technology:** Bun + Hono
- **Features:**
  - REST API endpoints
  - Database connections (PostgreSQL, MongoDB, Redis)
  - Authentication (JWT)
  - File uploads
  - Data export/import

### Frontend Web (`apps/web`)
- **Port:** 5173
- **Technology:** Vite + React + TypeScript
- **Features:**
  - User interface
  - Authentication forms
  - Tourist spots display
  - Ratings, comments, photos
  - Search and filters

---

## Stopping the Servers

### If using the start script:
Press `Ctrl+C` in the terminal

### If running separately:
Press `Ctrl+C` in each terminal window

### If running in background:
```bash
# Find and kill processes
pkill -f "bun.*index.ts"  # Kill API server
pkill -f "vite"           # Kill frontend server
```

---

## Troubleshooting

### Port Already in Use

If you see "port in use" errors:

```bash
# Kill processes on ports
lsof -ti:3000 | xargs kill -9  # Kill API server
lsof -ti:5173 | xargs kill -9  # Kill frontend server
```

### Server Not Starting

1. **Check dependencies:**
   ```bash
   bun install
   ```

2. **Check environment variables:**
   ```bash
   # Make sure apps/api/.env exists
   ls apps/api/.env
   ```

3. **Check database connections:**
   - Verify PostgreSQL is accessible
   - Check MongoDB connection
   - Verify Redis connection

### Frontend Can't Connect to Backend

1. **Verify backend is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check proxy configuration:**
   - Vite proxy is configured in `apps/web/vite.config.ts`
   - Should forward `/api/*` to `http://localhost:3000/*`

---

## Development Workflow

1. **Start both servers:**
   ```bash
   ./start.sh
   # OR
   bun run dev
   ```

2. **Make changes:**
   - Backend: Edit files in `apps/api/src/`
   - Frontend: Edit files in `apps/web/src/`

3. **Hot Reload:**
   - Both servers support hot reload
   - Changes are automatically reflected

4. **View logs:**
   - Check terminal output for errors
   - Backend logs show API requests
   - Frontend logs show in browser console

---

## Production Build

To build for production:

```bash
# Build both
bun run build

# Or individually
cd apps/api && bun run build
cd apps/web && bun run build
```

---

## Available Scripts

### Root Level
- `bun run dev` - Start both servers
- `bun run dev:api` - Start API only
- `bun run dev:web` - Start frontend only
- `bun run build` - Build both for production

### API (`apps/api`)
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run seed` - Seed database with sample data
- `bun run migrate` - Run database migrations

### Web (`apps/web`)
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview production build

---

## Quick Reference

```bash
# Install dependencies
bun install

# Start everything
./start.sh

# Or manually
bun run dev

# Access the app
open http://localhost:5173
```

---

**Happy coding!** 🎉

