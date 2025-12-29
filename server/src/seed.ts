import bcrypt from 'bcryptjs';
import { connectDb } from './config/db.js';
import { User } from './models/User.js';
import { Task } from './models/Task.js';
import { Notification } from './models/Notification.js';

async function seed() {
  await connectDb();

  await Promise.all([User.deleteMany({}), Task.deleteMany({}), Notification.deleteMany({})]);

  const overseerHash = await bcrypt.hash('santa', 10);
  await User.create({ username: 'santa', passwordHash: overseerHash, role: 'OVERSEER' });

  const agentHash = await bcrypt.hash('elf', 10);
  const elves = await User.insertMany(
    Array.from({ length: 8 }).map((_, idx) => ({
      username: `elf${String(idx + 1).padStart(2, '0')}`,
      passwordHash: agentHash,
      role: 'FIELD_AGENT',
    }))
  );

  // Some sample tasks
  const santa = await User.findOne({ username: 'santa', role: 'OVERSEER' }).orFail();

  await Task.insertMany([
    {
      title: 'Inspect toy assembly line',
      description: 'Verify that all assembly steps are documented and followed.',
      status: 'OPEN',
      priority: 'HIGH',
      dueAt: null,
      assigneeUserId: elves[0]!._id,
      createdByUserId: santa._id,
      updatedByUserId: santa._id,
    },
    {
      title: 'Restock wrapping supplies',
      description: 'Ensure the wrapping station has enough paper, ribbon, and tags.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueAt: null,
      assigneeUserId: elves[1]!._id,
      createdByUserId: santa._id,
      updatedByUserId: santa._id,
    },
    {
      title: 'Clean up workshop floor',
      description: null,
      status: 'OPEN',
      priority: 'LOW',
      dueAt: null,
      assigneeUserId: null,
      createdByUserId: santa._id,
      updatedByUserId: santa._id,
    },
  ]);

  console.log('Seed complete. Credentials:\
- Overseer: santa / santa\
- Field Agents: elf01..elf08 / elf');

  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
