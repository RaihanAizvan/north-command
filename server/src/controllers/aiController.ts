import { z } from 'zod';
import { env } from '../config/env.js';
import { Task } from '../models/Task.js';
import { HttpError } from '../utils/httpError.js';

const chatSchema = z.object({ message: z.string().min(1).max(2000) });

async function callGemini(prompt: string) {
  if (!env.GEMINI_API_KEY) throw new HttpError(500, 'AI not configured');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new HttpError(502, `AI request failed (${res.status}) ${t}`);
  }

  const data = (await res.json()) as any;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new HttpError(502, 'AI returned empty response');
  return String(text);
}

export async function chatWithAi(req: any, res: any) {
  const me = req.auth?.sub as string | undefined;
  if (!me) throw new HttpError(401, 'Unauthorized');

  const { message } = chatSchema.parse(req.body);

  const tasks = await Task.find({ assigneeUserId: me }).sort({ updatedAt: -1 }).limit(20).lean();
  const taskSummary = tasks
    .map((t) => `- [${t.status}] ${t.title}${t.description ? `: ${t.description}` : ''}`)
    .join('\n');

  const prompt = `You are NorthBot, an assistant for an elf working in the North Pole operations console.
Your job is to help the elf understand their tasks, suggest next steps, and explain what to do.
Be concise, practical, and calm. Do not invent tasks that are not listed.

Current assigned tasks:\n${taskSummary || '(no tasks assigned)'}

Elf message: ${message}

Reply:`;

  const reply = await callGemini(prompt);

  res.json({ reply });
}
