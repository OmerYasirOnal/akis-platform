### 1\. Agent System Architecture Research & Recommendation

Common Architectures for Agent Systems: In software agent design, several architecture patterns are prevalent:

  * Multi-Agent Systems (MAS): A general term for systems where multiple autonomous agents interact. MAS often emphasizes communication protocols between agents and can be decentralized or centralized. In decentralized MAS, agents negotiate or cooperate without a single point of control, while centralized MAS uses a coordinator (or orchestrator) to assign tasks. MAS frameworks (e.g. JADE, SPADE) provide infrastructure for messaging and agent lifecycles, but they introduce overhead and complexity that might be overkill for a small system on limited resources.
  * BDI (Belief-Desire-Intention): A deliberative agent architecture modeling human-like reasoning. Agents maintain beliefs (knowledge about the world), desires (goals), and intentions (current plans). BDI provides a rigorous framework for goal-oriented behavior, ensuring agents choose actions based on rational plans. However, BDI frameworks can be heavy; they involve interpreters or reasoning engines to evaluate plans, which adds computational overhead. While BDI excels in complex, dynamic domains (e.g. robotics or simulation), implementing a full BDI system on an OCI Free Tier machine would likely be too resource-intensive relative to our needs. Simpler goal-driven patterns can achieve our aims with less overhead.
  * Orchestrator/Controller Pattern: A centralized coordination approach where a master Orchestrator component manages multiple agents (workers). The orchestrator assigns tasks, tracks agent progress, and handles scheduling. This pattern simplifies design by having one control loop rather than complex peer-to-peer negotiation. It suits resource-constrained environments because it avoids the runtime cost of constant inter-agent negotiation. The downside is a single point of failure, but in our case a central controller is acceptable and easier to govern.
  * Finite-State Machines (FSM): A design where each agent’s behavior is defined by states (e.g. Idle, Running, Completed, Failed) and transitions. FSM is not a full architecture on its own, but a pattern to implement an agent’s internal logic or lifecycle. FSMs are lightweight (just state transition logic) and highly predictable. They work well for modeling agent workflows (for example, ensuring an agent moves through states like “pending → running → completed” in a controlled way). FSMs shine in simple or well-structured tasks and carry negligible overhead.
  * Goal-Oriented Planning: Agents dynamically plan sequences of actions to achieve goals (e.g. using AI planners or search algorithms). This approach, related to deliberative/BDI systems, lets agents handle complex tasks by planning ahead. The trade-off is computational cost – planning algorithms significantly increase CPU usage and memory, leading to slower responses. In a constrained environment, goal-planning can be too slow or resource-hungry unless the planning problem is very small.

**Recommended Architecture – Lightweight Modular Orchestrator:** Considering the OCI Free Tier ARM VM (4 OCPU, 24 GB RAM) constraint, the most suitable architecture is a **Modular Monolith with a Central Orchestrator and Plugin-like Agents**. In this design, a single lightweight process (monolithic deployment) contains the core logic and all agents as modules, overseen by a central orchestrator component:

  * The **Orchestrator** (or core “Agent Engine”) will coordinate agent execution. It receives workflow requests (e.g. “run Scribe agent on repo X”), initializes the appropriate agent, and manages its lifecycle. This central controller simplifies resource management – it can queue or serialize agent tasks to avoid overload, and it eliminates the overhead of inter-process communication (which a microservices approach would introduce). A centralized pattern aligns with centralized coordination in MAS and avoids the complexity of agents negotiating among themselves.
  * Each **Agent** (Scribe, Trace, Proto, etc.) is implemented as an independent module conforming to a common interface (e.g. `IAgent`). Agents are essentially **plugins**: the core system can load or instantiate an agent by type without hard dependencies. This achieves the required **decoupling** – new agents can be added as separate modules without modifying the orchestrator’s code, aside from registration. The agents don’t directly depend on each other, and communication between agents (if needed for workflows) is mediated through the orchestrator (or a shared message bus).
  * Internally, agents will use a **state machine** pattern to handle their execution states (Pending, Running, Completed, Failed, etc.). Using an FSM for each agent ensures a consistent way to track progress and enforce rules (e.g., an agent cannot move to “Completed” without passing through “Running”). This pattern is minimal in resource usage (it’s just conditional logic) and adds robustness in handling long-running tasks by making state explicit.

**Why this Architecture (vs. Alternatives):** A **Modular Monolith + Orchestrator** is optimal for OCI Free Tier primarily because of its **lightweight nature**. We avoid the overhead of multiple processes or services – everything runs in one Node.js process (on one VM), which is crucial given the limited 4 CPU cores and need to conserve memory and CPU cycles. In contrast, a microservices approach (separate service per agent) would multiply memory usage (each service duplicating runtime and libraries) and incur network overhead, which is unnecessary for a single small server.

  * **BDI or Advanced MAS frameworks:** Rejected due to complexity and overhead. BDI’s continual reasoning cycle could tax the CPU, and MAS frameworks often require message brokers or middleware. For example, a true distributed MAS might use a message queue (RabbitMQ/Kafka) for agent communication, which on OCI Free would introduce an extra service eating into CPU/RAM. Our use case doesn’t demand such complexity; the agent behaviors are defined enough that we can hard-code workflows rather than dynamically “plan” at runtime. Thus, a simpler orchestrator + state machine approach provides *just enough* structure.
  * **Goal-Oriented Planning:** Not chosen due to performance concerns. While agents like AKIS Proto do involve multiple steps (analyze requirements → generate code → test, etc.), these can be implemented with scripted workflows. We don’t need a general AI planner searching for optimal plans. By predefining the sequences (possibly in the agent’s playbook/contract), we avoid expensive planning computations, aligning better with limited CPU.
  * **Decentralized agents:** Having agents operate and communicate peer-to-peer (decentralized MAS) was also avoided. Decentralization typically requires more complex consensus or negotiation logic and complicates state tracking. On a single small server, it’s simpler and more efficient to have one controller decide what each agent does. This reduces communication overhead (function calls in one process vs. network messages) and centralizes governance (which aligns with the project’s **Agent Governance** requirement – easier to enforce global rules from one point).

In summary, the architecture will be a **modular monolithic backend** where **each agent is a plugin-like module** managed by a **central orchestrator**. This pattern is inherently lightweight and will cope well with Oracle Free Tier limits. It fully supports **agent modularity** (you can add/update an agent by plugging in a new module), and it simplifies compliance with the “Agent Playbook” and “Contract” governance – the orchestrator can load each agent’s playbook and enforce the rules uniformly. By avoiding heavy frameworks and keeping inter-component interaction to function calls or in-memory queues, we minimize CPU and memory usage, making it viable on a small ARM machine.

-----

### 2\. Optimal Technology Stack Proposal (OCI Constraints)

> Detaylı platform/OCI Free Tier kısıtları için `docs/constraints.md` dokümanını referans alın; aşağıdaki kararlar bu ilkeler doğrultusunda alındı.

