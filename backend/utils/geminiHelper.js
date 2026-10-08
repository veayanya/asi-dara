// b-rka/utils/geminiHelper.js
// Shared helper for calling the Gemini API.
//
// API key diambil dari environment variable:
// GEMINI_API_KEY
//
// Optional:
// GEMINI_POOL_KEYS = key1,key2,key3

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;

/**
 * Build the effective key pool.
 * GEMINI_API_KEY menjadi key utama.
 * GEMINI_POOL_KEYS dapat berisi beberapa key tambahan dari environment.
 */
function buildKeyPool() {
 const envKey = process.env.GEMINI_API_KEY?.trim();

 const poolEnvKeys = (process.env.GEMINI_POOL_KEYS || '')
 .split(',')
 .map(k => k.trim())
 .filter(Boolean);

 const allKeys = [
 ...(envKey ? [envKey] : []),
 ...poolEnvKeys
 ];

 // De-duplicate while preserving order
 return [...new Set(allKeys)].filter(Boolean);
}

/**
 * Detect if an error is a rate-limit / quota error.
 */
function isQuotaError(err) {
 const msg = err?.message || '';
 const status = err?.status;

 return (
 status === 429 ||
 msg.includes('429') ||
 msg.includes('RESOURCE_EXHAUSTED') ||
 msg.includes('quota') ||
 msg.includes('Quota') ||
 msg.includes('rate limit') ||
 msg.includes('rateLimitExceeded') ||
 msg.includes('Too Many Requests')
 );
}

/**
 * Detect if an error means the API key itself is invalid.
 */
function isInvalidKeyError(err) {
 const msg = err?.message || '';
 const status = err?.status;

 return (
 status === 403 ||
 msg.includes('403') ||
 msg.includes('API key not valid') ||
 msg.includes('API_KEY_INVALID') ||
 msg.includes('PERMISSION_DENIED')
 );
}

// Model candidates
const CANDIDATE_MODELS = [
 'gemini-3.5-flash',
 'gemini-3.5-flash-lite',
 'gemini-3.1-flash-lite',
 'gemini-flash-latest',
 'gemini-3.1-pro-preview',
 'gemini-pro-latest',
];

/**
 * Try generating content with a single API key
 * across all candidate models.
 */
// Dokumen panjang (banyak Kegiatan/Sub Kegiatan) butuh waktu lebih lama untuk dibaca & dijawab.
// Dasar 30 dtk, ditambah 1 dtk tiap 2.000 karakter prompt, maksimal 100 dtk per percobaan.
function timeoutForPrompt(prompt, options = {}) {
 if (options.timeoutMs) return options.timeoutMs;
 const len = String(prompt || '').length;
 return Math.min(100000, 30000 + Math.ceil(len / 2000) * 1000);
}

async function tryKeyWithModels(apiKey, prompt, options = {}) {
 const genAI = new GoogleGenerativeAI(apiKey);
 let lastErr = null;

 for (const modelName of CANDIDATE_MODELS) {
 for (const useJsonMime of [true, false]) {
 try {
 const model = genAI.getGenerativeModel({
 model: modelName,
 ...(useJsonMime
 ? {
 generationConfig: {
 responseMimeType: 'application/json',
 ...(options.maxOutputTokens ? { maxOutputTokens: options.maxOutputTokens } : {})
 }
 }
 : (options.maxOutputTokens ? { generationConfig: { maxOutputTokens: options.maxOutputTokens } } : {}))
 });

 const result = await Promise.race([
 model.generateContent(prompt),
 new Promise((_, rej) =>
 setTimeout(
 () => rej(new Error(`Timeout model ${modelName}`)),
 timeoutForPrompt(prompt, options)
 )
 )
 ]);

 console.log(
 `[Gemini] Berhasil dengan model ${modelName}`
 );

 return result;
 } catch (err) {
 lastErr = err;

 if (isQuotaError(err)) {
 throw err;
 }

 if (isInvalidKeyError(err)) {
 throw new Error(
 `API Key tidak valid: ${err.message}`
 );
 }

 if (!useJsonMime) {
 console.warn(
 `[Gemini] Model ${modelName} gagal: ${err.message}`
 );
 }

 break;
 }
 }
 }

 throw lastErr || new Error(
 'Semua model Gemini gagal untuk key ini.'
 );
}

/**
 * Generate content with Gemini fallback.
 *
 * @param {import('@google/generative-ai').GoogleGenerativeAI} _unused
 * @param {string} clientApiKey
 * @param {string} prompt
 */
