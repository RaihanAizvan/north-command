## NORTH-COMMAND

NORTH-COMMAND is a realtime Santa’s Workshop operations console: Santa gets a commander overview, and elves get a focused task interface. Everything updates live (no refresh).

### Key features

- **3D Landing Page (`/`)**
  - Three.js Santa scene as a full-viewport background
  - Dynamic-island style navigation + portal “ENTER” transition into the console
  - Responsive typography (custom fonts) + smooth scroll

- **Authentication / Roles**
  - Overseer (Santa) + Field Agent (Elf)
  - Logout returns to **`/`** (landing) reliably

- **Task Management**
  - Santa can create and assign tasks
  - Elves can update progress and mark tasks complete

- **Realtime System (Socket.IO)**
  - Live notifications
  - Direct messaging between Santa and elves
  - Broadcast-style updates and UI telemetry

- **NorthBot (AI helper)**
  - Chat assistant with Markdown-rendered replies (when configured)

### How it works (high level)

- Santa creates tasks and assigns them to an elf.
- Elves see their tasks, update status as they work, and mark tasks done.
- Santa sees progress updates in realtime.
- Santa and elves can message each other directly; notifications arrive instantly.

### Tech stack

- Frontend: **React + TypeScript + Vite**
- Backend: **Node/Express + TypeScript**
- Database: **MongoDB (Mongoose)**
- Realtime: **Socket.IO**
- 3D: **Three.js**

### Run locally

1) Start MongoDB

```bash
docker compose up -d
```

2) Install dependencies

```bash
npm install
```

3) Start the apps

```bash
npm run dev
```

### URLs

- Client: http://localhost:5173
- Server health: http://localhost:4000/api/health

### Demo access

- Overseer (Santa): `santa / santa`
- Elf registration is available from the login screen.
- Login screen includes a small “Sample test data” helper for quick testing.

### Notes

- If your database is empty, the server bootstraps demo defaults on startup.