Considering the above architecture on an **ARM-based OCI Free Tier** instance, we need a stack that is **efficient, ARM-compatible, and lightweight**. Let’s evaluate the current prototype stack and then propose optimizations:

  * **Runtime / Framework – Current:** Next.js 16 (Node 18) with API Routes. Next.js is a full-stack framework primarily aimed at building React UIs with SSR/CSR. Using Next.js for the backend API means carrying the weight of the Next framework even for non-UI tasks. This can be **resource-heavy** – Next.js starts multiple Node processes for its routing (App vs Pages router) and includes webpack bundles, etc., increasing memory usage. In a free-tier server with limited CPU, running a Next.js server just to serve APIs is not optimal. Next’s overhead (multiple worker processes, in-memory caches) can consume hundreds of MB of RAM and additional CPU, even under light load.
  * **Database & ORM – Current:** PostgreSQL with Prisma ORM. PostgreSQL itself can run within 24GB RAM fine, but we must be mindful if it shares the VM with the app. Prisma, while developer-friendly, is **notably heavy**. It uses a Rust engine (or WASM) that adds to binary size (\~4 MB engine) and runtime memory. Prisma’s npm package is \~15 MB vs alternative query builders around 1-2 MB, indicating a larger footprint. At startup, Prisma has to load the engine and even spin up a background thread or WebAssembly instance, which can slow down cold starts. In constrained environments or serverless, this is problematic – one report noted Prisma cold-starting could add **2+ seconds latency** due to the initialization steps. Also, Prisma’s query approach can be less efficient for large data (it may issue multiple queries instead of complex joins), meaning higher CPU if we process large result sets.
  * **Programming Language:** TypeScript on Node.js (stays the same). Node.js runs on ARM (Node 18+ has full ARM64 support), and TypeScript transpiles to JS, so that’s fine. We just need to ensure any native dependencies support ARM (most do, and Prisma’s engine does support ARM64 builds).
  * **AI Integration:** Currently using OpenRouter (which is basically HTTP calls to external AI APIs). This can remain as is – the AI calls happen over the network. We must ensure the HTTP client library and any streaming don’t bloat memory (the `ai` and `openai` libraries are okay in size). No heavy local AI is run, so this part is not a big resource concern beyond network I/O.

**Proposed Backend Framework:** Use a **lightweight Node.js web framework** instead of Next.js for the API server. Leading candidates are **Fastify**, Hono, or Express/Koa – with a preference for Fastify or Hono due to their performance and low overhead.

  * **Fastify:** A modern, fast web framework for Node. Fastify is designed for high throughput with minimal overhead – benchmarks show it can handle significantly more requests per second than Express while using less CPU and memory. It also has excellent TypeScript support and a powerful plugin system. The plugin architecture is a bonus because we can register each agent’s routes or logic as a separate plugin (aligning with our modular design). Fastify’s low overhead and built-in JSON handling mean we get efficiency out of the box – “Fastify offers better performance, handling more requests per second with lower memory usage”. Given our 4 CPUs, Fastify can utilize them (via its built-in clustering or the Node cluster module) if needed, and it will do so more efficiently than Next’s approach. Additionally, Fastify fully supports ARM (it’s pure JS with some optional native addons which have ARM builds).
  * **Hono:** An ultra-minimal web framework inspired by the web standards (often used in edge functions). Hono has a tiny footprint and extremely fast routing – it’s akin to using the Fetch API style. It’s great for “serverless” or constrained contexts. However, Fastify’s ecosystem (middlewares, plugins) and maturity might serve us better for a long-running process. Hono could be considered if we wanted to squeeze every drop of performance and our API needs are very basic. Since Fastify is already very fast and gives us structure, I’d lean toward **Fastify** for maintainability plus performance. (For comparison, Hono is touted for tiny footprint/cold start and could be a secondary choice if we find Fastify too heavy, but Fastify’s benefits likely outweigh a marginal difference in memory).
  * **(Not choosing Express/Nest):** Express is stable but slower and not as memory efficient as Fastify. NestJS is powerful but heavy (built on top of Express or Fastify with lots of decorators, reflection – unnecessary overhead in our scenario). We want minimal abstraction to keep memory down.

**Proposed ORM/Database Access:** Switch to a **lighter query builder or ORM** like Kysely or **Drizzle**, instead of Prisma, to reduce overhead on the ARM VM:

  * **Kysely:** A type-safe SQL query builder. Kysely is essentially just an abstraction over the Node SQL driver (pg for PostgreSQL). It has **no binary engine**, meaning it’s much lighter at runtime. The library size is \~2 MB vs Prisma’s 15+ MB. With Kysely, queries translate directly to SQL executed by the database driver, avoiding the heavy lifting Prisma’s engine does. This will lower memory usage and possibly CPU, especially for large queries (since Kysely can leverage joins efficiently, whereas Prisma might fetch in multiple queries). Kysely gives us full type safety for results and allows incremental adoption (we can drop down to raw SQL for complex queries if needed).
  * **Drizzle:** Another emerging ORM/query builder that is **TypeScript-native**. Drizzle generates SQL and types directly from code (no separate engine, no codegen at runtime). It’s extremely lightweight – “Performance? Drizzle is orders of magnitude faster than Prisma… Bundle size 1.5MB vs Prisma’s 6.5MB.”. Drizzle focuses on compile-time safety and has a straightforward migration system. Using Drizzle would similarly eliminate Prisma’s runtime cost. Drizzle’s API is a bit newer but it aligns well with a modular, edge-friendly approach.
  * **TypeORM or Others:** TypeORM is a full ORM with Active Record style; it’s known to have a larger memory footprint and can be slow with complex mappings. It also might not be as ARM-optimized (though it’s pure JS). Given the emphasis on **minimalism**, TypeORM doesn’t offer a significant win; it might introduce latency in loading entities and an overly OOP approach we don’t need. Simpler query builders like Kysely/Drizzle are preferable for precise control and lower overhead.
  * **No ORM (raw driver):** We could even consider using the `pg` library directly with SQL queries. This would be the leanest in terms of dependency footprint. The drawback is losing type safety and writing more boilerplate for mapping results. A compromise might be using Kysely or Drizzle for most things (to get type-safe constructs) and writing raw SQL for any performance-critical parts. Both Kysely and Drizzle allow raw SQL passthrough if needed.

**Other Stack Components:**

  * **Database:** PostgreSQL is fine as the primary data store. We should configure it with low memory settings if running on the same VM (tune `shared_buffers`, etc., for 1-2GB range or use the default which on a 24GB machine might auto-set a bit high). An alternative could be SQLite for simplicity, but given multi-user and the need for complex queries (and the existing Prisma schema), sticking to PostgreSQL is wise. If the Oracle Cloud offers an Always Free managed DB (Autonomous Database), that could offload the resource usage, but assuming it’s on the same VM, we’ll just optimize it.
  * **Authentication:** The current plan uses NextAuth (for GitHub OAuth). If we drop Next.js, we’ll need to handle OAuth flows manually or use a lighter auth library. This can be done with simple OAuth client packages or using Passport.js or similar. Since we have only GitHub (and possibly other OAuth in future), we can implement the GitHub OAuth handshake with a few routes (as indicated in the API docs provided). This doesn’t heavily impact resource usage – it’s mostly external calls. We just ensure no large in-memory session store (use JWT or short-lived tokens as in the design).
  * **AI Calls:** Continue with OpenRouter or direct OpenAI calls. These are external HTTP calls, the main consideration is to use streaming properly (so we don’t buffer huge responses in memory). The Vercel `ai` SDK or OpenAI SDK are okay – just avoid storing big responses fully if not needed. Given 24GB RAM, memory for AI responses isn’t a huge issue, but efficiency is always good.
  * **Concurrency & Task Queue:** For handling long-running agent tasks, consider using Node’s async features. We might not need a full external queue. Instead, we can use an in-memory queue and worker threads or child processes for heavier tasks. Node 18+ allows using **Worker Threads** if an agent’s task is CPU-bound (e.g., parsing a very large repository data structure). Offloading to a worker would utilize another CPU core without blocking the main event loop. This is part of Node, so no extra dependency needed. If tasks are mostly I/O (network/file), we can handle them with async/await in a single thread (Node will manage I/O asynchronously, which is very efficient). We should also leverage streaming when reading large files or network responses to keep memory steady.

