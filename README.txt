NORTH-COMMAND (Industrial Orchestration Platform)

Stack:
- Backend: Express + TypeScript + MongoDB (Mongoose), MVC architecture
- Realtime: Socket.IO (no-refresh distress + telemetry)
- Frontend: React + TypeScript + Vite

---
Quickstart (local)

1) Start MongoDB
   Option A: local mongod
     - Ensure MongoDB is running on mongodb://127.0.0.1:27017
   Option B: Docker
     - docker compose up -d

2) Configure server env
   - Copy: server/.env.example -> server/.env
   - Set JWT_SECRET to a strong value

3) Install dependencies
   - npm install

4) Seed demo data
   - npm run seed

5) Run both apps
   - npm run dev

URLs
- Server: http://localhost:4000/api/health
- Client: http://localhost:5173

Demo credentials
- Overseer (Santa): username santa / password santa
- Field Agents (Elves): username elf01..elf08 / password elf
  - Station Code: A-01, A-02, B-07, C-03, D-11, E-05, F-09, G-04

Core behaviors
- Elf Dashboard:
  - Single active work-order view with Cycle Status button:
    IN PRODUCTION → QC-RELEVANT → PACKED
  - High-visibility STATION DOWN toggle pushes immediate distress to Overseer (no refresh)
  - Broadcast channel receives global scroll messages

- Santa Dashboard:
  - War Room grid: Neon Green active, Dim Grey idle, Flashing Safety Orange distress
  - Sleigh Payload Meter increments as work-orders are marked PACKED
  - Global Broadcast terminal pushes alerts to all stations in realtime
