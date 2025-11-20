# Project Scope & Requirements Document
## Sections 2, 4, 5, and 6

---

## 2. Project Scope

### 2.1 Scope Definition

The AKIS Platform project addresses inefficiencies in software development lifecycle (SDLC) processes, specifically focusing on documentation maintenance, test automation generation, and MVP prototyping tasks. The platform is designed as a modular AI Agent Workflow Engine that automates repetitive, low-value tasks, enabling development teams to redirect their efforts toward high-value strategic work.

The scope encompasses the development of a lightweight, resource-efficient platform optimized for deployment on Oracle Cloud Infrastructure (OCI) Free Tier resources (4 OCPU, 24 GB RAM). The system architecture follows a modular monolith pattern with a central orchestrator managing autonomous agents, ensuring minimal resource overhead while maintaining scalability and maintainability.

This scope definition clarifies what will be delivered, for whom, and within what boundaries. It includes product scope, methodology, deliverables, constraints, and success criteria. The platform integrates seamlessly with existing development tools (GitHub, Jira, Confluence) without requiring workflow changes, utilizing the Model Context Protocol (MCP) for standardized external integrations.

### 2.2 In-Scope Items

The following items are explicitly included within the project scope:

**A. Platform Core and Fundamental Features**

- **A1. User Management and Authentication:** Secure user session management and profile administration capabilities. Users authenticate via GitHub OAuth, with session tokens managed through a lightweight authentication service integrated into the Fastify backend. User profiles are stored in PostgreSQL with encrypted credential storage for external service tokens (e.g., Atlassian API tokens).

- **A2. Web-Based Management Interface:** A React-based single-page application (SPA) built with Vite, providing users with a dashboard for repository listing, agent job history viewing, and configuration management. The interface communicates with the backend via RESTful APIs, ensuring clear separation between frontend and backend concerns.

- **A3. Agent Job Tracking Module:** Real-time visibility into agent execution states (pending, running, completed, failed) with accessible log records. The orchestrator maintains state machines for each job, persisting state transitions to the database. Users can query job status, view execution artifacts, and access audit trails through the web interface.

- **A4. Agent Configuration Panel:** User-configurable parameters for each agent type (Scribe, Trace, Proto), including automation approval settings, branch naming strategies, output format preferences, and integration credentials. Configuration is stored per-user or per-workspace, allowing teams to customize agent behavior without code changes.

**B. Autonomous Agents**

- **B1. AKIS Scribe:** An autonomous agent that analyzes code changes and updates relevant technical documentation (e.g., Confluence pages). The agent monitors repository commits, identifies documentation gaps, generates or updates documentation content using LLM assistance, and commits changes via GitHub MCP adapter. It maintains documentation accuracy by cross-referencing code structure with existing documentation.

- **B2. AKIS Trace:** An agent that extracts acceptance criteria from Jira tickets and generates automated test scenarios, converting them into executable test code (e.g., Cucumber/Gherkin format). The agent reads Jira issue details via Jira MCP adapter, parses acceptance criteria, generates test cases using LLM planning capabilities, and commits test files to the repository.

- **B3. AKIS Proto:** A complex agent that orchestrates end-to-end prototyping workflows. Given a requirement or idea input, the agent performs analysis, design, code generation, and testing phases. It utilizes the Planner and Reflector AI tools for multi-step planning and quality critique, generating working prototypes that can be immediately deployed or iterated upon.

**C. External Integrations**

- **En1. GitHub Integration via MCP:** Repository access, commit/PR data processing, branch creation, and file operations through the GitHub MCP adapter. The adapter communicates with GitHub's MCP server using JSON-RPC 2.0 protocol, handling authentication via GitHub App installation tokens. All GitHub operations are abstracted through the MCP client adapter, eliminating direct REST API dependencies.

- **En2. Jira Integration via MCP:** Requirement and ticket data retrieval through the Jira MCP adapter, which interfaces with Atlassian's Rovo MCP server using RESTful HTTP endpoints. The adapter handles authentication via user-provided Atlassian API tokens, stored encrypted in the database. Ticket data is used by AKIS Trace for test generation workflows.

- **En3. Confluence Integration via MCP:** Documentation page reading and updating through the Confluence MCP adapter, also utilizing Atlassian's Rovo MCP server. The adapter provides high-level methods (e.g., `getPage`, `createPage`, `updatePage`) while managing low-level HTTP communication and authentication internally.

**D. Academic and Technical Documentation Deliverables**

- **D1. Project Scope and Requirements Document:** This comprehensive document defining project boundaries, goals, methodology, and deliverables.

- **D2. Solution Design and Technical Analysis Document:** Detailed architecture documentation, API specifications, agent contracts, and design rationale aligned with OCI Free Tier constraints.

- **D3. Final Report, Demo Video, and User Documentation:** Academic thesis report, demonstration video showcasing platform capabilities, and end-user guides for platform operation.

### 2.3 Out-of-Scope Items

The following items are explicitly excluded from the project scope to ensure manageable resource and time constraints:

1. **Custom Agent Development by Users:** No-code/low-code agent creation wizards or user-programmable agent logic. Agents are pre-defined (Scribe, Trace, Proto) with configurable parameters only.

2. **Enterprise Management Features:** Role-based access control (RBAC) beyond basic user roles, team management interfaces, and on-premise deployment alternatives. The platform focuses on single-tenant or simple multi-tenant scenarios.

3. **Deep Bidirectional Integrations:** Slack, Microsoft Teams, or VS Code extensions with full bidirectional communication. The platform provides web-based interfaces and API endpoints; IDE integrations are out of scope.

4. **Paid LLM Model Optimization:** Continuous optimization work for paid LLM models or resource-intensive AI services. The platform utilizes free-tier AI models (e.g., via OpenRouter) and focuses on efficient prompt engineering rather than model fine-tuning.

5. **Additional Agent Types:** Code review agents, refactoring agents, or deployment automation agents. The scope is limited to the three core agents (Scribe, Trace, Proto).

6. **Production-Grade CI/CD Integration:** Full production-level Docker containerization, Kubernetes deployment, or comprehensive CI/CD pipeline automation. Basic deployment scripts and documentation are included, but enterprise-grade DevOps tooling is excluded.