**Final Tech Stack Recommendation:**

  * **Node.js (18 or 20) with Fastify** for the backend server – giving us an efficient, ARM-friendly web API layer. Fastify will host both the REST API endpoints (for UI to call) and possibly a WebSocket or event endpoint if we need to push progress updates (could be useful for agent status, though a simpler polling might do initially).
  * **TypeScript** as the language, of course, for maintainability and safety.
  * **Kysely or Drizzle** for database access instead of Prisma – dramatically reducing memory and CPU overhead for database interactions. This change specifically targets OCI’s constraints: a smaller memory footprint and faster startup will help on a low CPU machine. **(If forced to choose, Drizzle might be the top pick due to its minimalism and performance, provided it meets all feature needs.)**
  * **PostgreSQL** as the database (with potential to use an external managed service or the same VM). Ensure ARM-compatible Postgres image if using Docker – PostgreSQL has no issue on ARM64.
  * **Shared Utilities:** Use lightweight libraries for any needed functionality. For example:
      * **HTTP requests:** use native `fetch` in Node 18+ (enabled by default) or a minimal library like axios only if needed. Avoid heavy HTTP client libs.
      * **JSON Schema validation:** currently using Zod – Zod is fine (some performance hit, but our inputs aren’t massive; alternative could be `ajv` for pure JSON schema validation which is faster, but Zod is acceptable given developer convenience).
      * **Logging:** use something simple (even console or a small Winston/pino logger) but avoid overly verbose logging in production to save I/O.
  * **Frontend decoupling:** We will treat the frontend as a separate concern. The Next.js app (dashboard, etc.) can still be used **only for the UI**, or we can even host a static React build. The key is the backend (agent engine) will run as a standalone service. If keeping Next for UI, we might run it separately from the agent API to isolate resource usage (e.g., Next on one small instance and the agent engine on the ARM VM). However, given one big ARM VM is available, another approach is to serve the UI as static files (since the dashboard is not highly dynamic except for calling APIs). We could pre-build the Next app to static or use a lightweight UI stack. This is an extended consideration – but it’s clear the **backend agent engine should not be tightly coupled to Next**. For now, the assumption is Fastify will serve some API routes; the UI can be an SPA hitting those APIs. This separation ensures the backend can be optimized independently for performance.

**Net Result:** By adopting **Fastify + Drizzle (or Kysely)**, we get a highly efficient core. Fastify on ARM will easily run within a small memory footprint and handle I/O concurrently (it’s non-blocking). Drizzle/Kysely will eliminate Prisma’s heavy engine – saving CPU cycles on each query and memory on startup. The overall system will start faster and consume less RAM, which directly addresses the OCI Free Tier limits. This stack **maximizes throughput per CPU** (Fastify’s design) and **minimizes baseline memory usage**, allowing more headroom for caching or for the AI agents’ data processing.

(For example, Prisma’s 4MB engine and extra bloat would occupy memory even when idle; Fastify + Drizzle by contrast will mostly be just the Node process with relatively small libraries in memory.) **Our goal is “maximum efficiency with minimum resources”, and this stack achieves exactly that by cutting out fat and leveraging lean, proven tools.**

-----

### [cite\_start]3. Design Patterns (Revised for MCP Integration) [cite: 3]

[cite\_start]**External Integrations – MCP Client Adapter Pattern:** In the original design, we proposed an Adapter/Facade pattern to wrap external REST SDKs (like Octokit for GitHub, Jira REST API, Confluence API)[cite: 4]. [cite\_start]With the new **Model Context Protocol (MCP)** strategy, we will replace those direct API wrappers with **MCP Client Adapter** classes[cite: 5]. [cite\_start]These adapters act as clients to external MCP servers (e.g. GitHub’s MCP server and Atlassian’s Rovo MCP server) instead of directly calling proprietary APIs[cite: 6].

  * [cite\_start]**MCP Client Adapters:** For each external platform, we implement a dedicated adapter (client) that provides high-level methods (e.g. `createBranch`, `commitFile` for GitHub; `getIssue`, `createPage` for Jira/Confluence) but internally communicates with the MCP server using the MCP specifications[cite: 7]. [cite\_start]This preserves the **Facade** for our agents – they call simple methods – while delegating integration complexity to the MCP servers[cite: 8].
  * [cite\_start]**Protocol Handling:** The adapter classes encapsulate the differences in protocol[cite: 9]:
      * [cite\_start]**GitHub MCP Adapter:** Uses **JSON-RPC 2.0** calls to the GitHub MCP endpoint (hosted by GitHub at `https://api.githubcopilot.com/mcp/`)[cite: 10]. [cite\_start]All actions (creating branches, committing files, etc.) are invoked by sending a single JSON payload with a `"method"` and `"params"` to this endpoint[cite: 11]. For example, a `createBranch` call sends a JSON-RPC request like:
        ```json
        {
          "jsonrpc": "2.0",
          "method": "github/createBranch",
          "params": {
            "owner": "<repo_owner>",
            "repo": "<repo_name>",
            "branchName": "<new_branch>",
            "baseSha": "<commit_sha>"
          },
          "id": "1"
        }
        ```
        [cite\_start]The adapter will construct such payloads and parse the JSON-RPC responses[cite: 23].
      * [cite\_start]**Jira/Confluence MCP Adapter:** Uses **RESTful HTTP endpoints** exposed by Atlassian’s Rovo MCP server[cite: 24]. [cite\_start]The adapter will call specific URLs (e.g. `POST https://api.atlassian.com/mcp/v1/jira/issue` to create an issue, `GET https://api.atlassian.com/mcp/v1/jira/issue/{key}` to retrieve an issue, or similar endpoints for Confluence pages)[cite: 24]. [cite\_start]Under the hood, the Atlassian MCP server bridges to Jira and Confluence Cloud data, so our adapter just needs to format HTTP requests and handle JSON responses[cite: 25].
  * [cite\_start]**Authorization & Tokens:** Each MCP client adapter handles auth via a **Bearer token** in request headers[cite: 27]:
      * [cite\_start]**GitHub:** We will leverage our existing GitHub App integration[cite: 28]. [cite\_start]Before an agent runs, the orchestrator (or an Auth module) obtains a short-lived installation token (JWT) for our GitHub App[cite: 29]. [cite\_start]The `GitHubMCPService` adapter receives this token and includes `Authorization: Bearer <token>` in its requests[cite: 30]. [cite\_start]This token grants the MCP server the needed repo permissions for that installation[cite: 31].
      * [cite\_start]**Atlassian (Jira/Confluence):** We will ask users to provide an Atlassian API token (from their Jira/Confluence account settings)[cite: 32]. [cite\_start]Our platform will store this token (encrypted) per user or workspace[cite: 33]. [cite\_start]The `JiraMCPService` (and `ConfluenceMCPService`) will use this token as a Bearer auth header on each call[cite: 34]. [cite\_start](Note: Atlassian’s official Rovo MCP uses an OAuth 2.1 flow requiring an interactive login[cite: 35]. [cite\_start]To simplify integration, we opt for a direct API token approach, which is supported by some open-source MCP servers for Atlassian[cite: 35].)
  * [cite\_start]**Encapsulation of Complexity:** This MCP-based adapter pattern aligns with the "USB-C for AI" vision of MCP[cite: 36]. [cite\_start]Our agents no longer need to handle multiple APIs or SDKs; they use a unified interface[cite: 36, 37]. [cite\_start]The MCP adapters abstract away the low-level details (endpoints, auth, JSON formats), providing a clean contract to agents[cite: 37]. [cite\_start]This reduces custom glue code and integration complexity, and improves scalability as we add more tools[cite: 38]. [cite\_start]For example, when `ScribeAgent` needs to commit a file, it calls `githubMCP.commitFile(...)` without worrying about HTTP requests or GitHub’s REST details – the adapter handles that via MCP[cite: 38]. [cite\_start]If in the future we integrate another system (say Trello or Slack), we would simply add another MCP adapter, rather than writing a new API integration from scratch[cite: 39].
  * [cite\_start]**Stateful Session Consideration:** MCP communications are typically session-based (especially JSON-RPC)[cite: 40]. [cite\_start]Our adapter instances may maintain a session ID or connection if required by the protocol (for example, some MCP servers support persistent sessions or streaming)[cite: 41]. [cite\_start]The design will allow the orchestrator to initialize a session per agent execution if needed, or use stateless calls for simple request/response[cite: 42]. [cite\_start]The adapter classes can manage any required initialization handshakes (like a JSON-RPC `initialize` call) transparently[cite: 43].

