# AKIS — DEV MODE (Geliştirmeye Devam Et) İMPLEMENTASYON PLANI

.env dosyalarına ASLA dokunma. Servisleri kendin başlat, kendin test et.

---

## BAĞLAM

AKIS'in pipeline'ı çalışıyor: Scribe → Onay → Proto → Trace. Kullanıcı bir fikir girer, pipeline tamamlanır, GitHub'a scaffold push edilir. **Ama burada bitiyor.**

Şimdi eklenen özellik: Pipeline tamamlandıktan sonra kullanıcı **aynı ekranda chat ile geliştirmeye devam eder.** Tıpkı Claude Code gibi tek bir AI agent ile konuşur: "Login sayfası ekle", "CSS'i düzelt", "API endpoint yaz" gibi serbest metin yazar. Agent kod üretir, değişiklikleri **önce preview olarak gösterir**, kullanıcı onaylayınca **aynı GitHub branch'e push eder.**

### Temel Kararlar

1. **Tek Agent:** Yeni `DevAgent` sınıfı — Scribe/Proto/Trace'den bağımsız
2. **Aynı Repo + Branch:** İlk pipeline'da hangi repo/branch kullanıldıysa, DevAgent da onu kullanır. Yeni repo açılmaz.
3. **Context:** DevAgent'a önceki spec + GitHub'daki dosya ağacı (sadece yapı, içerik değil) verilir
4. **Preview → Push:** Değişiklikler önce kullanıcıya gösterilir (diff view), onay sonrası push
5. **Chat UI:** Mevcut WorkflowDetailPage'in altına chat paneli eklenir
6. **Streaming:** SSE ile agent yanıtları streaming olarak gösterilir

### Mimari Akış

```
Pipeline Completed
       ↓
"Geliştirmeye Devam Et" butonu
       ↓
Dev Session başlar (pipeline_id'ye bağlı)
       ↓
Chat UI açılır
       ↓
Kullanıcı mesaj yazar
       ↓
POST /api/pipeline/:id/dev/chat
       ↓
DevAgent:
  1. GitHub'dan mevcut dosya ağacını çeker
  2. Önceki spec'i context olarak alır
  3. Kullanıcının isteğini değerlendirir
  4. Hangi dosyaları oluştur/değiştir/sil kararını verir
  5. Kod üretir
  6. Streaming response döner (SSE)
       ↓
Frontend: Kod preview gösterir (diff view)
       ↓
Kullanıcı "Push" der
       ↓
POST /api/pipeline/:id/dev/push
       ↓
GitHub'a commit + push (aynı branch)
       ↓
Dosya ağacı güncellenir
       ↓
Kullanıcı yeni mesaj yazar → döngü devam eder
```

---

## YASAK KURALLAR

- .env dosyalarına DOKUNMA
- Mevcut pipeline akışını (Scribe → Proto → Trace) BOZMA
- Mevcut API endpoint'lerini DEĞİŞTİRME (GET/POST /api/pipeline/*)
- Yeni repo oluşturma — mevcut repo + branch kullanılacak
- Frontend'te mevcut WorkflowDetailPage'in pipeline görünümünü BOZMA
- RAG / pgvector / kod indeksleme ekleme (scope dışı)
- Terminal / WebContainers / E2B ekleme (scope dışı)
- Ghost text completions / inline AI ekleme (scope dışı)

---

## ADIM 0 — MEVCUT DURUMU ANLA

Başlamadan önce şu dosyaları oku:

```bash
# Backend agent yapısı
find backend/src/agents -name "*.ts" | head -20
cat backend/src/agents/proto/proto-agent.ts

# Orchestrator — pipeline akışı
find backend/src -name "*orchestrat*" | head -5
cat backend/src/services/pipeline/orchestrator.ts  # veya benzer isim

# GitHub service — dosya push mekanizması
find backend/src -name "*github*" -o -name "*git*" | grep -v node_modules | head -10
cat backend/src/services/github/*.ts

# AI service — Claude API çağrısı
find backend/src -name "*ai*" -o -name "*claude*" -o -name "*anthropic*" | grep -v node_modules | head -10
cat backend/src/services/ai/*.ts

# Pipeline API endpoint'leri
find backend/src -name "*pipeline*" -path "*/routes/*" -o -name "*pipeline*" -path "*/plugins/*" | head -10

# DB schema — pipelines tablosu
find backend/src -name "schema*" -o -name "*drizzle*" | grep -v node_modules | head -10

# Frontend WorkflowDetailPage
find frontend/src -name "*WorkflowDetail*" -o -name "*Detail*" | head -10
cat frontend/src/pages/dashboard/WorkflowDetailPage.tsx

# Frontend mevcut API çağrıları
find frontend/src -name "*api*" -path "*/services/*" | head -10
```

NOT AL:
- Proto agent hangi sınıf yapısını kullanıyor? (abstract class var mı?)
- GitHub service dosya push'u nasıl yapıyor? (tree + commit + ref mi?)
- AI service streaming destekliyor mu?
- Pipeline API plugin'de mevcut endpoint'ler neler?
- DB'de pipelines tablosunun şeması ne?
- WorkflowDetailPage'de şu an hangi panel/sekme/bileşenler var?

---

## FAZ 1 — DATABASE

### 1.1 Dev Sessions Tablosu

`backend/src/db/schema.ts` (veya schema dosyası neredeyse) dosyasına yeni tablo ekle:

```typescript
export const devSessions = pgTable('dev_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id),
  
  // Pipeline'dan miras alınan context
  repoOwner: text('repo_owner').notNull(),
  repoName: text('repo_name').notNull(),
  branch: text('branch').notNull(),
  specSnapshot: jsonb('spec_snapshot'),           // Scribe'ın ürettiği spec
  initialFileTree: jsonb('initial_file_tree'),     // Pipeline bittiğindeki dosya ağacı
  
  // Session durumu
  status: text('status').notNull().default('active'),  // active | paused | closed
  totalCommits: integer('total_commits').notNull().default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### 1.2 Dev Messages Tablosu

```typescript
export const devMessages = pgTable('dev_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => devSessions.id),
  
  role: text('role').notNull(),                    // 'user' | 'assistant'
  content: text('content').notNull(),              // Mesaj içeriği
  
  // Agent'ın ürettiği dosya değişiklikleri (sadece assistant mesajlarında)
  fileChanges: jsonb('file_changes'),              // Array<FileChange> — aşağıda tanımlı
  changeStatus: text('change_status'),             // 'pending' | 'approved' | 'pushed' | 'rejected'
  commitSha: text('commit_sha'),                   // Push edildiyse SHA
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### 1.3 TypeScript Types

`backend/src/types/dev-session.ts` oluştur:

```typescript
export interface FileChange {
  action: 'create' | 'modify' | 'delete';
  path: string;
  content?: string;         // create/modify için yeni içerik
  previousContent?: string; // modify için eski içerik (diff göstermek için)
}

export interface DevSessionContext {
  spec: any;                // StructuredSpec from Scribe
  repoOwner: string;
  repoName: string;
  branch: string;
  fileTree: FileTreeNode[];
  chatHistory: ChatMessage[];
}

export interface FileTreeNode {
  path: string;
  type: 'file' | 'dir';
  size?: number;
  children?: FileTreeNode[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  fileChanges?: FileChange[];
}
```

### 1.4 Migration Çalıştır

```bash
cd backend
npx drizzle-kit generate
npx drizzle-kit push
```

Eğer Drizzle kullanılmıyorsa, migration SQL'ini manuel çalıştır:

```sql
CREATE TABLE IF NOT EXISTS dev_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id),
  repo_owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  branch TEXT NOT NULL,
  spec_snapshot JSONB,
  initial_file_tree JSONB,
  status TEXT NOT NULL DEFAULT 'active',
  total_commits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS dev_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES dev_sessions(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  file_changes JSONB,
  change_status TEXT,
  commit_sha TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_dev_sessions_pipeline ON dev_sessions(pipeline_id);
CREATE INDEX idx_dev_messages_session ON dev_messages(session_id);
```

### 1.5 Doğrula

DB'ye bağlan ve tabloların oluştuğunu kontrol et:

```bash
docker exec -it $(docker ps -q --filter name=postgres) psql -U postgres -d akis_v2 -c "\dt dev_*"
```

---

## FAZ 2 — DEV AGENT (Backend)

### 2.1 Mevcut Agent Pattern'i Öğren

Proto agent'ın sınıf yapısını oku. Muhtemelen şöyle bir pattern var:

```typescript
// Mevcut pattern — buna benzer olmalı
class ProtoAgent {
  async run(input: ProtoInput): Promise<ProtoOutput> { ... }
}
```

DevAgent da AYNI pattern'i kullansın — ama pipeline orchestrator'dan bağımsız çalışsın.

### 2.2 DevAgent Sınıfını Oluştur

`backend/src/agents/dev/dev-agent.ts`:

```typescript
import { AIService } from '../../services/ai/...'; // Mevcut AI service'i import et

interface DevAgentInput {
  userMessage: string;
  context: DevSessionContext;
}

interface DevAgentOutput {
  response: string;           // Agent'ın metin yanıtı
  fileChanges: FileChange[];  // Dosya değişiklikleri (boş olabilir)
  reasoning?: string;         // İç düşünce (opsiyonel, debug için)
}

export class DevAgent {
  private aiService: any; // Mevcut AI service tipi

  constructor(aiService: any) {
    this.aiService = aiService;
  }

  async run(input: DevAgentInput): Promise<DevAgentOutput> {
    const systemPrompt = this.buildSystemPrompt(input.context);
    const messages = this.buildMessages(input);

    const response = await this.aiService.chat({
      model: 'claude-sonnet-4-20250514', // Mevcut model string'i ne ise onu kullan
      system: systemPrompt,
      messages,
      max_tokens: 8192,
    });

    return this.parseResponse(response);
  }

  // Streaming versiyonu — SSE için
  async *runStream(input: DevAgentInput): AsyncGenerator<string> {
    const systemPrompt = this.buildSystemPrompt(input.context);
    const messages = this.buildMessages(input);

    // Mevcut AI service'in streaming metodu ne ise onu kullan
    const stream = await this.aiService.stream({
      model: 'claude-sonnet-4-20250514',
      system: systemPrompt,
      messages,
      max_tokens: 8192,
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }

  private buildSystemPrompt(context: DevSessionContext): string {
    const fileTreeStr = this.formatFileTree(context.fileTree);
    const specStr = JSON.stringify(context.spec, null, 2);

    return `Sen AKIS Dev Agent'sın. Kullanıcının mevcut projesini geliştirmesine yardım ediyorsun.

## PROJE BAĞLAMI

### Önceki Spec (Scribe tarafından üretildi)
${specStr}

### Mevcut Dosya Yapısı (GitHub: ${context.repoOwner}/${context.repoName}, branch: ${context.branch})
${fileTreeStr}

## GÖREV

Kullanıcı sana yeni özellik, bug fix, refactor veya herhangi bir geliştirme isteği gönderecek. Sen:

1. İsteği anla ve ne yapılması gerektiğini açıkla
2. Hangi dosyaları oluşturacağını/değiştireceğini/sileceğini belirt
3. Her dosya için tam kodu üret

## ÇIKTI FORMATI

Yanıtını şu formatta ver:

1. Önce düz metin ile açıklama yap (ne yapıyorsun, neden)
2. Sonra dosya değişikliklerini şu XML formatında belirt:

<file_changes>
<change action="create" path="src/pages/Login.tsx">
Dosyanın tam içeriği buraya...
</change>
<change action="modify" path="src/App.tsx">
Dosyanın YENİ tam içeriği buraya (tüm dosya, sadece değişen kısım değil)...
</change>
<change action="delete" path="src/old-file.ts" />
</file_changes>

## KURALLAR

- Her zaman TAM dosya içeriği ver (diff değil, tüm dosya)
- Mevcut dosya yapısıyla tutarlı ol (import path'leri doğru olsun)
- Projenin tech stack'ini koru (mevcut framework, dil, stil)
- Bir seferde çok fazla dosya değiştirme — odaklı ve küçük değişiklikler yap
- Kullanıcıya ne yaptığını her zaman açıkla
- Dosya path'leri projenin root'undan itibaren olsun (baştaki / olmadan)
- Eğer bir dosyanın mevcut içeriğini bilmiyorsan, dosya yapısından çıkarım yap
- Emin olmadığın durumlarda kullanıcıya sor`;
  }

  private buildMessages(input: DevAgentInput): Array<{ role: string; content: string }> {
    // Chat history'yi Claude messages formatına çevir
    const messages = input.context.chatHistory.map((msg) => ({
      role: msg.role,
      content: msg.role === 'assistant' && msg.fileChanges?.length
        ? `${msg.content}\n\n[${msg.fileChanges.length} dosya değişikliği uygulandı]`
        : msg.content,
    }));

    // Yeni kullanıcı mesajını ekle
    messages.push({
      role: 'user',
      content: input.userMessage,
    });

    return messages;
  }

  private parseResponse(rawResponse: string): DevAgentOutput {
    // <file_changes> bloğunu ayıkla
    const fileChangesMatch = rawResponse.match(/<file_changes>([\s\S]*?)<\/file_changes>/);
    let fileChanges: FileChange[] = [];
    let textResponse = rawResponse;

    if (fileChangesMatch) {
      textResponse = rawResponse.replace(/<file_changes>[\s\S]*?<\/file_changes>/, '').trim();
      fileChanges = this.parseFileChanges(fileChangesMatch[1]);
    }

    return {
      response: textResponse,
      fileChanges,
    };
  }

  private parseFileChanges(xml: string): FileChange[] {
    const changes: FileChange[] = [];
    const changeRegex = /<change\s+action="(create|modify|delete)"\s+path="([^"]+)"(?:\s*\/>|>([\s\S]*?)<\/change>)/g;
    
    let match;
    while ((match = changeRegex.exec(xml)) !== null) {
      changes.push({
        action: match[1] as 'create' | 'modify' | 'delete',
        path: match[2],
        content: match[3]?.trim() || undefined,
      });
    }

    return changes;
  }

  private formatFileTree(tree: FileTreeNode[], indent = ''): string {
    let result = '';
    for (const node of tree) {
      if (node.type === 'dir') {
        result += `${indent}📁 ${node.path}/\n`;
        if (node.children) {
          result += this.formatFileTree(node.children, indent + '  ');
        }
      } else {
        result += `${indent}📄 ${node.path}\n`;
      }
    }
    return result;
  }
}
```

### 2.3 GitHub Okuma Servisi

Mevcut GitHub service'e dosya ağacı okuma metodu ekle. Mevcut service dosyasını bul ve şu metotları ekle:

```typescript
// Mevcut GitHub service dosyasına ekle

/**
 * Repo'daki bir branch'in dosya ağacını recursive olarak çeker.
 * Sadece yapı (path + type), içerik DEĞİL.
 */
async getFileTree(owner: string, repo: string, branch: string): Promise<FileTreeNode[]> {
  const response = await this.octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
    owner,
    repo,
    tree_sha: branch,
    recursive: 'true',
  });

  // GitHub tree'yi FileTreeNode formatına çevir
  const nodes: FileTreeNode[] = [];
  
  for (const item of response.data.tree) {
    if (item.type === 'blob') {
      nodes.push({
        path: item.path!,
        type: 'file',
        size: item.size,
      });
    }
    // 'tree' tipindeki item'lar directory — ama recursive modda flat gelir,
    // dosya path'lerinden directory yapısı çıkarılabilir
  }

  return this.buildTreeStructure(nodes);
}

/**
 * Flat dosya listesini nested tree yapısına çevirir
 */
private buildTreeStructure(flatFiles: FileTreeNode[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  const dirs: Map<string, FileTreeNode> = new Map();

  for (const file of flatFiles) {
    const parts = file.path.split('/');
    
    if (parts.length === 1) {
      // Root seviyesinde dosya
      root.push(file);
    } else {
      // Directory oluştur veya bul
      let currentPath = '';
      let currentLevel = root;

      for (let i = 0; i < parts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
        
        if (!dirs.has(currentPath)) {
          const dir: FileTreeNode = {
            path: parts[i],
            type: 'dir',
            children: [],
          };
          dirs.set(currentPath, dir);
          currentLevel.push(dir);
        }
        
        currentLevel = dirs.get(currentPath)!.children!;
      }

      // Dosyayı son directory'ye ekle
      currentLevel.push({
        path: parts[parts.length - 1],
        type: 'file',
        size: file.size,
      });
    }
  }

  return root;
}

/**
 * Belirli bir dosyanın içeriğini çeker (DevAgent ihtiyaç duyarsa)
 */
async getFileContent(owner: string, repo: string, branch: string, path: string): Promise<string> {
  const response = await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner,
    repo,
    path,
    ref: branch,
  });

  if ('content' in response.data && response.data.encoding === 'base64') {
    return Buffer.from(response.data.content, 'base64').toString('utf-8');
  }

  throw new Error(`Cannot read file: ${path}`);
}

/**
 * Birden fazla dosya değişikliğini tek commit olarak push eder.
 * Mevcut Proto push mekanizmasını referans al — AYNI pattern.
 */
async pushChanges(
  owner: string,
  repo: string,
  branch: string,
  changes: FileChange[],
  commitMessage: string
): Promise<string> {
  // 1. Branch'in son commit SHA'sını al
  const refResponse = await this.octokit.request('GET /repos/{owner}/{repo}/git/refs/heads/{branch}', {
    owner, repo, branch,
  });
  const latestCommitSha = refResponse.data.object.sha;

  // 2. Son commit'in tree SHA'sını al
  const commitResponse = await this.octokit.request('GET /repos/{owner}/{repo}/git/commits/{commit_sha}', {
    owner, repo, commit_sha: latestCommitSha,
  });
  const baseTreeSha = commitResponse.data.tree.sha;

  // 3. Yeni tree oluştur (değişiklikleri uygula)
  const treeItems = [];
  for (const change of changes) {
    if (change.action === 'delete') {
      // Silme: sha = null ile tree item ekle
      treeItems.push({
        path: change.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: null,
      });
    } else {
      // Create veya modify: blob oluştur
      const blobResponse = await this.octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
        owner, repo,
        content: change.content || '',
        encoding: 'utf-8',
      });
      treeItems.push({
        path: change.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blobResponse.data.sha,
      });
    }
  }

  const newTreeResponse = await this.octokit.request('POST /repos/{owner}/{repo}/git/trees', {
    owner, repo,
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  // 4. Yeni commit oluştur
  const newCommitResponse = await this.octokit.request('POST /repos/{owner}/{repo}/git/commits', {
    owner, repo,
    message: commitMessage,
    tree: newTreeResponse.data.sha,
    parents: [latestCommitSha],
  });

  // 5. Branch ref'ini güncelle
  await this.octokit.request('PATCH /repos/{owner}/{repo}/git/refs/heads/{branch}', {
    owner, repo, branch,
    sha: newCommitResponse.data.sha,
  });

  return newCommitResponse.data.sha;
}
```

**ÖNEMLİ:** Mevcut GitHub service'te zaten benzer push mekanizması varsa (Proto kullanıyorsa), yeniden yazma — mevcut metotları kullan. Sadece `getFileTree`, `getFileContent` ve `pushChanges` (eğer yoksa) ekle.

---

## FAZ 3 — API ENDPOINT'LERİ (Backend)

### 3.1 Dev Session API Plugin

`backend/src/routes/dev-session.ts` (veya mevcut route pattern'ine uygun konum) oluştur:

```typescript
// Mevcut plugin/route pattern'ine uyarla

// ═══════════════════════════════════════════
// 1. DEV SESSION BAŞLAT
// ═══════════════════════════════════════════
// POST /api/pipeline/:id/dev/start
// 
// Pipeline tamamlandığında "Geliştirmeye Devam Et" tıklanınca çağrılır.
// Pipeline'ın repo/branch/spec bilgilerini alır, GitHub'dan dosya ağacını çeker,
// dev_sessions tablosuna yazar.
//
// Request: (body yok — pipeline_id URL'den gelir)
// Response: { sessionId: string, fileTree: FileTreeNode[] }

async function startDevSession(request, reply) {
  const { id: pipelineId } = request.params;
  
  // 1. Pipeline'ı bul
  const pipeline = await db.query.pipelines.findFirst({
    where: eq(pipelines.id, pipelineId),
  });
  
  if (!pipeline) return reply.status(404).send({ error: 'Pipeline not found' });
  if (pipeline.status !== 'completed' && pipeline.status !== 'completed_partial') {
    return reply.status(400).send({ error: 'Pipeline must be completed to start dev mode' });
  }
  
  // 2. Mevcut aktif session var mı kontrol et
  const existingSession = await db.query.devSessions.findFirst({
    where: and(
      eq(devSessions.pipelineId, pipelineId),
      eq(devSessions.status, 'active'),
    ),
  });
  
  if (existingSession) {
    // Mevcut session'ı döndür (tekrar başlatma)
    const messages = await db.query.devMessages.findMany({
      where: eq(devMessages.sessionId, existingSession.id),
      orderBy: asc(devMessages.createdAt),
    });
    return reply.send({
      sessionId: existingSession.id,
      fileTree: existingSession.initialFileTree,
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        fileChanges: m.fileChanges,
        changeStatus: m.changeStatus,
        createdAt: m.createdAt,
      })),
    });
  }
  
  // 3. Pipeline'dan repo/branch/spec bilgilerini çıkar
  // Proto output'undan repo ve branch bilgisini al
  const protoOutput = pipeline.stages?.proto?.output; // Mevcut yapıya göre uyarla
  const scribeOutput = pipeline.stages?.scribe?.output;
  
  const repoOwner = protoOutput?.repoOwner || protoOutput?.repo?.split('/')[0];
  const repoName = protoOutput?.repoName || protoOutput?.repo?.split('/')[1];
  const branch = protoOutput?.branch;
  const spec = scribeOutput?.spec;
  
  if (!repoOwner || !repoName || !branch) {
    return reply.status(400).send({ error: 'Pipeline missing repo/branch info from Proto' });
  }
  
  // 4. GitHub'dan dosya ağacını çek
  let fileTree: FileTreeNode[] = [];
  try {
    fileTree = await githubService.getFileTree(repoOwner, repoName, branch);
  } catch (err) {
    console.error('Failed to fetch file tree:', err);
    // Dosya ağacı çekilemese bile session başlat — agent tree olmadan da çalışabilir
  }
  
  // 5. Session oluştur
  const [session] = await db.insert(devSessions).values({
    pipelineId,
    repoOwner,
    repoName,
    branch,
    specSnapshot: spec,
    initialFileTree: fileTree,
    status: 'active',
  }).returning();
  
  return reply.send({
    sessionId: session.id,
    fileTree,
    messages: [],
  });
}


// ═══════════════════════════════════════════
// 2. CHAT MESAJI GÖNDER (SSE Streaming)
// ═══════════════════════════════════════════
// POST /api/pipeline/:id/dev/chat
//
// Kullanıcı mesajı gönderir, DevAgent streaming yanıt döner.
// SSE formatında: data: { type: 'text' | 'file_changes' | 'done', content: ... }
//
// Request: { sessionId: string, message: string }
// Response: SSE stream

async function devChat(request, reply) {
  const { id: pipelineId } = request.params;
  const { sessionId, message } = request.body;
  
  // 1. Session'ı bul
  const session = await db.query.devSessions.findFirst({
    where: and(
      eq(devSessions.id, sessionId),
      eq(devSessions.pipelineId, pipelineId),
      eq(devSessions.status, 'active'),
    ),
  });
  
  if (!session) return reply.status(404).send({ error: 'Dev session not found' });
  
  // 2. Kullanıcı mesajını kaydet
  await db.insert(devMessages).values({
    sessionId,
    role: 'user',
    content: message,
  });
  
  // 3. Chat history'yi çek
  const history = await db.query.devMessages.findMany({
    where: eq(devMessages.sessionId, sessionId),
    orderBy: asc(devMessages.createdAt),
  });
  
  // 4. Güncel dosya ağacını çek (her mesajda taze çek — push olmuş olabilir)
  let currentFileTree = session.initialFileTree as FileTreeNode[];
  try {
    currentFileTree = await githubService.getFileTree(
      session.repoOwner, session.repoName, session.branch
    );
  } catch (err) {
    console.warn('Could not refresh file tree, using cached:', err);
  }
  
  // 5. DevAgent context hazırla
  const context: DevSessionContext = {
    spec: session.specSnapshot,
    repoOwner: session.repoOwner,
    repoName: session.repoName,
    branch: session.branch,
    fileTree: currentFileTree,
    chatHistory: history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
      fileChanges: m.fileChanges as FileChange[] | undefined,
    })),
  };
  
  // 6. SSE headers
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  
  // 7. DevAgent'ı çalıştır
  const devAgent = new DevAgent(aiService);
  
  try {
    let fullResponse = '';
    
    // Streaming — eğer AI service streaming destekliyorsa
    // Desteklemiyorsa, non-streaming fallback kullan
    const result = await devAgent.run({
      userMessage: message,
      context,
    });
    
    fullResponse = result.response;
    
    // Metin yanıtını gönder
    reply.raw.write(`data: ${JSON.stringify({ type: 'text', content: result.response })}\n\n`);
    
    // Dosya değişikliklerini gönder
    if (result.fileChanges.length > 0) {
      reply.raw.write(`data: ${JSON.stringify({ type: 'file_changes', changes: result.fileChanges })}\n\n`);
    }
    
    // Assistant mesajını kaydet
    await db.insert(devMessages).values({
      sessionId,
      role: 'assistant',
      content: fullResponse,
      fileChanges: result.fileChanges.length > 0 ? result.fileChanges : null,
      changeStatus: result.fileChanges.length > 0 ? 'pending' : null,
    });
    
    reply.raw.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    
  } catch (err) {
    console.error('DevAgent error:', err);
    reply.raw.write(`data: ${JSON.stringify({ type: 'error', content: String(err) })}\n\n`);
  }
  
  reply.raw.end();
}


// ═══════════════════════════════════════════
// 3. DEĞİŞİKLİKLERİ PUSH ET
// ═══════════════════════════════════════════
// POST /api/pipeline/:id/dev/push
//
// Kullanıcı preview'ı onayladıktan sonra GitHub'a push eder.
//
// Request: { sessionId: string, messageId: string }
// Response: { commitSha: string, commitUrl: string }

async function devPush(request, reply) {
  const { id: pipelineId } = request.params;
  const { sessionId, messageId } = request.body;
  
  // 1. Message'ı bul
  const message = await db.query.devMessages.findFirst({
    where: and(
      eq(devMessages.id, messageId),
      eq(devMessages.sessionId, sessionId),
    ),
  });
  
  if (!message) return reply.status(404).send({ error: 'Message not found' });
  if (!message.fileChanges) return reply.status(400).send({ error: 'No file changes to push' });
  if (message.changeStatus === 'pushed') return reply.status(400).send({ error: 'Already pushed' });
  
  // 2. Session'ı bul
  const session = await db.query.devSessions.findFirst({
    where: eq(devSessions.id, sessionId),
  });
  
  if (!session) return reply.status(404).send({ error: 'Session not found' });
  
  // 3. GitHub'a push
  const changes = message.fileChanges as FileChange[];
  const commitMessage = `dev: ${changes.map(c => `${c.action} ${c.path}`).join(', ')}`;
  
  try {
    const commitSha = await githubService.pushChanges(
      session.repoOwner,
      session.repoName,
      session.branch,
      changes,
      commitMessage,
    );
    
    // 4. Message durumunu güncelle
    await db.update(devMessages)
      .set({ changeStatus: 'pushed', commitSha })
      .where(eq(devMessages.id, messageId));
    
    // 5. Session commit sayısını artır
    await db.update(devSessions)
      .set({ totalCommits: sql`total_commits + 1`, updatedAt: new Date() })
      .where(eq(devSessions.id, sessionId));
    
    return reply.send({
      commitSha,
      commitUrl: `https://github.com/${session.repoOwner}/${session.repoName}/commit/${commitSha}`,
    });
    
  } catch (err) {
    console.error('GitHub push error:', err);
    return reply.status(500).send({ error: `Push failed: ${String(err)}` });
  }
}


