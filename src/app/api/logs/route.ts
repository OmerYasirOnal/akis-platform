/**
 * Server Log Mirroring Endpoint
 * Receives logs from client-side and mirrors them to server console
 * 
 * This enables visibility of client-side agent operations in server logs
 * for debugging and monitoring purposes.
 */

import { NextRequest, NextResponse } from 'next/server';

interface LogPayload {
  level: 'info' | 'warn' | 'error' | 'debug';
  scope: string;
  message: string;
  meta?: any;
  timestamp?: string;
}

export async function POST(req: NextRequest) {
  try {
    const payload: LogPayload = await req.json();
    
    // Validate payload
    if (!payload.level || !payload.scope || !payload.message) {
      return NextResponse.json(
        { error: 'Invalid log payload' },
        { status: 400 }
      );
    }

    // Format log message for server console
    const timestamp = payload.timestamp || new Date().toISOString();
    const logPrefix = `[${timestamp}] [CLIENT→SERVER] [${payload.scope}]`;
    
    // Mirror to appropriate console method
    switch (payload.level) {
      case 'error':
        console.error(logPrefix, payload.message, payload.meta || '');
        break;
      case 'warn':
        console.warn(logPrefix, payload.message, payload.meta || '');
        break;
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(logPrefix, payload.message, payload.meta || '');
        }
        break;
      case 'info':
      default:
        console.log(logPrefix, payload.message, payload.meta || '');
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Log Mirror] Failed to process log:', error);
    return NextResponse.json(
      { error: 'Failed to process log' },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    service: 'Log Mirror API',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
}