[cite\_start]**Other Patterns (Unaffected):** The introduction of MCP mainly impacts the external services layer[cite: 44]. [cite\_start]Core architecture decisions from v1 remain unchanged: The central **Orchestrator** pattern still governs agent workflows and tool invocations[cite: 45].

  * [cite\_start]**Agent structure** (e.g. each agent encapsulating its logic with an `execute` method) remains the same, except they now use MCP service adapters instead of direct API services[cite: 46].
  * [cite\_start]Internal patterns like using the **Strategy pattern** for different agent behaviors, or domain-driven organization, continue as before[cite: 47]. [cite\_start]We are **enhancing the Adapter pattern** usage, not removing it – we’ve simply changed the adapter’s target from REST APIs to MCP servers[cite: 48].

-----

### [cite\_start]4. Directory Structure (Revised for MCP Integration) [cite: 49]

[cite\_start]We will adjust the `src/services/` layer to reflect the MCP client approach[cite: 50]. [cite\_start]The goal is to clearly separate MCP-related clients and any common utilities (like HTTP handling)[cite: 51]. [cite\_start]Below is the updated structure for the services layer[cite: 52]:

[cite\_start]`src/services/mcp/` - Top-level directory for MCP integration logic[cite: 53].

  * [cite\_start]`adapters/` - Contains the MCP client adapter classes for each external system[cite: 55]:
      * `GitHubMCPService.ts` - Adapter client for GitHub’s MCP server. [cite\_start]Implements methods like `createBranch(repo, branchName, baseSha)`, `commitFile(repo, filePath, content)` etc., and internally POSTs JSON-RPC payloads to the GitHub MCP endpoint[cite: 57, 58].
      * `JiraMCPService.ts` - Adapter for Jira via Atlassian’s Rovo MCP. [cite\_start]Provides methods such as `getIssue(issueKey)`, `createIssue(projectKey, fields)`, etc., making HTTP calls (GET/POST) to the appropriate `/mcp/v1/jira/...` endpoints[cite: 59, 60].
      * `ConfluenceMCPService.ts` - Adapter for Confluence via Rovo MCP. [cite\_start]Provides methods like `getPage(pageId)` or `createPage(spaceKey, title, content)`, calling `/mcp/v1/confluence/...` endpoints under the hood[cite: 61].
      * [cite\_start](Optional: If Jira and Confluence share a lot of logic, we might combine them into a single `AtlassianMCPService.ts` with methods for both products. However, keeping them separate clarifies their interfaces and aligns with likely separate usage in agents[cite: 62].)
  * [cite\_start]`types.ts` (or interfaces) - We can define common types or an interface for MCP adapters if needed[cite: 63]. [cite\_start]For example, an interface `IMCPService` could define common properties like an `httpClient` or `authToken`[cite: 64]. [cite\_start]Given the divergence in protocols, we may not need a strict interface for all MCP services, but shared request/response type definitions can live here[cite: 65].
  * [cite\_start]`BaseMCPService.ts` (optional) - An abstract class that stores common functionality (e.g. holds the base URL and token, plus helper methods to send requests via the HttpClient)[cite: 66]. [cite\_start]`GitHubMCPService` and others could extend this to avoid duplication in setting headers or error handling[cite: 67].

[cite\_start]`src/services/http/` - (New) Utility for making HTTP requests[cite: 68]:

  * [cite\_start]`HttpClient.ts` - A lightweight HTTP client wrapper (using `fetch` or a library like Axios)[cite: 69]. [cite\_start]Its responsibility is to perform HTTP calls with proper headers and to handle low-level concerns (network errors, timeouts)[cite: 70]. [cite\_start]The MCP adapters will use this for all external calls[cite: 71]. [cite\_start]For example, `HttpClient.get(url, token)` would attach the `Authorization: Bearer <token>` header and perform a GET, and similarly for `post(url, body, token)` for JSON payloads[cite: 72]. [cite\_start]This keeps authentication injection standardized in one place[cite: 73].
  * [cite\_start]**Rationale:** By centralizing HTTP calls, we ensure consistency (e.g., always sending the correct auth header, content-type, etc.) and it’s easier to swap implementation (if we switch to a different HTTP lib or need retries logic globally)[cite: 74].

[cite\_start]`src/services/...` (other) - Other service classes not related to external MCP can remain[cite: 75]. [cite\_start]For instance, if we have a `LocalDBService` or others, those stay as is[cite: 76]. [cite\_start]Notably, the previous `GitHubService`, `JiraService`, `ConfluenceService` (if any) that wrapped REST APIs are now deprecated in favor of the MCP adapters[cite: 77].

[cite\_start]**Integration with Orchestrator/Agents:** The orchestrator or agent factory will be responsible for providing the appropriate credentials to these MCP services: We might have an **Auth helper** (within orchestrator or a new `src/services/auth/`) that obtains the GitHub App installation token and retrieves stored Atlassian tokens[cite: 78]. [cite\_start]These are then passed when instantiating the MCP service classes[cite: 79]. [cite\_start]For example, `new GitHubMCPService(githubToken)`... [cite: 80] [cite\_start]We lean towards injecting tokens for clarity and testability[cite: 81].

  * [cite\_start]The directory `src/agents/` (from v1) remains structured per agent, but now agents will import from `src/services/mcp/adapters/` instead of the old services[cite: 81]. [cite\_start]This isolates the change largely to the services layer – agent code just uses a different service class with a similar interface[cite: 82].

[cite\_start]**Example Directory Layout:** [cite: 84]

