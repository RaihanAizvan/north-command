## NORTH-COMMAND

What this project solves

Running the North Pole is a big problem: Santa needs a clear view of what is happening, elves need a simple way to report progress, and everyone needs updates without waiting for refreshes.

North-Command is a lightweight operations console (*aka project management tool*) for:
- Assigning and tracking tasks
- Reporting progress (open, in progress, done)
- Real-time notifications
- Direct messaging between Santa and individual elves

How it works (high level)

- Santa creates tasks and optionally assigns them to an elf.
- Elves see their tasks, update status as they work, and mark tasks done.
- Santa sees progress updates as they happen.
- Santa can chat with Elfs and back and forth. 
- Notifications and messages arrive in real time.

Run locally

1) Start MongoDB
   - docker compose up -d (if mongo is in docker)

2) Install dependencies
   - npm install

3) Start the apps
   - npm run dev

URLs
- Client: http://localhost:5173
- Server health: http://localhost:4000/api/health

Demo access
- Santa (Overseer): username santa / password santa
- Elf registration is available from the login screen.

Notes
- If your database is empty, the server will bootstrap demo defaults on startup.