export async function generateContentWithFallback(
 _unused,
 clientApiKey,
 prompt,
 options = {}
) {
 const pool = buildKeyPool();

 // Caller-supplied key tetap diprioritaskan jika ada.
 const effectivePool = clientApiKey
 ? [...new Set([clientApiKey, ...pool])].filter(Boolean)
 : pool;

 if (effectivePool.length === 0) {
 throw new Error(
 'GEMINI_API_KEY belum dikonfigurasi di environment.'
 );
 }

 let lastError = null;

 for (let i = 0; i < effectivePool.length; i++) {
 const key = effectivePool[i];

 try {
 return await tryKeyWithModels(key, prompt, options);
 } catch (err) {
 lastError = err;

 if (isQuotaError(err)) {
 console.warn(
 `[Gemini] Quota/rate-limit pada key ${i + 1}/${effectivePool.length}, ` +
 `beralih ke key berikutnya...`
 );

 continue;
 }

 console.error(
 `[Gemini] Error fatal pada key ${i + 1}: ${err.message}`
 );

 throw err;
 }
 }

 throw lastError ||
 new Error(
 'Semua API Key Gemini dalam pool telah dicoba dan gagal.'
 );
}

/**
 * Clean a raw Gemini text response and parse it as JSON.
 *
 * @param {string} rawText
 * @returns {any} parsed JSON
 */
export function parseAiJson(rawText) {
 if (!rawText || typeof rawText !== 'string') {
 throw new Error('Respons AI kosong.');
 }

 let cleaned = rawText.trim();

 // Remove markdown fences
 cleaned = cleaned
 .replace(/^```(?:json)?\s*/i, '')
 .replace(/```\s*$/, '')
 .trim();

 // Locate outermost JSON object
 const firstBrace = cleaned.indexOf('{');
 const lastBrace = cleaned.lastIndexOf('}');

 if (
 firstBrace !== -1 &&
 lastBrace !== -1 &&
 lastBrace > firstBrace
 ) {
 cleaned = cleaned.slice(firstBrace, lastBrace + 1);
 }

 // Remove trailing commas
 cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

 try {
 return JSON.parse(cleaned);
 } catch (err) {
 console.error(
 'parseAiJson: gagal parse JSON langsung.'
 );

 try {
 // Remove invalid control characters
 const sanitized = cleaned.replace(
 /[\u0000-\u001F\u007F-\u009F]/g,
 ''
 );

 return JSON.parse(sanitized);
 } catch (sanitizedErr) {
 const snippet =
 rawText.length > 200
 ? rawText.slice(0, 200) + '...'
 : rawText;

 throw new Error(
 `AI mengembalikan format yang tidak bisa dibaca sebagai JSON ` +
 `(${err.message}). Cuplikan respons: "${snippet}"`
 );
 }
 }
}

/**
 * Parse a JSON object of the form { "<key>": [ {...}, {...} ] } and, when the
 * response was cut off mid-way (output token limit / timeout), salvage every
 * COMPLETE object inside the array instead of throwing everything away.
 *
 * @param {string} rawText
 * @param {string} key  name of the array property, e.g. "rows"
 * @returns {any[]} array of complete objects (possibly empty)
 */
export function parseAiJsonArraySalvage(rawText, key) {
  try {
    const obj = parseAiJson(rawText);
    if (Array.isArray(obj)) return obj;
    if (obj && Array.isArray(obj[key])) return obj[key];
  } catch (_) { /* lanjut ke penyelamatan manual */ }

  if (!rawText || typeof rawText !== 'string') return [];
  const keyIdx = rawText.indexOf(`"${key}"`);
  const start = rawText.indexOf('[', keyIdx === -1 ? 0 : keyIdx);
  if (start === -1) return [];

  const out = [];
  let depth = 0, inStr = false, esc = false, objStart = -1;
  for (let i = start + 1; i < rawText.length; i++) {
    const c = rawText[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === '{') { if (depth === 0) objStart = i; depth++; }
    else if (c === '}') {
      depth--;
      if (depth === 0 && objStart !== -1) {
        try {
          out.push(JSON.parse(rawText.slice(objStart, i + 1).replace(/,\s*([}\]])/g, '$1')));
        } catch (_) { /* lewati objek rusak */ }
        objStart = -1;
      }
    } else if (c === ']' && depth === 0) break;
  }
  return out;
}
