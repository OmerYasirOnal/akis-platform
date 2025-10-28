/**
 * Document Agent API Endpoint V2
 * POST /api/agent/document
 * Playbook-based agent kullanır
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

import { documentAgentV2 } from "@/modules/documentation/agent/document-agent-v2";
import { z } from 'zod';

// Request validation schema
const RequestSchema = z.object({
  content: z.string().min(1, 'Döküman içeriği boş olamaz'),
  action: z.enum(['summarize', 'qa', 'analyze']),
  question: z.string().optional(),
  stream: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Geçersiz istek', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { content, action, question, stream } = parsed.data;

    // Streaming response
    if (stream) {
      const result = await documentAgentV2.executeStream({
        content,
        action,
        question,
      });

      return result.toTextStreamResponse();
    }

    // Regular response
    const result = await documentAgentV2.execute({
      content,
      action,
      question,
    });

    return NextResponse.json({
      success: true,
      result,
      action,
    });

  } catch (error) {
    console.error('Document agent error:', error);
    return NextResponse.json(
      { 
        error: 'Agent işlemi başarısız',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}