```
src/
 ├── agents/
 [cite_start]│    ├── ScribeAgent.ts      # (unchanged agent logic, aside from using new services) [cite: 87, 88]
 [cite_start]│    └── TraceAgent.ts       # etc. [cite: 90]
 [cite_start]├── services/ [cite: 92]
 [cite_start]│    ├── http/ [cite: 93]
 [cite_start]│    │    └── HttpClient.ts        # HTTP utility for external calls [cite: 94, 95]
 [cite_start]│    └── mcp/ [cite: 96]
 [cite_start]│         ├── adapters/ [cite: 97]
 [cite_start]│         │    ├── GitHubMCPService.ts     # GitHub MCP client adapter [cite: 98, 99]
 [cite_start]│         │    ├── JiraMCPService.ts       # Jira MCP client adapter [cite: 100]
 [cite_start]│         │    └── ConfluenceMCPService.ts # Confluence MCP client adapter [cite: 100]
 [cite_start]│         ├── BaseMCPService.ts    # (optional abstract class for adapters) [cite: 101, 103]
 [cite_start]│         └── types.ts            # (shared types/interfaces for MCP calls) [cite: 102, 103]
 [cite_start]└── (other folders like orchestrator, db, etc.) [cite: 104]
```

[cite\_start]This structure cleanly separates MCP integrations[cite: 105]. [cite\_start]The naming makes it clear these are clients to external MCP servers[cite: 105]. [cite\_start]If new integrations are added (say a `GitLabMCPService` or others), we simply add another file under `mcp/adapters/`[cite: 106]. [cite\_start]This organization also makes it easier to test each adapter in isolation by mocking HTTP calls[cite: 107].

-----

### [cite\_start]5. Revised Implementation Example – ScribeAgent with MCP [cite: 108]

[cite\_start]To illustrate how the new MCP-based services are used, let’s revisit the `ScribeAgent.execute()` example from v1[cite: 109]. [cite\_start]We will update it so that instead of using the old `GitHubService` or `ConfluenceService`, it uses our new MCP adapter services[cite: 110]. [cite\_start]This highlights that from the agent’s perspective, little changes except the class names and possibly the way we handle tokens[cite: 111].

[cite\_start]Suppose `ScribeAgent` is responsible for documenting new features: it creates a branch in GitHub, commits a README file, and creates a Confluence page with the content[cite: 112]. [cite\_start]Below is a simplified example of how `ScribeAgent` might use the new services[cite: 113]:

```typescript
[cite_start]// src/agents/ScribeAgent.ts (revised) [cite: 114]
[cite_start]import { GitHubMCPService } from '@/services/mcp/adapters/GitHubMCPService'; [cite: 115]
[cite_start]import { ConfluenceMCPService } from '@/services/mcp/adapters/ConfluenceMCPService'; [cite: 115, 116]

[cite_start]class ScribeAgent extends BaseAgent { [cite: 117]
  [cite_start]async execute(taskContext: ScribeTaskContext): Promise<void> { [cite: 118]
    [cite_start]// 1. Prepare authentication tokens (fetched via orchestrator or config) [cite: 119]
    [cite_start]const ghToken = await this.orchestrator.getGitHubInstallationToken(taskContext.repoOwner); [cite: 119, 120]
    [cite_start]const atlassianToken = await this.orchestrator.getAtlassianApiToken(taskContext.projectId); [cite: 121, 122]
    
    [cite_start]// 2. Initialize MCP service clients with tokens [cite: 124]
    [cite_start]const githubMCP = new GitHubMCPService(ghToken); [cite: 124]
    [cite_start]const confluenceMCP = new ConfluenceMCPService(atlassianToken); [cite: 125]
    
    [cite_start]// 3. Use GitHub MCP adapter to create a new branch and commit a file [cite: 126]
    [cite_start]const { owner, repo, baseBranch } = taskContext; [cite: 126]
    [cite_start]const newBranch = `docs/${taskContext.featureName}`; [cite: 127]
    [cite_start]await githubMCP.createBranch(owner, repo, newBranch, taskContext.baseCommitSha); [cite: 128, 129]
    [cite_start]console.log(`Created branch ${newBranch} on GitHub.`); [cite: 130]
    
    [cite_start]// Prepare content for README.md commit [cite: 131]
    [cite_start]const filePath = 'README.md'; [cite: 132]
    const fileContent = generateDocumentationContent(taskContext); [cite_start]// assume this creates markdown text [cite: 133, 134]
    [cite_start]const commitMessage = `docs: add README for ${taskContext.featureName}`; [cite: 135]
    [cite_start]await githubMCP.commitFile(owner, repo, newBranch, filePath, fileContent, commitMessage); [cite: 135, 136]
    [cite_start]console.log(`Committed ${filePath} to ${newBranch} branch on GitHub.`); [cite: 137]
    
    [cite_start]// 4. Use Confluence MCP adapter to create a documentation page [cite: 138]
    const spaceKey = taskContext.confluenceSpace; [cite_start]// e.g., "PROJDOC" [cite: 138, 139]
    [cite_start]const pageTitle = `Feature: ${taskContext.featureName}`; [cite: 139]
    [cite_start]await confluenceMCP.createPage(spaceKey, pageTitle, fileContent); [cite: 139]
    [cite_start]console.log(`Created Confluence page titled "${pageTitle}" in space ${spaceKey}.`); [cite: 140]
    
    [cite_start]// 5. (Optional) If needed, link the Confluence page to a Jira issue: [cite: 141]
    [cite_start]if (taskContext.jiraIssueKey) { [cite: 141]
      [cite_start]const jiraAdapter = new JiraMCPService(atlassianToken); [cite: 142]
      await jiraAdapter.addComment(taskContext.jiraIssueKey, 
        [cite_start]`Documentation for this feature: [${pageTitle}|${taskContext.confluencePageUrl}]`); [cite: 142, 143]
      [cite_start]console.log(`Linked documentation in Jira issue ${taskContext.jiraIssueKey}.`); [cite: 144, 145]
    }
    
    [cite_start]// 6. Finalize [cite: 147]
    [cite_start]console.log('ScribeAgent execution complete. All assets created via MCP integrations.'); [cite: 148, 149]
  }
[cite_start]} [cite: 151]
```

[cite\_start]**What Changed:** In this revised example, `ScribeAgent` no longer calls `GitHubService` or uses the Octokit library directly[cite: 152]. [cite\_start]Instead, it constructs a `GitHubMCPService` with the appropriate token and calls high-level methods (`createBranch`, `commitFile`)[cite: 153]. [cite\_start]Under the hood, those will perform JSON-RPC calls to GitHub’s MCP server, which in turn calls GitHub’s API to do the work[cite: 154]. [cite\_start]Similarly, `ConfluenceMCPService.createPage` will make an HTTP request to Atlassian’s MCP endpoint to create a Confluence page[cite: 155]. [cite\_start]The agent’s code is clean and declarative – it doesn’t manage HTTP requests or parse responses; it just uses our domain-specific methods[cite: 156, 157].

[cite\_start]**Token Management:** The example shows tokens being retrieved via `orchestrator.getGitHubInstallationToken(...)` and `orchestrator.getAtlassianApiToken(...)`[cite: 159]. [cite\_start]In practice, the orchestrator (or a dedicated Auth service) would handle[cite: 160]:

  * [cite\_start]**GitHub Token:** Using our GitHub App credentials to generate an installation token JWT for the repository’s installation ID[cite: 160]. [cite\_start]This token is injected into `GitHubMCPService` and typically remains valid for the duration of the agent run[cite: 161].
  * [cite\_start]**Atlassian Token:** Looking up the stored API token for the user or project context (which would have been provided and saved earlier)[cite: 162]. [cite\_start]This token is passed to both Confluence and Jira adapters as needed[cite: 163]. (If the token is missing or expired, the platform might prompt the user or initiate an OAuth flow, but in our strategy we assume a valid token is stored) [cite\_start][cite: 164].

