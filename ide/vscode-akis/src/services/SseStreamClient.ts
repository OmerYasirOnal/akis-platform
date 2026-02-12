import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';

export interface JobEvent {
  type: string;
  jobId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export class SseStreamClient {
  private activeStreams = new Map<string, http.ClientRequest>();

  constructor(private baseUrl: string, private token: string) {}

  streamJob(
    jobId: string,
    onEvent: (event: JobEvent) => void,
    onError: (error: Error) => void,
    onEnd: () => void,
  ): void {
    const url = new URL(`/api/job-events/stream/${jobId}`, this.baseUrl);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options: http.RequestOptions = {
      method: 'GET',
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      },
    };

    const req = lib.request(options, (res) => {
      let buffer = '';

      res.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          const dataLine = block.split('\n').find(l => l.startsWith('data: '));
          if (dataLine) {
            try {
              const parsed = JSON.parse(dataLine.slice(6)) as JobEvent;
              onEvent(parsed);
            } catch {
              // skip malformed events
            }
          }
        }
      });

      res.on('end', () => {
        this.activeStreams.delete(jobId);
        onEnd();
      });

      res.on('error', (err) => {
        this.activeStreams.delete(jobId);
        onError(err);
      });
    });

    req.on('error', (err) => {
      this.activeStreams.delete(jobId);
      onError(err);
    });

    req.end();
    this.activeStreams.set(jobId, req);
  }

  stopStream(jobId: string): void {
    const req = this.activeStreams.get(jobId);
    if (req) {
      req.destroy();
      this.activeStreams.delete(jobId);
    }
  }

  stopAll(): void {
    for (const [id, req] of this.activeStreams) {
      req.destroy();
    }
    this.activeStreams.clear();
  }

  get activeCount(): number {
    return this.activeStreams.size;
  }
}