// ═══════════════════════════════════════════
// 4. DEĞİŞİKLİKLERİ REDDET
// ═══════════════════════════════════════════
// POST /api/pipeline/:id/dev/reject
//
// Request: { sessionId: string, messageId: string }
// Response: { ok: true }

async function devReject(request, reply) {
  const { sessionId, messageId } = request.body;
  
  await db.update(devMessages)
    .set({ changeStatus: 'rejected' })
    .where(and(
      eq(devMessages.id, messageId),
      eq(devMessages.sessionId, sessionId),
    ));
  
  return reply.send({ ok: true });
}


// ═══════════════════════════════════════════
// 5. SESSION BİLGİSİ
// ═══════════════════════════════════════════
// GET /api/pipeline/:id/dev/session
//
// Mevcut session + tüm mesajları döner.
//
// Response: { session: DevSession, messages: DevMessage[] }

async function getDevSession(request, reply) {
  const { id: pipelineId } = request.params;
  
  const session = await db.query.devSessions.findFirst({
    where: and(
      eq(devSessions.pipelineId, pipelineId),
      eq(devSessions.status, 'active'),
    ),
  });
  
  if (!session) return reply.status(404).send({ error: 'No active dev session' });
  
  const messages = await db.query.devMessages.findMany({
    where: eq(devMessages.sessionId, session.id),
    orderBy: asc(devMessages.createdAt),
  });
  
  return reply.send({
    session: {
      id: session.id,
      repoOwner: session.repoOwner,
      repoName: session.repoName,
      branch: session.branch,
      status: session.status,
      totalCommits: session.totalCommits,
      createdAt: session.createdAt,
    },
    messages: messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      fileChanges: m.fileChanges,
      changeStatus: m.changeStatus,
      commitSha: m.commitSha,
      createdAt: m.createdAt,
    })),
  });
}
```

### 3.2 Route'ları Kaydet

Mevcut pipeline plugin/route dosyasını bul. Yeni endpoint'leri EKLE (mevcutlara DOKUNMA):

```typescript
// Mevcut route registration pattern'ine uyarla
fastify.post('/api/pipeline/:id/dev/start', startDevSession);
fastify.post('/api/pipeline/:id/dev/chat', devChat);
fastify.post('/api/pipeline/:id/dev/push', devPush);
fastify.post('/api/pipeline/:id/dev/reject', devReject);
fastify.get('/api/pipeline/:id/dev/session', getDevSession);
```

### 3.3 Test Et

```bash
# Backend'i başlat
cd backend
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2 DEV_MODE=true npx tsx watch src/server.ts