7. **Complex SaaS Billing:** Multi-tier subscription models, usage-based billing, or payment gateway integration. The platform operates on a freemium model with basic usage tracking, but advanced billing features are out of scope.

### 2.4 Constraints & Assumptions

**Time Constraints:**
The project adheres to the academic calendar, with key milestones including a demo submission deadline of January 26 and a final submission deadline of May 22. All deliverables must be completed within this timeframe.

**Resource/Team Constraints:**
The development team consists of two members (Ömer Yasir ÖNAL, Ayşe Serra GÜMÜŞ), requiring efficient task distribution and parallel work streams where possible.

**Cost and Tool Constraints:**
The project operates with a near-zero budget. All cloud services, APIs, and tools must be utilized under free-tier or student license agreements. This constraint influences technology selection, favoring open-source solutions and free-tier cloud resources.

**Infrastructure Constraints:**
The platform must operate within OCI Free Tier limitations (4 OCPU, 24 GB RAM on ARM architecture). This constraint drives architectural decisions toward lightweight frameworks, efficient resource utilization, and minimal overhead. The architecture explicitly avoids heavy frameworks (e.g., Next.js for backend, Prisma ORM) in favor of lean alternatives (Fastify, Drizzle) to maximize performance within resource limits.

**Technology Selection Constraints:**
Technology choices are guided by OCI Free Tier optimization requirements. The architecture mandates Fastify (not Next.js) for backend, Drizzle (not Prisma) for database access, and MCP adapters (not direct REST clients) for external integrations. These constraints are non-negotiable and override any previous technology preferences.

**Change Management Constraints:**
Project scope is clearly defined between in-scope and out-of-scope items. Any additional features require formal change request evaluation to prevent scope creep and maintain project timeline integrity.

**Assumptions:**
- Users have existing GitHub, Jira, and Confluence accounts with appropriate permissions.
- Users can provide Atlassian API tokens for Jira/Confluence integration.
- Free-tier AI models (via OpenRouter) provide sufficient quality for agent operations.
- OCI Free Tier resources remain available throughout the project lifecycle.
- PostgreSQL can run on the same VM as the application without significant performance degradation.

### 2.5 Technology Stack

The technology stack is optimized for OCI Free Tier ARM architecture, prioritizing lightweight, efficient components that minimize CPU and memory overhead. All selections align with the modular monolith architecture pattern.

