export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CallA0LLMOptions {
  stream?: boolean;
  onToken?: (token: string) => void;
  temperature?: number;
  schema?: any; // JSON Schema for structured output
}

export interface LLMResponse {
  completion: string;
  schema_data?: any;
  is_structured?: boolean;
}

async function nonStreamingCall(messages: Message[], options: CallA0LLMOptions = {}): Promise<LLMResponse> {
  const bodyPayload = {
    messages,
    temperature: options.temperature ?? 0.7,
    ...(options.schema && { schema: options.schema }),
  };
  const res = await fetch('https://api.a0.dev/ai/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyPayload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM non-streaming call failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return {
    completion: json.completion ?? json.message ?? '',
    schema_data: json.schema_data,
    is_structured: json.is_structured,
  };
}

export async function callA0LLM(messages: Message[], options: CallA0LLMOptions = {}): Promise<LLMResponse> {
  if (!options.stream) {
    return nonStreamingCall(messages, options);
  }

  try {
    const bodyPayload = {
      messages,
      temperature: options.temperature ?? 0.7,
      ...(options.schema && { schema: options.schema }),
    };
    const res = await fetch('https://api.a0.dev/ai/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
    });

    if (!res.ok || !res.body) {
      // fallback to non-streaming
      return nonStreamingCall(messages, options);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let accumulated = '';

    while (!done) {
      const { value, done: chunkDone } = await reader.read();
      done = chunkDone;
      if (value) {
        const chunkText = decoder.decode(value, { stream: true });
        accumulated += chunkText;
        if (options.onToken) {
          options.onToken(chunkText);
        }
      }
    }

    return { completion: accumulated, schema_data: undefined, is_structured: false };
  } catch (err) {
    // fallback to non-streaming
    return nonStreamingCall(messages, options);
  }
}