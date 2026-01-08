# Sock Matching Game

## Overview

A playful sock-matching game built with React and Express. Players match falling socks by dragging them together before they stack too high. Features include real-time canvas-based gameplay, sound effects, particle animations, and a persistent leaderboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with custom playful theme (Chewy, Nunito, Fredoka fonts)
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Animations**: Framer Motion for UI transitions, canvas-confetti for particle effects
- **Audio**: Howler.js for game sound effects, use-sound hook for background music
- **Game Rendering**: HTML5 Canvas with requestAnimationFrame loop

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: REST endpoints defined in shared/routes.ts with Zod validation
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Build System**: Vite for frontend, esbuild for server bundling

### Data Storage
- **Database**: PostgreSQL (connection via DATABASE_URL environment variable)
- **Schema**: Single `scores` table with id, username, score, and createdAt fields
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization

### Project Structure
```
client/          # React frontend application
  src/
    components/  # UI components including game canvas
    hooks/       # Custom React hooks
    pages/       # Route components
    lib/         # Utilities and query client
server/          # Express backend
  routes.ts      # API route handlers
  storage.ts     # Database access layer
  db.ts          # Drizzle database connection
shared/          # Shared code between client and server
  schema.ts      # Drizzle database schema
  routes.ts      # API route definitions with Zod schemas
```

### API Structure
- `GET /api/scores` - Retrieve top 10 scores ordered by score descending
- `POST /api/scores` - Submit a new score with username and score fields

### Development vs Production
- Development: Vite dev server with HMR, integrated with Express
- Production: Static files served from `dist/public`, server bundled to `dist/index.cjs`

## External Dependencies

### Database
- PostgreSQL database required via `DATABASE_URL` environment variable
- Uses `pg` driver with `connect-pg-simple` for connection pooling

### External Audio Assets
- Sound effects loaded from Mixkit CDN (mixkit.co)
- Background music streamed from external URL

### Third-Party UI Libraries
- Radix UI primitives for accessible components
- embla-carousel for carousel functionality
- react-day-picker for calendar components
- vaul for drawer components
- cmdk for command palette
- recharts for charts

