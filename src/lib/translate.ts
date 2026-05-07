// src/lib/translate.ts
// Run with: npx ts-node --project tsconfig.json src/lib/translate.ts
// Or:       ANTHROPIC_API_KEY=your_key npx ts-node src/lib/translate.ts

import fs from 'fs';
import path from 'path';

const EN_PATH = path.join(process.cwd(), 'messages/en.json');
const AR_PATH = path.join(process.cwd(), 'messages/ar.json');

const SYSTEM_PROMPT = `You are a professional translator for a Cairo-based carpooling app called "commuter".

Rules:
- Translate English UI strings to Arabic
- Use casual MSA with an Egyptian dialect feel — like major Egyptian apps (Careem, Talabat, Swvl)
- NOT formal فصحى, NOT full عامية — the natural in-between
- Keep "commuter" brand name in English always
- Keep proper nouns in English: "Cairo", "Nasr City", "Smart Village", "EGP", "Fawry", "Vodafone Cash"
- Keep format placeholders exactly as-is: {max}, {meters}, {percent}, {day}
- Keep numbers as Western numerals: 1 2 3 (not ١ ٢ ٣)
- Keep punctuation minimal — Arabic UI strings don't end with periods
- Short strings stay short — don't pad with extra words
- Respond ONLY with the translated string value, no explanation, no quotes`;

async function translateValue(value: string): Promise<string> {
  // Skip strings that are already non-translatable
  if (
    value.length === 0 ||
    /^\d+$/.test(value) ||        // pure numbers
    /^[A-Z]{2,}$/.test(value) ||  // acronyms like EGP
    value === 'commuter' ||
    /^[+\-]\d+%$/.test(value)    // percent modifiers like +5%
  ) {
    return value;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Translate this UI string to Arabic:\n"${value}"`,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error(`API error: ${response.status} ${response.statusText}`);
    return value;
  }

  const data = await response.json() as {
    content?: Array<{ text: string }>;
    error?: { message: string };
  };

  if (data.error) {
    console.error(`Anthropic error: ${data.error.message}`);
    return value;
  }

  const translated = data.content?.[0]?.text?.trim() ?? value;

  // Strip surrounding quotes if model adds them
  return translated.replace(/^["']|["']$/g, '');
}

async function translateObject(
  en: Record<string, unknown>,
  existing: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(en)) {
    if (typeof value === 'string') {
      // Reuse existing translation if present
      if (existing[key] && typeof existing[key] === 'string') {
        result[key] = existing[key];
        process.stdout.write(`  [cached] ${key}\r`);
      } else {
        process.stdout.write(`  Translating: ${key}...\r`);
        result[key] = await translateValue(value);
        // Rate limit: 1 req / 200ms to stay within Haiku limits
        await new Promise((r) => setTimeout(r, 200));
      }
    } else if (typeof value === 'object' && value !== null) {
      console.log(`\nSection: ${key}`);
      result[key] = await translateObject(
        value as Record<string, unknown>,
        (existing[key] as Record<string, unknown>) ?? {}
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required.');
    console.error('Usage: ANTHROPIC_API_KEY=your_key npx ts-node src/lib/translate.ts');
    process.exit(1);
  }

  console.log('Loading en.json...');
  const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf-8')) as Record<string, unknown>;

  // Load existing ar.json if it exists (for incremental updates)
  const existingAr: Record<string, unknown> = fs.existsSync(AR_PATH)
    ? (JSON.parse(fs.readFileSync(AR_PATH, 'utf-8')) as Record<string, unknown>)
    : {};

  console.log('Translating with Claude Haiku...\n');
  const ar = await translateObject(en, existingAr);

  fs.writeFileSync(AR_PATH, JSON.stringify(ar, null, 2), 'utf-8');
  console.log('\n\nDone! ar.json written.');
}

main().catch(console.error);