[cite\_start]**Impact on Agents:** From an architectural viewpoint, agents like Scribe or Trace will be simpler to implement: They do not need to handle pagination, rate limits, or raw HTTP details of external APIs; the MCP servers handle a lot of that complexity[cite: 165, 166]. [cite\_start]For example, if `getIssue` returns a large payload, the Atlassian MCP might stream or truncate it appropriately – the adapter can just return what it gets[cite: 166].

  * [cite\_start]Agents can focus on **logic and orchestration** (deciding when to create a branch or page, how to handle errors returned from the adapter, etc.) rather than low-level integration code[cite: 167].

[cite\_start]**Error Handling and Logging:** Our MCP adapters will translate errors from the MCP server into exceptions or results for the agent[cite: 168]: e.g., if `createBranch` fails because the branch exists, the GitHub MCP server might return a JSON-RPC error; [cite\_start]`GitHubMCPService.createBranch()` can catch that and throw a meaningful exception (or return a falsey result)[cite: 169]. [cite\_start]The agent can then decide to log or handle it (maybe skip branch creation if already exists)[cite: 170].

  * [cite\_start]We will instrument these adapters with logging around requests and responses (in development mode) to ease debugging[cite: 171]. [cite\_start]Since the MCP calls are outbound HTTP, our platform’s logs will capture any failures to connect or authorization issues[cite: 172].

[cite\_start]In summary, **the revised design fully embraces MCP for external integrations**[cite: 173]. [cite\_start]By updating the Adapter pattern to target MCP servers, we achieve a more standardized and future-proof integration layer[cite: 174]. [cite\_start]Our directory structure cleanly organizes this new layer, and the agent example demonstrates that the overall agent orchestrations remain intuitive while the heavy lifting is handled by MCP adapters[cite: 175]. [cite\_start]This positions the AKIS Platform to easily incorporate additional tools and services going forward, simply by adding their MCP adapters, in line with the MCP’s vision of interoperability and reduced integration complexity[cite: 176].

-----

### 6\. OCI Free Tier Efficiency Justification

Finally, let’s justify why this proposed architecture and stack are superior for the OCI Free Tier environment compared to a naïve or architecture-less approach:

**Resource Efficiency through Modular Monolith:** By choosing a modular monolith (single process) design, we avoid the overhead of running multiple services. On a 4 OCPU / 24GB ARM machine, a single Node.js process can be quite efficient, especially if it uses async I/O for most tasks. The orchestrator/agent model within one process means function calls and in-memory data sharing, which are far cheaper than inter-process or network communication. If we had gone for microservices (e.g., separate container for each agent and database), we’d have significant duplication of overhead – multiple Node runtimes, more memory usage per service, and network latency between them. The monolith ensures **minimal idle overhead**, which is crucial on limited CPU. The system can also utilize Node’s clustering or worker threads to use all 4 cores when needed, without deploying separate apps.

**Lean Tech Stack vs. Heavy Frameworks:** Our stack intentionally drops heavyweight components:

  * **Next.js** (with its SSR and multi-process model) is removed from the backend. This alone saves a lot of memory and CPU. As referenced, Next.js can spawn additional processes and use a lot of RAM even for moderate apps. Instead, **Fastify** gives us just what we need (routing, middleware) with optimal performance. Fastify’s low overhead means more CPU is available to actual agent tasks rather than framework bookkeeping. This directly addresses the Free Tier limits – **Fastify on Node can handle high throughput on small machines**, whereas Next.js could struggle or simply waste resources on unused features (like rendering, if our focus is backend logic).
  * **Prisma** is replaced with **Drizzle/Kysely**, eliminating the Rust engine runtime. This reduces memory usage and startup time. On an always-on server, Prisma’s startup might not be a recurring cost, but its runtime memory (due to the engine and possibly caching) is still a factor. A lean query builder uses the Node PG driver directly, which is a thin layer in C and quite optimized. Also, Prisma’s approach of sometimes doing multiple queries for relations could double CPU work for the same outcome, which we avoid by writing more optimal SQL via Kysely/Drizzle. Overall, the database operations become more efficient – important when the CPU is just 4 cores. As an example of overhead: **Prisma’s engine and abstraction can cause up to 2x slower queries compared to raw or Kysely, and increased memory usage**. Removing that overhead means the limited CPU can handle more agent tasks instead of ORM translation.

**Scalability and Concurrency on Low Specs:** The architecture uses asynchronous operations and can easily incorporate a job queue if needed (e.g., using Node’s event loop or a lightweight queue library). This means even if one agent is waiting on I/O (network calls to GitHub or AI), it doesn’t block others – Node can interleave other tasks in the event loop. A poorly structured system (e.g., one that does synchronous or blocking operations or sequentially processes everything) might not utilize the CPU well and would be slower. By design, our orchestrator can kick off multiple agents up to what the hardware can handle. We will, of course, put limits (perhaps not run more than 2 heavy agents in parallel to avoid overload), but the point is we have control. A random collection of scripts without an architecture might end up doing things in a blocking way or duplicating work. Our structured approach **maximizes throughput per CPU** by using proven patterns (async, non-blocking I/O, shared services).

**Maintainability leads to Performance:** While it might not be obvious, a well-architected system tends to perform better in the long run than a messy one. If we had “just a bunch of classes/functions” with no clear architecture, the codebase would likely see a lot of duplication and ad-hoc solutions. For instance, without a central orchestrator, each agent might implement its own scheduling or error handling. That could lead to inefficiencies (maybe two agents both polling the same API separately, etc.). In our design, the orchestrator can coordinate and possibly optimize across agents (for example, if Scribe and Trace both needed to scan the same repository, the orchestrator could avoid doing it twice by sharing results). A fragmented design wouldn’t allow such optimization easily. By having clear separation and contracts, we ensure that improvements can be made in one place and benefit all agents. This **systemic efficiency** is only possible with a coherent architecture.

**Memory Footprint Benefits:** The use of design patterns like Singleton/Shared services means we don’t instantiate multiple heavy objects. For example, without planning, one might create a new Octokit GitHub client every time an agent runs. Instead, we can maintain a single authenticated GitHubClient (or a small pool if necessary) reused by all agents, saving memory and avoiding repeated auth handshakes. Similarly, the AI service can keep some configuration loaded once. This reuse is facilitated by the structured `services/` layer. It’s easier to spot and implement such optimizations when the code is organized. On a low-memory environment, avoiding duplication is key. While 24 GB RAM is plenty for our current scale, the principle helps if we ever scale down or run multiple apps.

**Governance and Error Handling:** The requirement of governance (Agent Contracts, rules) implies we need a robust way to enforce rules. In a chaotic architecture, enforcing a rule (say, “all outputs must have citations”) would mean putting checks in many places. That is error-prone and can lead to missed spots or inconsistent enforcement. Our approach centralizes that, which indirectly affects reliability – a more reliable system avoids waste (e.g., an agent failing due to a missed rule could waste computation that we then have to repeat). With strict state management and validation via patterns (State, Strategy for rules), we catch errors and invalid states early, preventing runaway processes or corrupted operations that could hog resources. For instance, our state machine won’t allow an agent to be marked “completed” if it never ran – such guardrails protect against logic bugs that could otherwise cause high CPU (imagine a bug causing an infinite loop if an agent is thought to be running when it’s not – our state check would have thrown an error instead).

