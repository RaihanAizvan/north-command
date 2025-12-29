import bcrypt from 'bcryptjs';
import { User } from './models/User.js';

/**
 * Idempotent bootstrap for local/demo environments.
 *
 * Creates:
 * - Default stations (if missing)
 * - Default overseer user: santa / santa (if missing)
 * - Default field agents: elf01..elfNN / elf (if missing)
 * - Global payload row (if missing)
 */
export async function ensureDemoDefaults() {
  // Overseer
  const overseer = await User.findOne({ role: 'OVERSEER' });
  if (!overseer) {
    const hash = await bcrypt.hash('santa', 10);
    await User.create({ username: 'santa', passwordHash: hash, role: 'OVERSEER' });
  }

  // Field agents
  const agentCount = await User.countDocuments({ role: 'FIELD_AGENT' });
  if (agentCount === 0) {
    const hash = await bcrypt.hash('elf', 10);
    await User.insertMany(
      Array.from({ length: 8 }).map((_, idx) => ({
        username: `elf${String(idx + 1).padStart(2, '0')}`,
        passwordHash: hash,
        role: 'FIELD_AGENT',
      }))
    );
  }
}