| Category | Technology / Tool | Status | Selection Rationale | Project Constraints |
| :--- | :--- | :--- | :--- | :--- |
| **Runtime** | Node.js 20.x | Mandatory | Native ARM64 support, efficient async I/O, single-process deployment reduces overhead | Must run efficiently on 4 OCPU ARM VM |
| **Backend Framework** | Fastify + TypeScript | Mandatory | High throughput with minimal overhead (~2x faster than Express, lower memory footprint). Plugin architecture aligns with modular agent design. Pure JavaScript with optional native addons (ARM-compatible). | Replaces Next.js API Routes to eliminate SSR/CSR overhead |
| **Database** | PostgreSQL 15+ | Mandatory | Robust relational database with strong data integrity. Can run on same VM with tuned memory settings (1-2GB shared_buffers). ARM64 compatible. | Must operate within 24GB RAM constraint |
| **ORM/Query Builder** | Drizzle ORM | Mandatory | TypeScript-native, compile-time type safety, no runtime engine (1.5MB vs Prisma's 6.5MB). Direct SQL generation, efficient query execution. Eliminates Prisma's 2+ second cold-start latency and 2x query overhead. | Replaces Prisma to reduce memory and CPU usage |
| **Frontend Framework** | React 18+ (Vite SPA) | Mandatory | Modern reactive UI framework. Vite provides fast development and optimized production builds. SPA architecture decouples frontend from backend, allowing independent optimization. | Next.js excluded from backend; frontend served as static SPA |
| **Styling** | Tailwind CSS | Mandatory | Utility-first CSS framework, minimal runtime overhead, excellent developer experience. Supports dark/light theme variants. | No runtime CSS-in-JS overhead |
| **Authentication** | GitHub OAuth (Custom Implementation) | Mandatory | Required for GitHub integration. Lightweight OAuth flow implemented directly in Fastify (no NextAuth dependency). JWT-based session management. | Must integrate with GitHub App for repository access |
| **External Integrations** | MCP (Model Context Protocol) Adapters | Mandatory | Standardized protocol for AI-tool integration. GitHubMCPService, JiraMCPService, ConfluenceMCPService provide unified interface. Eliminates custom REST API clients (Octokit, etc.). | "USB-C for AI" approach reduces integration complexity |
| **AI Integration** | OpenRouter API | Mandatory | Access to multiple free-tier LLM models (Llama 3.3, Gemini 2.0 Flash, etc.) via single API. HTTP-based, no local model inference. Streaming support for efficient memory usage. | Only free-tier AI models permitted |
| **Data Validation** | Zod | Mandatory | Runtime type validation for API inputs and agent payloads. Compile-time type inference. Acceptable performance for input sizes. | Type safety without heavy runtime overhead |
| **Logging** | Pino | Recommended | Lightweight, fast JSON logger. Low I/O overhead. Request ID correlation support. | Efficient logging to conserve I/O resources |
| **HTTP Client** | Native Fetch (Node.js 20+) | Mandatory | Built-in HTTP client, no additional dependencies. Used by MCP adapters for external calls. | Minimal dependency footprint |
| **Package Manager** | pnpm | Mandatory | Efficient disk usage, faster installs, workspace support. Single lockfile at repo root. | Reduces node_modules overhead |
| **Hosting/Deployment** | Oracle OCI (Free Tier) | Mandatory | ARM-based VM (4 OCPU, 24 GB RAM). Free tier provides sufficient resources for development and demonstration. | Primary deployment target with resource constraints |
| **Monitoring/Observability** | Prometheus + Grafana (Free Tier) | Optional | Open-source monitoring stack. Lightweight metrics collection. Can run on same VM with minimal overhead. | Free-tier compatible observability |
| **Development Environment** | VS Code, Git | Recommended | Standard development tools with strong community support. Git for version control. | Developer preference, no constraint |
| **Documentation** | Markdown, OpenAPI/Swagger | Mandatory | Markdown for technical documentation. OpenAPI for API specification. Standard formats ensure maintainability. | All APIs must be OpenAPI-documented |

**Architecture Compliance Notes:**
- Backend MUST use Fastify (Next.js API Routes forbidden)
- Database access MUST use Drizzle (Prisma forbidden)
- External integrations MUST use MCP adapters (direct REST clients forbidden)
- Frontend MUST be Vite SPA (Next.js SSR/CSR forbidden for backend)
- Single lockfile at repo root (nested lockfiles forbidden)

### 2.6 Deliverables

The following deliverables are required for project completion:

1. **Working Web-Based Prototype:** A functional platform demonstrating core workflows including agent management, external integrations (GitHub, Jira, Confluence), and agent execution capabilities. The prototype must run on OCI Free Tier infrastructure and demonstrate all three agents (Scribe, Trace, Proto) with end-to-end workflows.

2. **Minimum Viable Functionality for Three Core Agents:**
   - **AKIS Scribe:** Successfully updates Confluence documentation based on code changes detected in GitHub repositories.
   - **AKIS Trace:** Generates automated test code from Jira ticket acceptance criteria and commits tests to repository.
   - **AKIS Proto:** Produces working prototypes from requirement inputs, including code generation, testing, and basic deployment artifacts.

3. **Demo Presentation and User Documentation:** A recorded demonstration video showcasing platform capabilities, user workflows, and integration scenarios. Comprehensive user documentation including setup guides, configuration instructions, and troubleshooting resources.

4. **Technical Documentation Suite:** Complete system architecture documentation, API specifications (OpenAPI/Swagger), agent contract definitions, playbook structures, and design rationale. Documentation must align with architecture v2 (Fastify, Drizzle, MCP adapters) and justify all technology selections in the context of OCI Free Tier constraints.

5. **Academic Thesis Report:** Formal academic document covering problem definition, literature review, methodology, implementation details, evaluation results, and conclusions. The report must demonstrate alignment between project goals (H1–H6) and achieved outcomes.

---

## 4. Methodology and Solution Techniques

### 4.1 Overview of the Approach

The AKIS Platform development methodology combines software engineering best practices with agile project management techniques, specifically tailored for a resource-constrained academic project with clear architectural constraints. The approach emphasizes iterative development, quality assurance through shift-left practices, and continuous alignment with project goals (H1–H6).

The methodology is built upon three foundational pillars:

1. **Modular Monolith Architecture:** A single-process deployment model that maximizes resource efficiency on OCI Free Tier while maintaining clear module boundaries. This approach eliminates microservices overhead while preserving the benefits of modular design through plugin-like agent architecture and dependency injection.

2. **Agent-Centric Workflow Engine:** A central orchestrator pattern that coordinates autonomous agents through well-defined contracts and playbooks. Agents operate as independent modules with standardized interfaces, enabling extensibility without architectural changes.

3. **MCP-Based Integration Strategy:** External tool integrations are standardized through Model Context Protocol (MCP) adapters, reducing integration complexity and future-proofing the platform against API changes.

The development process follows a Dual-Track Agile methodology, combining discovery (research, design) and delivery (implementation, testing) tracks in parallel. Rolling-Wave Planning ensures detailed planning occurs only for near-term work, while high-level milestones guide long-term direction. Work prioritization uses Weighted Shortest Job First (WSJF) to maximize value delivery within time constraints.

### 4.2 AI Agent Workflow Engine

The AI Agent Workflow Engine is the core architectural component that enables autonomous agent execution within the AKIS Platform. The engine implements a lightweight orchestrator pattern optimized for resource-constrained environments.

**4.2.1 Orchestrator Pattern**

The central orchestrator (`AgentOrchestrator`) is the sole owner of agent lifecycle management. It receives workflow requests, initializes appropriate agents via a factory pattern, manages state machines for each execution, and coordinates tool injection (MCP adapters, AI services). The orchestrator ensures agents never call each other directly; all inter-agent communication is mediated through the orchestrator or a shared message bus.

This centralized approach provides several advantages:
- **Resource Efficiency:** Single-process coordination eliminates inter-process communication overhead, critical for 4 OCPU environments.
- **State Management:** Centralized state machines ensure consistent agent lifecycle tracking (pending → running → completed/failed) with database persistence.
- **Tool Injection:** Dependency injection pattern allows the orchestrator to provide MCP adapters and AI services to agents, ensuring testability and loose coupling.
- **Governance:** Centralized rule enforcement (playbooks, contracts) ensures consistent agent behavior and simplifies compliance with quality standards.

**4.2.2 Agent Factory and Registry**

The `AgentFactory` implements a factory pattern for agent instantiation. Agents are registered by type (e.g., "scribe", "trace", "proto") and created on-demand with injected dependencies. This pattern enables plugin-like extensibility: new agents can be added by implementing the `IAgent` interface and registering with the factory, without modifying orchestrator code.

The factory pattern aligns with the modular monolith architecture by allowing compile-time agent registration while maintaining runtime flexibility. Agents are instantiated per-job, ensuring isolation between concurrent executions.

**4.2.3 Agent State Machine**

Each agent execution is managed by a finite-state machine (FSM) with states: `pending`, `running`, `completed`, `failed`. The FSM enforces valid state transitions (e.g., cannot transition from `pending` directly to `completed`) and provides explicit lifecycle tracking.

The FSM pattern is lightweight (conditional logic only) and highly predictable, making it ideal for resource-constrained environments. State transitions are persisted to the database, enabling job recovery and audit trails. The orchestrator maintains in-memory state machines for active jobs, reducing database query overhead.

**4.2.4 Planner-Execute-Reflector Pipeline**

Complex agents (notably AKIS Proto) utilize a three-phase execution pipeline:

1. **Planning Phase:** The agent's `plan()` method is invoked with a Planner AI tool (LLM-backed). The planner analyzes the task context and generates a structured plan with steps and rationale. The plan is persisted to the database for auditability.

2. **Execution Phase:** The agent's `executeWithTools()` method receives MCP adapters and the optional plan. The agent performs its primary task using injected tools, following playbook steps or the generated plan.

3. **Reflection Phase:** The agent's `reflect()` method is invoked with a Reflector AI tool (LLM-backed). The reflector critiques the execution artifact, identifying issues and providing recommendations. The critique is stored for quality assessment.

This pipeline enables complex, multi-step agent workflows while maintaining separation of concerns. The orchestrator coordinates the pipeline, ensuring proper error handling and state management at each phase.

**4.2.5 MCP Tool Injection**

All external integrations are provided to agents through MCP (Model Context Protocol) adapters injected by the orchestrator. Agents receive a `MCPTools` object containing:
- `GitHubMCPService`: GitHub repository operations via JSON-RPC 2.0
- `JiraMCPService`: Jira issue operations via RESTful HTTP
- `ConfluenceMCPService`: Confluence page operations via RESTful HTTP

This dependency injection pattern ensures agents are decoupled from external service implementations. Adapters handle authentication, protocol differences, and error translation, providing a clean facade to agents.

### 4.3 Playbooks and Contracts

**4.3.1 Agent Playbooks**

An agent playbook (`AgentPlaybook`) defines the sequence of actions an agent should follow during execution. Playbooks implement the Strategy and Command patterns, encapsulating step definitions with retry logic and execution order.

Each playbook contains:
- **Steps:** Ordered list of actions with names, action functions, and retryability flags
- **Planning Requirement:** Boolean flag indicating whether the agent requires a planning phase
- **Reflection Requirement:** Boolean flag indicating whether the agent requires a reflection phase

Playbooks are defined per-agent-type and loaded by the orchestrator before execution. The playbook structure enables agents to declare their complexity requirements (planning/reflection) without hard-coding execution logic.

**4.3.2 Agent Contracts**

Agent contracts (`AgentContract`) define input/output schemas and validation rules for agent execution. Contracts use Zod schemas to enforce type safety at runtime, ensuring agents receive valid inputs and produce expected outputs.

Contracts serve multiple purposes:
- **Input Validation:** Ensures task context matches agent expectations before execution
- **Output Guarantees:** Defines expected output structure for downstream processing
- **Documentation:** Contracts serve as living documentation of agent capabilities
- **Testing:** Contracts enable contract-based testing, verifying agent behavior against specifications

The orchestrator validates contracts before agent execution and after completion, ensuring system integrity and early error detection.

**4.3.3 Governance and Guardrails**

Playbooks and contracts enable governance through centralized rule enforcement. The orchestrator can:
- Validate agent inputs against contracts before execution
- Enforce playbook step ordering and retry policies
- Audit agent behavior through playbook execution logs
- Reject agent outputs that violate contract schemas

This governance model aligns with project goal H5 (high security, quality assurance, and governance standards) by providing systematic quality controls without manual intervention.

### 4.4 Development Methodology

**4.4.1 Dual-Track Agile**

The project follows a Dual-Track Agile methodology, maintaining parallel discovery and delivery tracks:

- **Discovery Track:** Research, architecture design, technology evaluation, and user requirement analysis. This track informs delivery decisions and ensures alignment with OCI Free Tier constraints.

- **Delivery Track:** Implementation, testing, integration, and deployment. This track produces working software incrementally, enabling early validation and risk mitigation.

Dual-Track Agile is particularly suited for academic projects with fixed deadlines, as it allows research and implementation to proceed concurrently without blocking each other. Discovery work (e.g., MCP protocol research, architecture optimization) informs delivery decisions in real-time.

**4.4.2 Rolling-Wave Planning**

Detailed planning occurs only for near-term work (current and next sprint), while high-level milestones guide long-term direction. This approach acknowledges uncertainty in academic research projects and allows adaptation as requirements or constraints become clearer.

Rolling-Wave Planning structure:
- **Wave 1 (Current Sprint):** Detailed task breakdown, time estimates, and dependencies
- **Wave 2 (Next Sprint):** High-level task identification and resource allocation
- **Wave 3+ (Future Sprints):** Milestone-level planning only, detailed planning deferred

This methodology aligns with the academic timeline (demo deadline: January 26, final deadline: May 22) by ensuring critical path work is planned in detail while maintaining flexibility for research-driven discoveries.

**4.4.3 Sprint Structure**

Sprints are two-week iterations with the following structure:
- **Sprint Planning:** Task selection from backlog, WSJF prioritization, dependency identification
- **Daily Standups:** Progress updates, blocker identification, resource coordination
- **Sprint Review:** Demo of completed work, stakeholder feedback
- **Sprint Retrospective:** Process improvement, technical debt identification

Sprint deliverables are aligned with project phases (e.g., Phase 9: Auth & RBAC, Phase 10: Next Foundations), ensuring incremental value delivery toward goals H1–H6.

### 4.5 Prioritization (WSJF)

Work prioritization uses Weighted Shortest Job First (WSJF), a method that maximizes value delivery by prioritizing high-value, short-duration work.

WSJF Formula: `WSJF = (User-Business Value + Time Criticality + Risk Reduction) / Job Duration`

**Application to AKIS Platform:**

- **User-Business Value:** Features that directly address project goals (H1–H6) receive higher value scores. For example, agent execution functionality (H3) has higher value than UI polish.

- **Time Criticality:** Work with hard deadlines (e.g., demo submission) receives higher scores. Architecture decisions that block other work are also time-critical.

- **Risk Reduction:** Technical spikes, proof-of-concepts, and integration tests that reduce uncertainty receive higher scores. For example, MCP adapter proof-of-concept reduces integration risk early.

- **Job Duration:** Shorter tasks are prioritized to maintain momentum and enable faster feedback loops.

WSJF ensures that high-impact, low-effort work (e.g., fixing critical bugs, completing blocking integrations) is prioritized over low-impact, high-effort work (e.g., premature optimization, extensive documentation).

### 4.6 Quality Assurance

**4.6.1 Shift-Left Testing**

Quality assurance is integrated early in the development lifecycle through shift-left practices:

- **Unit Testing:** Agent logic, orchestrator functions, and MCP adapters are unit-tested in isolation using Vitest (frontend) and fastify.inject (backend route testing).

- **Contract Testing:** Agent contracts are validated through schema-based tests, ensuring input/output compliance.

- **Integration Testing:** MCP adapter integration tests verify protocol compliance and error handling without requiring live external services (using mocked MCP servers).

- **End-to-End Testing:** Critical user workflows (agent submission, job tracking) are tested through API-level E2E tests.

Shift-left testing reduces defect escape rate and enables faster feedback, critical for a two-person team with limited time for bug fixing.

**4.6.2 Definition of Done (DoD)**

Every work item must satisfy the Definition of Done checklist before acceptance:

- [ ] Code passes all linting and type-checking (`pnpm -r typecheck`, `pnpm -r lint`)
- [ ] All tests pass (`pnpm -r test`)
- [ ] Code builds successfully (`pnpm -r build`)
- [ ] Architecture compliance verified (Fastify, Drizzle, MCP adapters, no forbidden technologies)
- [ ] Documentation updated (API docs, agent contracts, architecture decisions)
- [ ] No new technical debt introduced (or documented if unavoidable)
- [ ] Security considerations addressed (authentication, input validation, error handling)

DoD enforcement ensures consistent quality standards and prevents accumulation of technical debt that could impact OCI Free Tier performance.

**4.6.3 CI/CD Pipeline**

Continuous Integration (CI) is implemented through GitHub Actions workflows:

- **Type Checking:** TypeScript compilation verification across backend and frontend
- **Linting:** ESLint and Prettier validation
- **Testing:** Automated test execution (unit, integration, E2E)
- **Build Verification:** Production build success confirmation
- **Architecture Compliance:** Automated checks for forbidden technologies (Next.js, Prisma, etc.)

Continuous Deployment (CD) is limited to manual deployment to OCI Free Tier, as automated deployment tooling is out of scope. However, deployment scripts and documentation ensure reproducible deployments.

The CI pipeline serves as a quality gate, preventing broken code from entering the main branch and ensuring all commits maintain architecture compliance.

**4.6.4 Error Handling and Observability**

Error handling follows a unified error model with structured error responses:
- **Error Codes:** Standardized error codes (e.g., `JOB_NOT_FOUND`, `INVALID_STATE_TRANSITION`)
- **Error Context:** Request IDs, timestamps, and relevant context included in error responses
- **Logging:** Structured logging with Pino, including request ID correlation for traceability

Observability is provided through:
- **Metrics:** Prometheus metrics for job completion/failure rates, agent execution times
- **Logs:** Centralized logging with request ID correlation
- **Health Endpoints:** `/health`, `/ready`, `/version` endpoints for system status monitoring

This observability infrastructure supports goal H4 (monitoring and metrics) by enabling measurement of platform performance and agent effectiveness.

### 4.7 Justification of Methodology vs Goals (H1–H6)

**H1: Modular System Infrastructure with Web-Based Management Interface**

The modular monolith architecture with orchestrator pattern directly supports H1 by providing a modular, extensible core. The Dual-Track Agile methodology ensures discovery work (architecture research) informs delivery work (implementation), resulting in a well-architected system. WSJF prioritization ensures infrastructure work (orchestrator, state management) is prioritized early, unblocking agent development.

**H2: Secure API Connections to Existing Tools (GitHub, Jira, Confluence)**

The MCP adapter pattern and dependency injection methodology enable secure, standardized integrations. Shift-left testing includes integration tests for MCP adapters, ensuring reliability. Rolling-Wave Planning allows detailed planning for integration work as MCP protocol details become available, reducing integration risk.

**H3: Three Autonomous Agents (Scribe, Trace, Proto)**

The agent-centric workflow engine methodology provides a consistent framework for agent development. Playbooks and contracts ensure agents follow standardized patterns, enabling parallel development of all three agents. The Planner-Execute-Reflector pipeline specifically supports AKIS Proto's complex requirements, while simpler agents (Scribe, Trace) utilize streamlined execution paths.

**H4: Monitoring and Metrics Infrastructure**

Shift-left observability practices (metrics, logging, health endpoints) are integrated from the start, not added as an afterthought. The CI/CD pipeline includes metrics collection, ensuring monitoring infrastructure is maintained alongside application code. WSJF prioritization ensures observability work is not deferred, as it provides risk reduction value.

**H5: High Security, Quality Assurance, and Governance Standards**

Definition of Done, shift-left testing, and contract-based validation provide systematic quality controls. The orchestrator's governance capabilities (playbook enforcement, contract validation) ensure agents comply with quality standards. CI/CD pipeline enforces DoD automatically, preventing quality regressions.

**H6: Working Prototype, Documentation, and Academic Report**

Dual-Track Agile ensures documentation work (academic report, user guides) proceeds in parallel with implementation. Rolling-Wave Planning allows documentation to be updated incrementally as features are delivered. WSJF prioritization ensures documentation is not deferred until the end, as it provides user-business value and reduces final submission risk.

---

## 5. Project Management

### 5.1 Work Breakdown Structure (WBS)

The project work is organized into hierarchical work packages, organized by functional area and phase. The WBS structure reflects the modular monolith architecture and agent-centric design.

**Level 1: Project Phases**

1. **Phase 1-8: Foundation & Core Infrastructure**
   - Backend core (Fastify server, database schema, authentication)
   - Frontend core (React SPA, routing, state management)
   - MCP adapter development (GitHub, Jira, Confluence)
   - Orchestrator and agent factory implementation

2. **Phase 9: Authentication & Authorization**
   - GitHub OAuth integration
   - User session management
   - Basic RBAC implementation
   - Auth UI components

3. **Phase 10: Next Foundations**
   - Settings UX refinement
   - Accessibility improvements
   - Performance optimization
   - Marketing components (ROI widget, FAQ)

**Level 2: Functional Areas**

**A. Platform Core**
- A1. Backend API development (Fastify routes, middleware, error handling)
- A2. Database schema design and migrations (Drizzle)
- A3. Authentication service implementation
- A4. Orchestrator and state machine implementation
- A5. Agent factory and registry

**B. Frontend Application**
- B1. React SPA setup (Vite, routing, state management)
- B2. Dashboard UI development
- B3. Agent configuration panels
- B4. Job tracking and monitoring interface
- B5. Authentication UI components

**C. External Integrations**
- C1. GitHub MCP adapter development
- C2. Jira MCP adapter development
- C3. Confluence MCP adapter development
- C4. MCP protocol implementation and testing
- C5. Authentication token management

**D. Autonomous Agents**
- D1. AKIS Scribe agent implementation
- D2. AKIS Trace agent implementation
- D3. AKIS Proto agent implementation
- D4. Agent playbook definitions
- D5. Agent contract schemas

**E. Quality Assurance & Testing**
- E1. Unit test suite development
- E2. Integration test suite development
- E3. E2E test suite development
- E4. CI/CD pipeline setup
- E5. Performance testing and optimization

**F. Documentation & Deliverables**
- F1. Technical architecture documentation
- F2. API documentation (OpenAPI/Swagger)
- F3. User documentation and guides
- F4. Academic thesis report
- F5. Demo video production

**Level 3: Detailed Tasks**

Each functional area is further decomposed into specific, actionable tasks. For example:

**A1. Backend API Development:**
- A1.1. Fastify server setup and configuration
- A1.2. Health endpoint implementation (`/health`, `/ready`, `/version`)
- A1.3. Agent job submission endpoint (`POST /api/agents/jobs`)
- A1.4. Job status query endpoint (`GET /api/agents/jobs/:id`)
- A1.5. Error handling middleware implementation
- A1.6. Request ID correlation middleware

**D1. AKIS Scribe Agent Implementation:**
- D1.1. Scribe agent class structure (`ScribeAgent.ts`)
- D1.2. Playbook definition (documentation update workflow)
- D1.3. Contract schema definition (input/output validation)
- D1.4. Code change detection logic
- D1.5. Documentation generation logic (LLM integration)
- D1.6. Confluence page update logic (via MCP adapter)
- D1.7. GitHub commit logic (via MCP adapter)

### 5.2 Responsibilities

**Team Member 1: Ömer Yasir ÖNAL (2221221562)**
- **Primary Responsibilities:**
  - Backend architecture and implementation (Fastify, Drizzle, orchestrator)
  - MCP adapter development and integration
  - Agent core implementation (Scribe, Trace, Proto)
  - Database schema design and migrations
  - CI/CD pipeline setup and maintenance
  - Technical documentation (architecture, API specs)

- **Secondary Responsibilities:**
  - Frontend API integration
  - Agent contract and playbook design
  - Performance optimization for OCI Free Tier

**Team Member 2: Ayşe Serra GÜMÜŞ**
- **Primary Responsibilities:**
  - Frontend application development (React SPA, UI components)
  - User experience design and implementation
  - Authentication UI and user management interfaces
  - Agent configuration panels and job tracking UI
  - User documentation and guides
  - Demo video production

- **Secondary Responsibilities:**
  - Frontend testing (Vitest, Testing Library)
  - Accessibility compliance (WCAG 2.1 AA)
  - UI/UX documentation

**Shared Responsibilities:**
- Code reviews and quality assurance
- Sprint planning and retrospective participation
- Academic report writing (respective sections)
- Stakeholder communication and demo presentations

**Advisor: Dr. Öğr. Üyesi Nazlı DOĞAN**
- Architecture review and guidance
- Methodology validation
- Academic report review and feedback
- Timeline and milestone approval

### 5.3 Timeline

The project timeline is structured around academic deadlines and development phases, with detailed planning for near-term work and milestone-level planning for future phases.

**Timeline Overview:**

**Months 1-2 (Foundation Phase):**
- Architecture design and technology stack finalization
- Backend core development (Fastify server, database setup, basic authentication)
- Frontend core development (React SPA setup, routing, basic UI components)
- MCP adapter proof-of-concept and initial implementation
- Orchestrator and agent factory implementation

**Months 3-4 (Integration & Agent Development Phase):**
- Complete MCP adapter development (GitHub, Jira, Confluence)
- Agent implementation (Scribe, Trace, Proto)
- Agent playbook and contract definitions
- Frontend agent management interfaces
- Integration testing and bug fixing

**Month 5 (Polish & Documentation Phase):**
- Performance optimization for OCI Free Tier
- User documentation completion
- Academic report writing
- Demo video production
- Final testing and bug fixes

**Key Milestones:**

- **Milestone 1 (End of Month 2):** Working backend API with orchestrator, basic frontend UI, MCP adapter proof-of-concept
- **Milestone 2 (End of Month 3):** All three agents implemented and tested individually
- **Milestone 3 (End of Month 4):** End-to-end workflows functional, integration testing complete
- **Milestone 4 (Demo Deadline - January 26):** Demo-ready prototype with all core features
- **Milestone 5 (Final Deadline - May 22):** Complete deliverables including academic report, documentation, and demo video

**Critical Path:**
The critical path includes: (1) Backend core → (2) MCP adapters → (3) Orchestrator → (4) Agent implementation → (5) Integration testing → (6) Documentation. Any delay in backend core or MCP adapters directly impacts agent development and integration timelines.

**Risk Buffers:**
A 10% time buffer is allocated to each phase to account for unexpected technical challenges, particularly around MCP protocol integration and OCI Free Tier performance optimization.

### 5.4 Risk Management

| Risk ID | Risk Description | Probability | Impact | Cause | Mitigation Strategy | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **R1** | MCP protocol integration complexity exceeds estimates | Medium | High | Unfamiliar protocol, limited documentation, potential API changes | Early proof-of-concept (Month 1), mock MCP server for testing, fallback to direct REST if MCP proves unfeasible | Ömer Yasir ÖNAL |
| **R2** | OCI Free Tier performance insufficient for agent workloads | Medium | High | Resource constraints (4 OCPU, 24GB RAM), agent LLM calls may be CPU-intensive | Architecture optimization from start (Fastify, Drizzle), performance testing early (Month 2), agent execution limits (max 2 concurrent), streaming LLM responses | Ömer Yasir ÖNAL |
| **R3** | Free-tier AI models (OpenRouter) provide insufficient quality | Medium | Medium | Model limitations, rate limits, availability issues | Early testing with multiple models, fallback model selection, prompt engineering optimization, caching strategies | Ömer Yasir ÖNAL |
| **R4** | Team member availability conflicts with academic deadlines | Low | High | Overlapping coursework, personal commitments | Clear task distribution, early communication of conflicts, buffer time in timeline, advisor escalation if needed | Both team members |
| **R5** | External service API changes (GitHub, Jira, Confluence) | Low | Medium | Third-party service updates, MCP server changes | MCP adapter abstraction layer isolates changes, version pinning where possible, monitoring for API deprecation notices | Ömer Yasir ÖNAL |
| **R6** | Scope creep from feature requests | Medium | Medium | Stakeholder requests, "nice-to-have" features | Strict change management process, out-of-scope documentation, WSJF prioritization, advisor approval for scope changes | Both team members |
| **R7** | Technical debt accumulation impacting timeline | Medium | Medium | Rushed implementation, deferred refactoring | Definition of Done enforcement, code review requirements, technical debt tracking, allocated refactoring time | Both team members |
| **R8** | Database performance issues on shared VM | Low | Medium | PostgreSQL and application competing for resources | Database tuning (shared_buffers), connection pooling, query optimization, monitoring | Ömer Yasir ÖNAL |
| **R9** | Authentication token expiration/refresh complexity | Low | Medium | GitHub App token lifecycle, Atlassian token management | Early token management implementation, automated refresh logic, clear error messages for expired tokens | Ömer Yasir ÖNAL |
| **R10** | Academic report writing delays implementation | Low | Medium | Time allocation imbalance, documentation overhead | Parallel documentation track (Dual-Track Agile), incremental documentation updates, dedicated documentation time in each sprint | Both team members |

**Risk Monitoring:**
Risks are reviewed weekly during sprint planning and daily standups. High-probability, high-impact risks (R1, R2) are monitored continuously with early warning indicators (e.g., MCP adapter development velocity, performance test results).

**Contingency Plans:**
- **R1 Contingency:** If MCP integration proves unfeasible by Month 2, fallback to direct REST API clients (Octokit, Jira REST, Confluence REST) with adapter pattern maintained for future MCP migration.
- **R2 Contingency:** If OCI Free Tier performance is insufficient, consider: (1) Agent execution queuing to limit concurrency, (2) LLM response caching to reduce API calls, (3) Database query optimization, (4) Advisor consultation for alternative hosting options (if available).
- **R3 Contingency:** If free-tier AI models are insufficient, focus on prompt engineering and model selection optimization. Consider hybrid approach: free models for simple tasks, paid models (if budget allows) only for complex planning/reflection phases.

### 5.5 Mitigation Strategies

**Architecture Risk Mitigation:**
The modular monolith architecture with clear module boundaries enables incremental development and reduces integration risk. Early proof-of-concepts (MCP adapters, orchestrator) validate architectural decisions before full implementation.

**Resource Constraint Mitigation:**
OCI Free Tier optimization is built into architecture from the start (Fastify, Drizzle, lightweight libraries). Performance testing occurs early (Month 2) to identify bottlenecks before agent development. Agent execution limits prevent resource exhaustion.

**Integration Risk Mitigation:**
MCP adapter abstraction layer isolates external service dependencies. Integration tests with mocked MCP servers enable testing without live external services. Early integration work (Month 1-2) provides buffer time for protocol learning.

**Quality Risk Mitigation:**
Definition of Done enforcement, shift-left testing, and CI/CD pipeline prevent quality regressions. Code reviews ensure architecture compliance. Technical debt tracking prevents accumulation.

**Timeline Risk Mitigation:**
Rolling-Wave Planning allows adaptation to discovered challenges. WSJF prioritization ensures critical path work is completed first. 10% time buffers in each phase provide contingency. Early completion of blocking work (backend core, MCP adapters) unblocks parallel work streams.

**Team Risk Mitigation:**
Clear responsibility distribution, regular communication (daily standups, weekly planning), and early conflict identification prevent team coordination issues. Advisor escalation path available for unresolved conflicts.

---

## 6. Impact of the Project

### 6.1 Economic & Commercial Impact

**6.1.1 Cost Reduction for Development Teams**

The AKIS Platform directly addresses three high-cost inefficiencies in software development:

- **Documentation Maintenance Costs:** Manual documentation updates consume 5-10% of development time in typical teams. AKIS Scribe automates this process, potentially saving 20-40 hours per developer per year, translating to significant cost savings for organizations with 10+ developer teams.

- **Test Automation Development Costs:** Converting manual test scenarios to automated test code typically requires 2-4 hours per test case. AKIS Trace automates this conversion, reducing test development time by 60-80%, enabling faster release cycles and improved test coverage.

- **MVP Prototyping Costs:** Traditional MVP development requires 2-4 weeks of developer time. AKIS Proto reduces this to hours or days, enabling rapid validation of business ideas and faster time-to-market.

**Quantifiable Economic Value:**
Assuming a team of 10 developers with average salary of $80,000/year:
- Documentation automation: ~$16,000/year saved (20 hours × $40/hour × 10 developers)
- Test automation: ~$24,000/year saved (reduced test development time)
- MVP prototyping: ~$12,000/year saved (faster iteration cycles)

**Total potential annual savings: $52,000+ for a 10-developer team.**

**6.1.2 Market Opportunity**

The software development tools market is valued at $6+ billion annually, with growing demand for AI-powered automation. The AKIS Platform addresses a specific niche (SDLC automation) with clear differentiation:
- **Integration-First Approach:** Seamless integration with existing tools (GitHub, Jira, Confluence) without workflow disruption
- **Resource Efficiency:** Optimized for cost-conscious organizations (freemium model, OCI Free Tier deployment)
- **Academic Validation:** Research-backed methodology and quality assurance practices

**Commercial Viability:**
The platform's freemium model (free tier for individual developers, paid tiers for teams) aligns with market expectations. The modular architecture enables future expansion into enterprise features (RBAC, team management) as commercial opportunities arise.

**6.1.3 Innovation Contribution**

The project contributes to the "value economy" in software development by automating low-value, repetitive tasks and enabling teams to focus on high-value strategic work. This shift from time-intensive manual work to automated, AI-assisted workflows represents a fundamental change in how software teams operate.

**Industry Impact:**
- **Open-Source Potential:** The modular architecture and MCP-based integration approach could be open-sourced, contributing to the broader software development community.
- **Research Contribution:** The application of LLM-based agents to SDLC processes, combined with governance through playbooks and contracts, provides a research contribution to the field of AI-assisted software engineering.

### 6.2 Social Impact

**6.2.1 Developer Well-Being**

Automation of repetitive tasks reduces developer burnout and improves job satisfaction. Developers can focus on creative problem-solving and strategic work rather than tedious documentation updates or test code conversion. This shift improves work-life balance and reduces stress associated with manual, time-consuming tasks.

**6.2.2 Knowledge Accessibility**

Automated documentation updates ensure that technical knowledge remains current and accessible. New team members benefit from up-to-date documentation, reducing onboarding time and knowledge transfer friction. This accessibility is particularly valuable for distributed teams and open-source projects.

**6.2.3 Educational Value**

The AKIS Platform serves as an educational tool for software engineering students and junior developers, demonstrating:
- Modern software architecture patterns (modular monolith, orchestrator, dependency injection)
- AI integration in software development workflows
- Quality assurance practices (shift-left testing, DoD, CI/CD)
- Resource-constrained system design (OCI Free Tier optimization)

**Academic Contribution:**
The project's academic documentation and open-source potential (if pursued) contribute to software engineering education, providing a real-world example of AI-assisted development tools.

**6.2.4 Inclusivity and Accessibility**

The platform's web-based interface and integration with existing tools (GitHub, Jira, Confluence) ensure that teams using standard development tools can adopt AKIS without additional infrastructure. The freemium model provides access to individual developers and small teams who may not have budget for expensive enterprise tools.

**Barrier Reduction:**
By automating documentation and test generation, the platform reduces barriers to entry for developers who may struggle with these tasks due to language barriers, learning disabilities, or lack of experience. The AI-assisted approach provides guidance and structure that supports diverse developer needs.

### 6.3 Sustainability & Environmental Impact

**6.3.1 Resource Efficiency**

The AKIS Platform's architecture is explicitly optimized for resource efficiency, designed to run on OCI Free Tier (4 OCPU, 24 GB RAM). This efficiency reduces energy consumption compared to resource-intensive alternatives:

- **Lightweight Stack:** Fastify (vs. Next.js) reduces memory footprint by ~200-300 MB
- **Efficient Database Access:** Drizzle (vs. Prisma) eliminates ~4 MB engine overhead and reduces query CPU usage by ~50%
- **Single-Process Deployment:** Modular monolith (vs. microservices) eliminates multiple runtime overheads

**Energy Savings:**
A typical microservices deployment might require 2-3 VMs (orchestrator, agents, database), consuming ~150-200 W continuously. The AKIS Platform's single-process design on one VM consumes ~50-75 W, representing a 60-70% reduction in energy consumption.

**6.3.2 Cloud Resource Optimization**

The platform's design philosophy of "maximum efficiency with minimum resources" encourages sustainable cloud computing practices. By demonstrating that complex AI-powered systems can operate efficiently on free-tier resources, the project challenges the industry trend toward over-provisioning and resource waste.

**Scalability Considerations:**
The modular architecture enables horizontal scaling when needed, but the efficient design means that many teams can operate on minimal resources, reducing overall cloud infrastructure demand.

**6.3.3 Carbon Footprint Reduction**

By automating documentation and test generation, the platform reduces the need for developers to run multiple local development environments, perform manual testing, and maintain separate documentation systems. This consolidation reduces overall computational resource usage across the software development ecosystem.

**Indirect Environmental Benefits:**
- Reduced developer commute time (if remote work is enabled by better tooling)
- Faster development cycles reduce time-to-market, potentially reducing waste from failed projects
- Improved code quality (automated testing) reduces need for rework and redeployment

### 6.4 Ethical and Societal Contribution

**6.4.1 Responsible AI Development**

The AKIS Platform implements responsible AI practices through:
- **Transparency:** Agent playbooks and contracts provide visibility into AI decision-making processes
- **Governance:** Centralized rule enforcement ensures AI agents comply with quality and security standards
- **Auditability:** Execution logs, plans, and critiques are persisted, enabling post-hoc analysis of AI behavior
- **Human Oversight:** Users configure agent parameters and approve automation, maintaining human control

**Ethical AI Principles:**
The platform's design aligns with ethical AI principles by ensuring that AI agents are tools that augment human capabilities rather than replace human judgment. The governance model (playbooks, contracts) ensures that AI behavior is predictable and aligned with organizational values.

**6.4.2 Workforce Impact**

The automation provided by AKIS Platform raises questions about workforce displacement. However, the platform's design philosophy emphasizes augmentation over replacement:

- **High-Value Work Focus:** By automating low-value tasks, developers can focus on creative problem-solving, architecture design, and strategic decision-making—tasks that require human judgment and creativity.

- **Skill Enhancement:** Working with AI-assisted tools develops new skills (prompt engineering, AI tool integration, automated workflow design) that are increasingly valuable in the software industry.

- **Job Creation:** The platform itself requires maintenance, enhancement, and support, creating opportunities for developers skilled in AI integration and workflow automation.

**Societal Benefit:**
The platform contributes to a more efficient software development ecosystem, enabling faster delivery of software solutions that address societal challenges (healthcare, education, environmental monitoring, etc.).

**6.4.3 Open Knowledge and Accessibility**

The project's academic nature and potential for open-source contribution promote open knowledge sharing. The architecture documentation, methodology, and design decisions are publicly documented, enabling other researchers and developers to learn from and build upon the work.

**Community Contribution:**
- **Research Contribution:** The application of LLM-based agents to SDLC processes contributes to academic research in AI-assisted software engineering.
- **Open Architecture:** The modular, MCP-based architecture provides a reference implementation for AI agent workflow engines.
- **Educational Resource:** The comprehensive documentation serves as an educational resource for students and practitioners.

**6.4.4 Privacy and Security**

The platform's design prioritizes user privacy and security:
- **Minimal Data Collection:** Only necessary data (job metadata, execution logs) is stored; user credentials are encrypted.
- **Secure Authentication:** OAuth-based authentication with encrypted token storage.
- **Access Control:** User-specific data isolation ensures that users only access their own jobs and configurations.

**Data Ethics:**
The platform does not collect or store sensitive code content or proprietary business logic beyond what is necessary for agent execution. Execution logs are user-specific and can be purged per user request, aligning with data minimization principles.

**6.4.5 Alignment with Engineering Ethics**

The project aligns with software engineering ethics by:
- **Quality Assurance:** Systematic quality controls (DoD, testing, governance) ensure that automated outputs meet professional standards.
- **Transparency:** Clear documentation of agent capabilities, limitations, and decision-making processes.
- **User Autonomy:** Users maintain control over automation through configuration and approval mechanisms.
- **Responsible Innovation:** The platform's design considers societal impact, workforce implications, and environmental sustainability.

**Professional Contribution:**
The project demonstrates how software engineers can responsibly integrate AI into development workflows while maintaining professional standards, user trust, and ethical considerations.

---

**Document End**