**ARM Compatibility:** All chosen components run smoothly on ARM. Node.js itself runs natively on ARM64. Fastify is pure JS (with some optional native addons for performance, which have ARM builds available). Drizzle and Kysely are also pure TypeScript/JS. In contrast, some older or less common libraries might not ship ARM binaries and would need compile (which could be an issue on Alpine images, etc., but we’ve avoided those). Prisma, for example, does provide ARM binaries now, but earlier it was an issue – by removing that, we sidestep any such edge case. Our build and deployment will thus be straightforward on the OCI ARM VM.

**Comparison with “no architecture” approach:** If one were to build AKIS as just a collection of functions triggered by endpoints (for example, a Next.js API route for each action, calling some scripts), it might work initially, but it would become unmanageable and likely inefficient:

  * Without an orchestrator, coordinating multi-step workflows (like Proto’s end-to-end prototyping which might involve chaining Scribe and Trace functionality) would be difficult. You might end up hard-coding sequence flows in an ad hoc way, leading to duplicated calls or unnecessary waiting.
  * Lack of a plugin structure means adding a new agent might involve touching many files (routing, new logic intertwined), increasing risk of mistakes. Mistakes can lead to crashes or memory leaks on a small server (and in a constrained environment, a single memory leak can quickly exhaust RAM).
  * No clear separation of integrations means each agent might implement its own API calls. That duplicates code for, say, GitHub commits – increasing the chance of inconsistent usage or failing to reuse a network connection. Our shared services can manage one connection or throttle calls globally if needed (helping to stay within rate limits – which is also a resource constraint albeit on the API side).

In essence, our **proposed architecture is both more efficient and more robust**. Efficiency comes from using **lightweight components** and **structured design** that avoids wasteful practices. Manageability (governance, modularity) ensures the system can be tuned and extended without devolving into inefficient hacks. On OCI Free Tier, where we can’t just scale up hardware at will, this careful design is the difference between a system that runs smoothly and one that constantly hits resource ceilings.

**Conclusion:** By following this architecture and stack, AKIS Platform's backend will be a well-oiled machine running within the tight OCI Free Tier budget. It leverages efficient use of CPU through asynchronous orchestration, keeps memory usage in check by eliminating bloat, and remains flexible for future growth. This approach will outperform a naive implementation that might squander CPU cycles and memory – making it not just a cleaner solution, but a **practical necessity** to meet the project's ambitious goals on minimal infrastructure.

-----

### 7. Authentication & Authorization Architecture

AKIS Platform implements a **JWT-based authentication system** with a **multi-step user onboarding flow** inspired by Cursor's sign-in/sign-up experience. This design prioritizes **UX clarity**, **security**, and **future OAuth extensibility** while maintaining minimal resource overhead on OCI Free Tier.

#### 7.1 Authentication Strategy

**Primary Method:** Email + Password

- **Rationale:** Simple, no external dependencies, works offline-first for dev
- **Password Security:** bcrypt hashing (12 rounds) via `@node-rs/bcrypt` (ARM-compatible Rust binary)
- **Token Management:** Stateless JWT stored in HTTP-only cookies (`akis_session`)
- **Session Duration:** 7 days (configurable via `JWT_EXPIRES_IN` env var)

**Future Methods (S0.4.2+):**

- **Google OAuth 2.0:** For users preferring social login
- **GitHub OAuth:** Aligned with developer-centric product positioning
- **Apple Sign In:** Optional, if iOS/macOS audience grows

#### 7.2 Multi-Step User Flows

Unlike traditional single-page signup, AKIS adopts a **progressive disclosure** pattern:

**Signup Flow (5 steps):**

```
1. Name + Email         → POST /api/auth/signup/start
2. Create Password      → POST /api/auth/signup/password
3. Email Verification   → POST /api/auth/verify-email (6-digit code)
4. Beta Notice          → (Frontend-only informational screen)
5. Data Sharing Consent → POST /api/auth/update-preferences
```

**Login Flow (2 steps):**

```
1. Email Check          → POST /api/auth/login/start
   (Backend validates user exists, returns userId)
2. Password Entry       → POST /api/auth/login/complete
   (Backend verifies password, issues JWT)
```

**Design Benefits:**

- **Reduced Cognitive Load:** One decision per screen (Hick's Law)
- **Graceful Error Handling:** Step 1 login can guide users to signup if email not found
- **Email Verification Decoupled:** Users aren't blocked from setting password before verifying
- **Consent Clarity:** Data sharing presented after account creation, not buried in TOS

#### 7.3 User Account States

```typescript
enum UserStatus {
  PENDING_VERIFICATION = 'pending_verification',  // Email not yet verified
  ACTIVE = 'active',                              // Can use platform
  DISABLED = 'disabled',                          // Admin-disabled
  DELETED = 'deleted'                             // Soft-deleted
}
```

**State Machine:**

```
[Signup Start] → PENDING_VERIFICATION
                      ↓ (email code verified)
                   ACTIVE
                      ↓ (admin or self-action)
                 DISABLED / DELETED
```

**Critical Rules:**

- Users in `PENDING_VERIFICATION` cannot log in (redirect to verification flow)
- `DISABLED` users see "Account suspended" message
- `DELETED` users are soft-deleted (data retained for audit, marked as deleted)

#### 7.4 JWT Structure & Security

**Token Payload:**

```json
{
  "sub": "user-uuid",        // Subject (user ID)
  "email": "user@example.com",
  "name": "User Name",
  "iat": 1638360000,         // Issued at
  "exp": 1638964800          // Expires at (7 days)
}
```

**Signing:** HMAC-SHA256 with `JWT_SECRET` (256-bit minimum, from env)

**Cookie Configuration:**

```typescript
{
  httpOnly: true,        // No JS access (XSS mitigation)
  secure: true,          // HTTPS only (prod)
  sameSite: 'lax',       // CSRF protection
  path: '/',
  maxAge: 7 * 24 * 3600 * 1000  // 7 days
}
```

**Validation on Every Request:**

- Protected routes use `requireAuth` middleware
- Middleware verifies:
  1. Cookie exists
  2. JWT signature valid
  3. Token not expired
  4. User exists in DB and status is `ACTIVE`
- If any check fails → 401 Unauthorized, cookie cleared

#### 7.5 OAuth Integration (Future State – S0.4.2)

**Architecture Pattern:** **Adapter per Provider**

```
src/services/auth/
  ├── oauth/
  │   ├── GoogleOAuthAdapter.ts   # Handles Google-specific flow
  │   ├── GitHubOAuthAdapter.ts   # Handles GitHub-specific flow
  │   └── IOAuthAdapter.ts         # Interface for OAuth providers
  ├── password.ts                   # bcrypt utilities
  └── jwt.ts                        # JWT sign/verify
```

**OAuth Flow (Planned):**

```
1. User clicks "Continue with Google"
   → GET /api/auth/oauth/google
   → Redirect to Google consent screen

2. User approves
   → Callback: GET /api/auth/oauth/google/callback?code=...
   → Backend exchanges code for access token
   → Fetch user profile (email, name)
   → If email exists: link account; else: create user
   → Generate JWT, set cookie
   → Redirect to /dashboard
```

**Account Linking Logic:**

- If OAuth email matches existing user email (verified): Link accounts
- If email unverified: Require verification before linking
- Store OAuth tokens in separate `oauth_accounts` table (refresh tokens for future API calls)

**Why Not Now?**

- Adds dependency on external OAuth servers (complicates dev environment)
- Requires managing OAuth app credentials (secrets, redirect URIs)
- Multi-step email/password flow is sufficient for MVP
- OAuth tokens need secure storage + refresh logic → deferred to avoid scope creep

#### 7.6 Authorization Model (Current & Future)

**Current (S0.4.4):** **No RBAC**

- All authenticated users have equal permissions
- Can create/view their own jobs and agents
- No admin-only features yet

**Future (S0.5+):** **Role-Based Access Control (RBAC)**

```typescript
enum Role {
  USER = 'user',       // Default: can use agents, view own jobs
  ADMIN = 'admin'      // Can view all jobs, manage users, configure system
}

// Middleware: requireRole('admin')
async function requireRole(role: Role) {
  // Check request.user.role >= role
}
```

**Planned Permissions:**

- `USER`: Create jobs, view own jobs, configure own agents
- `ADMIN`: View all jobs, delete jobs, disable users, view system metrics

#### 7.7 Security Hardening

**Current Measures:**

- **Rate Limiting:** 100 req/min global (via `@fastify/rate-limit`)
- **CORS:** Locked to `CORS_ORIGINS` env (prod: specific frontend domain)
- **Helmet:** Security headers via `@fastify/helmet`
- **HTTPS-only cookies** in production
- **Password strength:** Min 8 chars (enforced at API + UI)

**Future Hardening (S0.5+):**

- **Per-endpoint rate limits:** 5 login attempts per 15min per IP
- **Refresh tokens:** Rotate JWT every 1 hour (stored in DB, revocable)
- **2FA (optional):** TOTP-based (Google Authenticator)
- **Session revocation:** Add `sessions` table for centralized logout
- **Audit logging:** Log all auth events (login, failed attempts, logouts)

#### 7.8 Integration with Agent Orchestrator

**Auth Context in Agent Execution:**

When a user triggers an agent job (e.g., "Run Scribe on my repo"):

1. API endpoint validates JWT → extracts `userId`
2. Orchestrator receives `userId` in job context
3. Orchestrator fetches user's linked integrations (GitHub token, Jira token)
4. Orchestrator passes integration tokens to agent's MCP adapters
5. Agent executes with user's permissions (e.g., commits to GitHub as user's GitHub App installation)

