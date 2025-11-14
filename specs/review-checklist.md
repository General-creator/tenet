Tenet Review Checklist
File: review-checklist.md
 Purpose: Provide a strict, repeatable quality gate for every single change to Tenet (human or Codex-generated). This is the final authority on whether a PR can be merged.
It enforces:
Technical correctness


Security & RLS safety


UI/UX consistency


Predictable, safe AI behavior


Stable integrations


Deployment readiness



1. Code Quality & Architecture
1.1 Structure & Organization
Code follows coding-standards.md (TS strict, folder conventions, naming)


Clear separation of concerns (UI vs API vs services vs data access)


No business logic embedded in React components (use services/hooks)


Domain logic lives in appropriate domain folders (e.g. routing, agents, sops)


No circular dependencies/imports


1.2 Cleanliness
No unused imports or variables


No commented-out blocks or dead code left behind


No console.log in production paths (use logger instead)


No magic numbers or strings — use constants/config where appropriate


1.3 Types & Validation
No any types unless explicitly justified (and documented)


All public functions have typed inputs & outputs


All API inputs are validated with Zod (or equivalent)


All LLM/AI responses are validated against schemas before use


All DB interactions are strongly typed (via Prisma/typed client)


1.4 Error Handling
API routes return structured error responses with codes


Internal errors are logged, but stack traces are not exposed to users


Integration failures are handled gracefully (no service crash)


Error paths are covered in tests where critical


1.5 Testing
Unit tests added/updated for critical logic


Routing changes have tests for correct hub/SOP/agent/model selection


New APIs have request/response tests (happy path + failure cases)


AI schema validation has at least one test per new schema


Tests pass locally and in CI



2. Security, RLS, and Permissions
No secrets hardcoded or logged


JWT claims (org_id, roles, hubs) used correctly


All DB queries respect RLS policies (verified by attempting cross-org access in dev/test)


API endpoints enforce org & role-based access control


Sensitive fields (PII/financial data) not logged in plaintext


Multi-tenant isolation confirmed (no cross-org data leakage)



3. Database & Migrations
Migrations included for all schema changes


Table & column names follow data-model.md conventions


Primary keys, foreign keys, and constraints defined appropriately


Indexes created for frequent lookups & joins


RLS policies updated when schema changes impact access patterns


Backward compatibility or explicit migration plan documented



4. UX & UI Consistency
4.1 Visual Design
UI follows style-guide.md (colors, typography, spacing, radii, shadows)


Uses the monochrome + blue accent palette correctly


Spacing respects the 8pt grid (4/8/12/16/24/32, etc.)


Components (cards, tables, buttons, inputs) match documented patterns


4.2 Interaction & Behavior
There is one clear primary action per major view


Empty states are implemented and helpful (examples, next steps)


Loading states use skeletons where appropriate (avoid bare spinners)


Error states provide clear, actionable feedback


No unexpected navigation jumps or surprise modals


4.3 Accessibility
Text and interactive elements meet WCAG AA contrast


Keyboard navigation works for key flows


Focus states are visible and consistent


Motion/animations are subtle and non-disruptive



5. AI Behavior & Safety
5.1 Prompt Architecture
System + agent prompts follow prompts-and-ai-config.md


Prompts clearly define scope, role, and prohibitions


No open-ended, unconstrained prompts for critical flows (e.g. Finance)


Output format (JSON/schema) is clearly specified in the prompt


5.2 Output Validation & Hallucination Prevention
All AI outputs validated against Zod (or equivalent) schemas


Repair/retry logic implemented for invalid JSON / structure


No fabricated financial values or invented entities are accepted


Agents ask for clarification when required data is missing instead of guessing


5.3 Traceability & Logging
Every AI call logs:


Model used


SOP/agent invoked


Routing decision summary


Status (success/failure)


Routing traces show all steps (intent → hub → SOP → agent → model)


Logs avoid raw PII or sensitive payloads unless encrypted/justified



6. Integrations Review
All external calls use the Integration Orchestrator (no direct vendor calls)


Integration payloads are validated before sending


v0 safety: draft-only mode enforced where required (e.g. AR emails, invoices)


All integration calls logged to integration logs with non-sensitive metadata


Feature flags respected (e.g. enableRealEmail, enableAccountingWrites)


Proper error mapping from provider errors → Tenet error codes



7. Deployment & Environment Readiness
.env.example updated with any new environment variables


New env vars documented in deployment-and-env.md or infra/README.md


No environment-specific logic hardcoded (use config/flags)


CI passes: lint, typecheck, unit tests, integration tests (if applicable)


Migrations tested locally and, if possible, in staging


Rollback strategy considered for risky changes (noted in PR description)



8. Documentation & PR Hygiene
PR description includes a clear summary of changes


Screenshots or Loom link attached for UI changes


Linked to relevant specs (PRD, routing-engine-spec.md, etc.)


Notes for QA: scenarios to test and expected behavior


Any new concepts reflected in relevant docs (data model, API spec, etc.)



9. Hard Fail Conditions (Do Not Merge If Any Are True)
RLS or tenant isolation is broken or untested


Secrets appear in code, config, or logs


AI behavior is unpredictable or unbounded in a critical path


Schema changes shipped without migrations or with unsafe migrations


UI clearly violates core design principles or style guide


Critical flows lack tests or break existing tests


Routing trace is incomplete or incorrect for new flows



10. Who Must Use This Checklist
Engineers (backend, frontend, full-stack)


Designers (for UI/UX-related changes)


AI prompt engineers


QA / testers


Codex or any automated agent committing code


If this checklist is not satisfied, the change is not ready. The goal is not just shipping features, but maintaining Tenet as a trusted, precise, enterprise-grade cognitive telecom system.

