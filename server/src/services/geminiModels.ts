import { env } from '../config/env.js';

export type GeminiModel = {
  name: string; // e.g. models/gemini-1.5-flash
  supportedGenerationMethods?: string[];
  description?: string;
};

export async function listGeminiModels(): Promise<GeminiModel[]> {
  if (!env.GEMINI_API_KEY) return [];

  const apiVersion = (env.GEMINI_API_VERSION || 'v1beta').trim();
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${env.GEMINI_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`ListModels failed (${res.status}) ${t}`);
  }

  const data = (await res.json()) as any;
  const models = (data?.models ?? []) as any[];
  return models.map((m) => ({
    name: String(m.name),
    supportedGenerationMethods: Array.isArray(m.supportedGenerationMethods) ? m.supportedGenerationMethods.map(String) : undefined,
    description: m.description ? String(m.description) : undefined,
  }));
}

export function normalizeModelName(model: string) {
  return model.replace(/^models\//, '').replace(/-latest$/i, '').trim();
}