**Token Storage for Integrations:**

- GitHub: Installation token (short-lived, generated per job via GitHub App)
- Jira/Confluence: User-provided API token (stored encrypted in `integration_credentials` table)
- OpenRouter: Platform-wide API key (not per-user, for now)

**Future:** Per-user AI budgets (track token usage per user, rate limit heavy users)

#### 7.9 Data Privacy & Consent

**Data Sharing Consent Flag:**

- `dataSharingConsent: boolean | null` on User model
- `null` = not yet asked (new users)
- `true` = user opted in to telemetry/improvement data
- `false` = user opted out

**Consent Flow:**

- Shown **after email verification** (during first login or signup)
- Full-screen or modal: "Help improve AKIS by sharing anonymized usage data"
- User can change preference later in Settings → Privacy

**What Data is Shared (if consented):**

- Agent job types and counts (no code content)
- Feature usage (which pages visited, buttons clicked)
- Error logs (anonymized stack traces)

**Never Shared (even with consent):**

- User code/repositories
- Jira ticket content
- Confluence page content
- Integration tokens

#### 7.10 Error Handling & User Messaging

**Auth Errors (Human-Readable):**

| Scenario | Backend Response | Frontend Message |
|----------|------------------|------------------|
| Email already registered | `409 EMAIL_IN_USE` | "This email is already in use. [Sign in instead?]" |
| Wrong password | `401 INVALID_CREDENTIALS` | "Incorrect email or password." |
| Email not verified | `403 EMAIL_NOT_VERIFIED` | "Please verify your email. [Resend code?]" |
| Invalid verification code | `400 INVALID_CODE` | "Code is incorrect or expired. Try again." |
| Too many attempts | `429 TOO_MANY_ATTEMPTS` | "Too many attempts. Wait 15 minutes." |
| Session expired | `401 UNAUTHORIZED` | (Auto-redirect to login) |

**No Information Leakage:**

- Login step 1: If email not found → "No account with this email" (clear, not "invalid")
- Login step 2: If password wrong → "Incorrect email or password" (generic, to avoid user enumeration)

#### 7.11 Technology Choices (Auth-Specific)

| Component | Library | Rationale |
|-----------|---------|-----------|
| Password Hashing | `@node-rs/bcrypt` | Fast Rust binding, ARM-compatible, secure defaults (12 rounds) |
| JWT | `jose` (Node built-in as of v19) or `jsonwebtoken` | Lightweight, standard-compliant, no dependencies |
| Cookie Management | `@fastify/cookie` | Built-in to Fastify, minimal overhead |
| Email Verification | Console log (dev), SendGrid (prod future) | Dev-friendly now, scalable later |
| Rate Limiting | `@fastify/rate-limit` | Memory-efficient, IP-based, easy config |

**No Heavy Auth Frameworks:**

- Avoided NextAuth (tightly coupled to Next.js, which we dropped)
- Avoided Passport (overkill for our needs, adds complexity)
- Custom implementation ensures full control and minimal footprint (critical for OCI constraints)

#### 7.12 Testing Strategy (Auth)

**Unit Tests:**

- `hashPassword()` + `verifyPassword()` correctness
- `sign()` + `verify()` JWT roundtrip
- Email validation regex

**Integration Tests:**

- Signup flow: start → password → verify → login
- Login flow: email check → password → dashboard
- Session validation (valid/expired/missing token)
- Logout clears cookie

**E2E Tests (Future):**

- Full user journey: Signup → verify email → beta notice → consent → dashboard
- OAuth flow with mocked provider

#### 7.13 Migration Plan (Existing → Target)

**Phase 1 (S0.4.4 – This PR):**

- ✅ Create new multi-step endpoints
- ✅ Keep legacy `/signup` and `/login` for backward compatibility
- ✅ Update frontend to use new flow
- ✅ Add email verification stub (console log codes)

**Phase 2 (S0.4.2 – OAuth):**

- Remove legacy endpoints
- Implement Google/GitHub OAuth adapters
- Add real email delivery (SendGrid)
- Per-endpoint rate limiting

**Phase 3 (S0.5 – Advanced Security):**

- Refresh tokens
- RBAC (roles)
- 2FA (optional)
- Session revocation

#### 7.14 References

- **Auth Documentation:** `backend/docs/Auth.md` (detailed implementation guide)
- **API Spec:** `backend/docs/API_SPEC.md` (endpoint definitions)
- **Frontend IA:** `docs/WEB_INFORMATION_ARCHITECTURE.md` (auth page flows)
- **UI Design:** `docs/UI_DESIGN_SYSTEM.md` (auth form patterns)
- **JWT Standard:** RFC 7519
- **OAuth 2.0:** RFC 6749
- **bcrypt:** USENIX '99 paper on adaptive hashing

-----