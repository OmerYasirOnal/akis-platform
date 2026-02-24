import { getApiBaseUrl } from './config';
import { HttpClient } from './HttpClient';

const httpClient = new HttpClient(getApiBaseUrl());

export interface LogEntry {
  time: number;
  level: number;
  levelLabel: string;
  msg?: string;
  [key: string]: unknown;
}

export interface LogsResponse {
  logs: LogEntry[];
}

export async function getLogs(params: {
  level?: string;
  limit?: number;
  since?: number;
}): Promise<LogsResponse> {
  const qs = new URLSearchParams();
  if (params.level) qs.set('level', params.level);
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.since) qs.set('since', String(params.since));
  const url = qs.toString() ? `/api/admin/logs?${qs}` : '/api/admin/logs';
  return httpClient.get<LogsResponse>(url, { credentials: 'include' });
}
