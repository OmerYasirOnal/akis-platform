import { randomUUID } from 'crypto';

export interface SessionUser {
  id: string;
  email: string;
}

export interface SessionRecord {
  id: string;
  user: SessionUser;
  createdAt: Date;
}

export class SessionService {
  private sessions = new Map<string, SessionRecord>();

  create(user: SessionUser): SessionRecord {
    const id = randomUUID();
    const record: SessionRecord = {
      id,
      user,
      createdAt: new Date(),
    };
    this.sessions.set(id, record);
    return record;
  }

  get(sessionId: string): SessionRecord | null {
    return this.sessions.get(sessionId) ?? null;
  }

  destroy(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

export const sessionService = new SessionService();