# Mevcut pipeline'ları listele
curl -s http://localhost:3000/api/pipeline | python3 -m json.tool | head -20

# Completed pipeline'ın id'sini al (PIPELINE_ID değişkenine yaz)
PIPELINE_ID="<tamamlanmis-pipeline-id>"

# Dev session başlat
curl -s -X POST http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/start | python3 -m json.tool

# Chat mesajı gönder (SSE)
SESSION_ID="<session-id-from-above>"
curl -N -X POST http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/chat \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"message\": \"Ana sayfaya bir hero section ekle\"}"
```

---

## FAZ 4 — FRONTEND

### 4.1 API Client

Mevcut API client dosyasına (frontend'teki) dev session metotlarını ekle:

```typescript
// Mevcut API client dosyasına ekle (services/api/ altında)

export const devApi = {
  startSession: (pipelineId: string) =>
    api.post(`/api/pipeline/${pipelineId}/dev/start`),

  getSession: (pipelineId: string) =>
    api.get(`/api/pipeline/${pipelineId}/dev/session`),

  // Chat — SSE stream döner, özel handling gerekir
  chat: async (pipelineId: string, sessionId: string, message: string) => {
    const response = await fetch(`/api/pipeline/${pipelineId}/dev/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message }),
    });
    return response; // SSE stream olarak döner — caller'da işlenecek
  },

  pushChanges: (pipelineId: string, sessionId: string, messageId: string) =>
    api.post(`/api/pipeline/${pipelineId}/dev/push`, { sessionId, messageId }),

  rejectChanges: (pipelineId: string, sessionId: string, messageId: string) =>
    api.post(`/api/pipeline/${pipelineId}/dev/reject`, { sessionId, messageId }),
};
```

### 4.2 DevChatPanel Bileşeni

`frontend/src/components/dev/DevChatPanel.tsx` oluştur:

```tsx
import { useState, useEffect, useRef } from 'react';
import { devApi } from '../../services/api/...'; // Mevcut API import path

interface FileChange {
  action: 'create' | 'modify' | 'delete';
  path: string;
  content?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  fileChanges?: FileChange[];
  changeStatus?: 'pending' | 'approved' | 'pushed' | 'rejected';
  commitSha?: string;
  createdAt: string;
}

interface DevChatPanelProps {
  pipelineId: string;
  isCompleted: boolean; // Pipeline tamamlandıysa true
}

export function DevChatPanel({ pipelineId, isCompleted }: DevChatPanelProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pipeline tamamlandıysa ve session varsa, mevcut session'ı yükle
  useEffect(() => {
    if (!isCompleted) return;
    
    devApi.getSession(pipelineId)
      .then((data: any) => {
        setSessionId(data.session.id);
        setMessages(data.messages);
      })
      .catch(() => {
        // Session yok — normal, kullanıcı henüz başlatmamış
      });
  }, [pipelineId, isCompleted]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Dev session başlat
  const handleStartSession = async () => {
    setIsStarting(true);
    try {
      const data = await devApi.startSession(pipelineId);
      setSessionId(data.sessionId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to start dev session:', err);
    } finally {
      setIsStarting(false);
    }
  };

  // Mesaj gönder
  const handleSend = async () => {
    if (!input.trim() || !sessionId || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setStreamingText('');

    // Optimistic: kullanıcı mesajını hemen göster
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await devApi.chat(pipelineId, sessionId, userMessage);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let assistantText = '';
      let fileChanges: FileChange[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'text') {
                assistantText = data.content;
                setStreamingText(data.content);
              } else if (data.type === 'file_changes') {
                fileChanges = data.changes;
              } else if (data.type === 'done') {
                // Streaming bitti
              }
            } catch (e) {
              // JSON parse hatası — devam et
            }
          }
        }
      }

      setStreamingText('');
      
      // Son session state'i backend'den çek (mesaj ID'leri doğru olsun)
      const sessionData = await devApi.getSession(pipelineId);
      setMessages(sessionData.messages);

    } catch (err) {
      console.error('Chat error:', err);
      setStreamingText('');
    } finally {
      setIsLoading(false);
    }
  };

  // Push onaylama
  const handlePush = async (messageId: string) => {
    if (!sessionId) return;
    
    try {
      const result = await devApi.pushChanges(pipelineId, sessionId, messageId);
      
      // Mesaj durumunu güncelle
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, changeStatus: 'pushed' as const, commitSha: result.commitSha }
          : m
      ));
    } catch (err) {
      console.error('Push failed:', err);
    }
  };

  // Reject
  const handleReject = async (messageId: string) => {
    if (!sessionId) return;
    
    try {
      await devApi.rejectChanges(pipelineId, sessionId, messageId);
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, changeStatus: 'rejected' as const } : m
      ));
    } catch (err) {
      console.error('Reject failed:', err);
    }
  };

  // Pipeline tamamlanmadıysa gösterme
  if (!isCompleted) return null;

  // Session henüz başlamamış — başlatma butonu göster
  if (!sessionId) {
    return (
      <div className="border-t border-white/10 p-6 text-center">
        <div className="text-sm text-white/40 mb-3">
          Pipeline tamamlandı. Geliştirmeye devam etmek için dev mode'u başlatın.
        </div>
        <button
          onClick={handleStartSession}
          disabled={isStarting}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--ak-primary, #10b981)' }}
        >
          {isStarting ? 'Başlatılıyor...' : '🚀 Geliştirmeye Devam Et'}
        </button>
      </div>
    );
  }

  // Chat UI
  return (
    <div className="border-t border-white/10 flex flex-col" style={{ height: '400px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10"
           style={{ backgroundColor: 'var(--ak-surface, #1a1a2e)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-white/40">DEV MODE</span>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
        <span className="text-xs text-white/30 font-mono">
          {messages.filter(m => m.changeStatus === 'pushed').length} commits
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-white/10 text-white/90'
                : 'bg-white/5 text-white/80 border border-white/5'
            }`}>
              {/* Mesaj metni */}
              <div className="whitespace-pre-wrap">{msg.content}</div>
              
              {/* Dosya değişiklikleri (assistant mesajlarında) */}
              {msg.fileChanges && msg.fileChanges.length > 0 && (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <div className="text-xs text-white/40 mb-2 font-mono uppercase">
                    {msg.fileChanges.length} dosya değişikliği
                  </div>
                  
                  {msg.fileChanges.map((change: FileChange, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-mono py-1">
                      <span className={
                        change.action === 'create' ? 'text-green-400' :
                        change.action === 'modify' ? 'text-yellow-400' :
                        'text-red-400'
                      }>
                        {change.action === 'create' ? '+' : change.action === 'modify' ? '~' : '-'}
                      </span>
                      <span className="text-white/60">{change.path}</span>
                    </div>
                  ))}

                  {/* Push/Reject butonları */}
                  {msg.changeStatus === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handlePush(msg.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-green-600 hover:bg-green-500"
                      >
                        ✓ Push to GitHub
                      </button>
                      <button
                        onClick={() => handleReject(msg.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 border border-white/10 hover:bg-white/5"
                      >
                        ✗ İptal
                      </button>
                    </div>
                  )}

                  {msg.changeStatus === 'pushed' && (
                    <div className="mt-2 text-xs text-green-400 font-mono">
                      ✓ Pushed · {msg.commitSha?.slice(0, 7)}
                    </div>
                  )}

                  {msg.changeStatus === 'rejected' && (
                    <div className="mt-2 text-xs text-red-400/60 font-mono">
                      ✗ İptal edildi
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming indicator */}
        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-xl px-4 py-3 text-sm bg-white/5 text-white/80 border border-white/5">
              <div className="whitespace-pre-wrap">{streamingText}</div>
              <span className="inline-block w-2 h-4 bg-white/40 animate-pulse ml-1" />
            </div>
          </div>
        )}

        {isLoading && !streamingText && (
          <div className="flex justify-start">
            <div className="rounded-xl px-4 py-3 bg-white/5 border border-white/5">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span className="animate-spin">⟳</span> DevAgent düşünüyor...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10" style={{ backgroundColor: 'var(--ak-surface, #1a1a2e)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ne geliştirmek istiyorsun? (ör: login sayfası ekle)"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white/5 text-white/90 border border-white/10 focus:border-white/20 focus:outline-none placeholder-white/25"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-30"
            style={{ backgroundColor: 'var(--ak-primary, #6366f1)' }}
          >
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 4.3 WorkflowDetailPage'e Entegre Et

Mevcut `WorkflowDetailPage.tsx` dosyasını aç. Sayfanın EN ALTINA DevChatPanel'i ekle:

```tsx
import { DevChatPanel } from '../../components/dev/DevChatPanel';

// Component return'ünde, en alta ekle:

{/* Mevcut pipeline stages/timeline bileşenleri */}
{/* ... mevcut kod ... */}

{/* Dev Mode Chat Panel */}
<DevChatPanel 
  pipelineId={workflow.id} 
  isCompleted={workflow.status === 'completed' || workflow.status === 'completed_partial'} 
/>
```

### 4.4 "Geliştirmeye Devam Et" Butonunu Bağla

Mevcut "Geliştirmeye Devam Et" butonunu bul. Şu an muhtemelen bir placeholder veya başka bir yere yönlendiriyor. Şöyle değiştir:

```tsx
// "Geliştirmeye Devam Et" butonu — sayfanın altındaki chat paneline scroll et
<button
  onClick={() => {
    // Chat paneline scroll et
    document.getElementById('dev-chat-panel')?.scrollIntoView({ behavior: 'smooth' });
  }}
  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
  style={{ backgroundColor: 'var(--ak-primary, #10b981)' }}
>
  🚀 Geliştirmeye Devam Et
</button>
```

DevChatPanel'in root div'ine `id="dev-chat-panel"` ekle.

---

## FAZ 5 — DOĞRULAMA

### 5.1 Backend Test

```bash
cd backend
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2 DEV_MODE=true npx tsx watch src/server.ts
```

```bash
# 1. Tamamlanmış pipeline bul
curl -s http://localhost:3000/api/pipeline | python3 -c "
import sys, json
data = json.load(sys.stdin)
pipelines = data.get('pipelines', data) if isinstance(data, dict) else data
for p in pipelines:
  if isinstance(p, dict) and p.get('status') in ['completed', 'completed_partial']:
    print(f\"ID: {p['id']} — Status: {p['status']}\")
"

# 2. Dev session başlat
PIPELINE_ID="<id>"
curl -s -X POST http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/start | python3 -m json.tool

# 3. Chat mesajı gönder
SESSION_ID="<session-id>"
curl -N -X POST http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/chat \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"message\": \"Mevcut projeye bir About sayfası ekle\"}"

# 4. SSE response'ın geldiğini doğrula (data: { type: 'text', ... } formatında)

# 5. Session'ı kontrol et
curl -s http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/session | python3 -m json.tool
```

### 5.2 Frontend Test

```bash
cd frontend && npm run dev
```

Tarayıcıda:
1. `/dashboard/workflows/<completed-id>` aç
2. Sayfanın altında "Geliştirmeye Devam Et" butonu görünüyor mu?
3. Tıkla → Chat paneli açılıyor mu?
4. Bir mesaj yaz: "Ana sayfaya hero section ekle"
5. Agent yanıt veriyor mu? (metin + dosya değişiklikleri)
6. "Push to GitHub" butonu görünüyor mu?
7. Push'a tıkla → GitHub'da commit oluşuyor mu?
8. İkinci mesaj yaz → önceki context korunuyor mu?

### 5.3 Build Kontrolü

```bash
cd frontend && npm run build
cd ../backend && npm run build  # veya npx tsc --noEmit
```

Hata varsa düzelt.

---

## FAZ 6 — İYİLEŞTİRMELER (Opsiyonel, zaman kalırsa)

### 6.1 Dosya İçeriği Preview (Diff View)

Şu an sadece dosya path'leri gösteriliyor. İlerleyen adımda:
- Assistant mesajında dosya path'ine tıklanınca tam içerik gösterilsin
- Modify action'larında basit diff view (eski vs yeni)
- CodeMirror kullanarak syntax highlighted preview

### 6.2 Dosya Ağacı Güncelleme

Her push sonrası sidebar'daki dosya ağacı otomatik güncellenesin:
- Push başarılı olunca `getFileTree` tekrar çağır
- Yeni eklenen dosyalar yeşil, değiştirilenler sarı highlight

### 6.3 Streaming Improvements

- Token-by-token streaming (şu an tüm yanıt bir kerede geliyor)
- Typing indicator daha smooth
- Code block'lar syntax highlighted

---

## STATUS REPORT

```
## Dev Mode — Sonuç Raporu

Faz 1 — Database:
- dev_sessions tablosu: ✓/✗
- dev_messages tablosu: ✓/✗
- Migration çalıştı: ✓/✗

Faz 2 — DevAgent:
- DevAgent sınıfı: ✓/✗
- System prompt + context: ✓/✗
- parseResponse (XML→FileChange[]): ✓/✗
- GitHub getFileTree: ✓/✗
- GitHub pushChanges: ✓/✗

Faz 3 — API Endpoints:
- POST /dev/start: ✓/✗
- POST /dev/chat (SSE): ✓/✗
- POST /dev/push: ✓/✗
- POST /dev/reject: ✓/✗
- GET /dev/session: ✓/✗

Faz 4 — Frontend:
- DevChatPanel bileşeni: ✓/✗
- SSE stream parsing: ✓/✗
- FileChange preview: ✓/✗
- Push/Reject butonları: ✓/✗
- WorkflowDetailPage entegrasyonu: ✓/✗

Faz 5 — Doğrulama:
- Backend curl testi: ✓/✗
- Frontend canlı testi: ✓/✗
- Build temiz: ✓/✗
- GitHub push çalışıyor: ✓/✗
- Chat history korunuyor: ✓/✗

Build: frontend ✓/✗ | backend ✓/✗
```

---

## GENEL KURALLAR

- .env dosyalarına ASLA dokunma
- Mevcut pipeline endpoint'lerini (GET/POST /api/pipeline/*) DEĞİŞTİRME
- Mevcut Scribe → Proto → Trace akışını BOZMA
- Her fazda hata çıkarsa düzelt, sonra devam et
- Import path'lerini ADIM 0'daki keşfe göre düzelt
- Mevcut AI service pattern'ini kullan — yeni AI client oluşturma
- Mevcut GitHub service pattern'ini kullan — yeni GitHub client oluşturma
- DevAgent system prompt'u Türkçe de olabilir, İngilizce de — mevcut agent'lardaki dile uy
- Servisleri kendin başlat ve canlı test et
