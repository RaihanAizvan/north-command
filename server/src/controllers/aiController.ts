import { z } from 'zod';
import { env } from '../config/env.js';
import { Task } from '../models/Task.js';
import { HttpError } from '../utils/httpError.js';
import { listGeminiModels, normalizeModelName } from '../services/geminiModels.js';

const chatSchema = z.object({ message: z.string().min(1).max(2000) });

async function callGemini(prompt: string) {
  if (!env.GEMINI_API_KEY) throw new HttpError(500, 'AI not configured');

  // Gemini model naming changes over time. The v1 API frequently *does not* support "*-latest" aliases.
  // Normalize and retry only stable IDs.
  const requestedModel = normalizeModelName((env.GEMINI_MODEL || 'gemini-1.5-flash').trim());

  // Keep fallbacks conservative; many keys (especially free-tier) won't have access to newer models.
  // We'll only attempt additional fallbacks if they actually exist in ListModels.
  let modelCandidates = [requestedModel, 'gemini-1.0-pro'].filter(Boolean);

  try {
    const models = await listGeminiModels();
    const allowed = new Set(
      models
        .filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
        .map((m) => normalizeModelName(m.name))
    );

    modelCandidates = modelCandidates.filter((m) => allowed.has(m));
    if (modelCandidates.length === 0) {
      // If the requested model isn't allowed, pick the first available generateContent model.
      const first = Array.from(allowed)[0];
      if (first) modelCandidates = [first];
    }
  } catch {
    // If ListModels fails, fall back to the basic candidate list and let generateContent errors surface.
  }

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
  };

  let lastErrText = '';

  for (const model of modelCandidates) {
    const apiVersion = (env.GEMINI_API_VERSION || 'v1beta').trim();
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${encodeURIComponent(model)}:generateContent?key=${env.GEMINI_API_KEY}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      lastErrText = `AI request failed (${res.status}) ${t}`;

      // If the model isn't found/allowed, try the next candidate.
      if (res.status === 404 || res.status === 400) continue;

      throw new HttpError(502, lastErrText);
    }

    const data = (await res.json()) as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new HttpError(502, 'AI returned empty response');
    return String(text);
  }

  let modelsHint = '';
  try {
    const models = await listGeminiModels();
    const allowed = models
      .filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
      .slice(0, 12)
      .map((m) => normalizeModelName(m.name))
      .join(', ');
    if (allowed) modelsHint = `\nAvailable generateContent models (sample): ${allowed}`;
  } catch {
    // ignore
  }

  throw new HttpError(
    502,
    `${lastErrText || 'AI request failed'}${modelsHint}\nTip: set GEMINI_MODEL in server/.env to one of the models returned by /api/ai/models.`
  );
}

export async function getAiConfig(_req: any, res: any) {
  res.json({
    configured: Boolean(env.GEMINI_API_KEY),
    model: normalizeModelName(env.GEMINI_MODEL ?? 'gemini-1.5-flash'),
    apiVersion: env.GEMINI_API_VERSION ?? 'v1beta',
  });
}

export async function listAiModels(_req: any, res: any) {
  if (!env.GEMINI_API_KEY) throw new HttpError(500, 'AI not configured');
  const models = await listGeminiModels();
  const generate = models.filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'));
  res.json({
    apiVersion: env.GEMINI_API_VERSION ?? 'v1beta',
    generateContentModels: generate.map((m) => ({ name: normalizeModelName(m.name), rawName: m.name })),
    allModels: models.map((m) => ({ name: normalizeModelName(m.name), rawName: m.name, methods: m.supportedGenerationMethods })),
  });
}

export async function chatWithAi(req: any, res: any) {
  const me = req.auth?.sub as string | undefined;
  if (!me) throw new HttpError(401, 'Unauthorized');

  const { message } = chatSchema.parse(req.body);

  const tasks = await Task.find({ assigneeUserId: me }).sort({ updatedAt: -1 }).limit(25).lean();

  const taskSummary = tasks
    .map((t) => {
      const due = t.dueAt ? ` due:${new Date(t.dueAt).toISOString()}` : '';
      return `- [${t.priority}/${t.status}] ${t.title}${t.description ? ` — ${t.description}` : ''}${due}`;
    })
    .join('\n');

  const prompt = `You are NorthBot, a helpful assistant for a field agent working in NORTH-COMMAND.

Goal: help the user understand their CURRENT assigned tasks and what to do next.

Rules:
- Be calm, clear, and practical.
- Do not invent tasks. Only reference tasks listed below.
- If there are no tasks, say so and ask what they want to do.

Current assigned tasks:
${taskSummary || '(none)'}

User message:
${message}

Reply in a normal tone. Prefer short paragraphs and bullet points.`;

  const reply = await callGemini(prompt);

  res.json({ reply });
}
