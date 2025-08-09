import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withTimeout } from '@/lib/withTimeout';

// Model configuration - easy to change
const MODELS = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-20241022",
  gemini: "gemini-2.0-flash-exp",
  mistral: "mistral-large-latest",
} as const;

// Request validation schema
const RequestSchema = z.object({
  question: z.string().min(1, "Question cannot be empty"),
});

// Response type for normalized LLM results
export type LlmResult = {
  provider: "openai" | "anthropic" | "gemini" | "mistral";
  ok: boolean;
  text?: string;
  error?: string;
  latencyMs?: number;
  finishReason?: string | null;
};

// System prompt for all providers
const SYSTEM_PROMPT = "Answer succinctly and factually.";

async function callOpenAI(question: string): Promise<LlmResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODELS.openai,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: question }
        ],
        max_tokens: 1024,
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        provider: "openai",
        ok: false,
        error: `HTTP ${response.status}: ${errorText}`,
        latencyMs,
      };
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    
    return {
      provider: "openai",
      ok: true,
      text: choice?.message?.content || "No response",
      latencyMs,
      finishReason: choice?.finish_reason || null,
    };
  } catch (error) {
    return {
      provider: "openai",
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      latencyMs: Date.now() - startTime,
    };
  }
}

async function callAnthropic(question: string): Promise<LlmResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODELS.anthropic,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: question }
        ],
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        provider: "anthropic",
        ok: false,
        error: `HTTP ${response.status}: ${errorText}`,
        latencyMs,
      };
    }

    const data = await response.json();
    const textParts = data.content?.filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text) || [];
    
    return {
      provider: "anthropic",
      ok: true,
      text: textParts.join('') || "No response",
      latencyMs,
      finishReason: data.stop_reason || null,
    };
  } catch (error) {
    return {
      provider: "anthropic",
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      latencyMs: Date.now() - startTime,
    };
  }
}

async function callGemini(question: string): Promise<LlmResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`, // Changed this line
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: question }]
            }
          ],
          systemInstruction: {
            role: "system",
            parts: [{ text: SYSTEM_PROMPT }]
          },
          generationConfig: {
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        provider: "gemini",
        ok: false,
        error: `HTTP ${response.status}: ${errorText}`,
        latencyMs,
      };
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const textParts = candidate?.content?.parts?.filter((p: { text?: string }) => p.text).map((p: { text: string }) => p.text) || [];
    
    return {
      provider: "gemini",
      ok: true,
      text: textParts.join('') || "No response",
      latencyMs,
      finishReason: candidate?.finishReason || null,
    };
  } catch (error) {
    return {
      provider: "gemini",
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      latencyMs: Date.now() - startTime,
    };
  }
}

async function callMistral(question: string): Promise<LlmResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODELS.mistral,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: question }
        ],
        max_tokens: 1024,
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        provider: "mistral",
        ok: false,
        error: `HTTP ${response.status}: ${errorText}`,
        latencyMs,
      };
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    
    return {
      provider: "mistral",
      ok: true,
      text: choice?.message?.content || "No response",
      latencyMs,
      finishReason: choice?.finish_reason || null,
    };
  } catch (error) {
    return {
      provider: "mistral",
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      latencyMs: Date.now() - startTime,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json();
    const { question } = RequestSchema.parse(body);

    // Debug environment variables
    console.log('Environment check:', {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      mistral: !!process.env.MISTRAL_API_KEY,
    });

    // Check for required API keys
    const missingKeys = [];
    if (!process.env.OPENAI_API_KEY) missingKeys.push('OPENAI_API_KEY');
    if (!process.env.ANTHROPIC_API_KEY) missingKeys.push('ANTHROPIC_API_KEY');
    if (!process.env.GOOGLE_AI_API_KEY) missingKeys.push('GOOGLE_AI_API_KEY'); // Changed this line
    if (!process.env.MISTRAL_API_KEY) missingKeys.push('MISTRAL_API_KEY');

    console.log('Missing keys:', missingKeys);

    // Call all providers in parallel with timeout
    const timeout = 25000; // 25 seconds
    const promises = [
      withTimeout(callOpenAI(question), timeout),
      withTimeout(callAnthropic(question), timeout),
      withTimeout(callGemini(question), timeout),
      withTimeout(callMistral(question), timeout),
    ];

    // Use Promise.allSettled to handle failures gracefully
    const results = await Promise.allSettled(promises);

    // Convert settled results to LlmResult format
    const llmResults: LlmResult[] = results.map((result, index) => {
      const providers: LlmResult['provider'][] = ['openai', 'anthropic', 'gemini', 'mistral'];
      const provider = providers[index];

      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          provider,
          ok: false,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });

    return NextResponse.json({
      question,
      results: llmResults,
    });

  } catch (error) {
    console.error('Full error details:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}