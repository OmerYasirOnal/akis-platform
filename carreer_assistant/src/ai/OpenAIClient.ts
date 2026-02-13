import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (client) return client;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set in environment. Add it to .env');
  }

  client = new OpenAI({ apiKey });
  return client;
}

export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  },
): Promise<string> {
  const ai = getOpenAI();
  const model = options?.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o';

  const response = await ai.chat.completions.create({
    model,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 1500,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  return content.trim();
}

export async function chatCompletionWithHistory(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  },
): Promise<string> {
  const ai = getOpenAI();
  const model = options?.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o';

  const response = await ai.chat.completions.create({
    model,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 1500,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  return content.trim();
}
