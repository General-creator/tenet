Version Control & Branching Strategy
File: version-control-and-branching.md
 Purpose: Define Tenet’s canonical version control, branching model, commit standards, PR workflow, release process, and hotfix protocols. This governs how both humans and Codex contribute code safely.
Tenet is a spec-driven telecom-grade system. Stability, traceability, and predictable releases are mandatory.

1. Core Principles
Tenet’s version control system is designed to ensure:
Stability of the production environment


Predictable evolution of the codebase


Isolation of features


Traceability of changes


Compliance with Tenet’s specification library


Safe collaboration between humans and Codex


Tenet follows a Hybrid Trunk-Based Development strategy.
 This balances speed (for Codex) with safety (for human oversight).

2. Branch Types
Tenet defines six canonical branch types.
 No other branch prefixes are allowed.
2.1 main
Represents production-ready code.


Only updated via approved PRs.


Every commit must be deployable.


Always protected.


2.2 dev
Represents the current stable working state.


Accepts merges from feature, fix, refactor, or integration branches.


Must always compile, typecheck, and pass tests.


2.3 feature/*
Used for new features.
 Examples:
feature/routing-engine-v2


feature/ar-collections-dashboard


feature/agent-memory-cache


Rules:
Branch from dev


Must reference relevant specs in the PR


Must pass all checks before merging back to dev


2.4 fix/*
Used for bug fixes.
 Examples:
fix/invoice-date-parsing


fix/model-gateway-timeout


Rules:
Branch from dev unless it is a production bug


If production bug → hotfix (see section 8)


2.5 refactor/*
Used for non-functional, structural, or cleanup changes.
 Examples:
refactor/auth-service


refactor/component-library


Rules:
Must not change behavior without explicit spec update


Must include before/after architectural reasoning


2.6 integration/*
Used for external system work.
 Examples:
integration/quickbooks-basic


integration/sendgrid-v1


Rules:
Must validate payload shapes


Must respect Tenet integration orchestrator rules



3. Branch Naming Rules
Lowercase letters only


Words separated by hyphens


Prefix must be one of:


feature/


fix/


refactor/


integration/


dev or main (protected)


Examples:
 ✔ feature/sop-editor-ui
 ✔ fix/rls-invoice-scope
 ✘ Feature_newUI (invalid)
 ✘ bugfix-routing (invalid prefix)

4. Commit Standards (Conventional Commits)
Tenet uses Conventional Commits with Tenet-specific scopes.
Format:
<type>(<scope>): <description>
4.1 Allowed types
feat — new feature


fix — bug fix


refactor — non-breaking restructuring


style — formatting only


chore — tooling, config, ci/cd


test — add/update tests


docs — documentation changes


4.2 Allowed scopes
backend service names


frontend modules


hubs (Finance, Growth, People, Ops)


routing engine


agents


sops


api


auth


db


infra


4.3 Examples
feat(routing-engine): add hub-level routing threshold logic
fix(api): correct org_id validation on AR endpoints
refactor(ui): convert SOP editor to server components

5. Pull Request Workflow
Every PR must follow these rules.
5.1 PR Requirements
PR description must include:
Linked spec files governing the change


Summary of feature or fix


Screenshots or Loom video for UI changes


Test coverage summary


Checklist confirmation referencing review-checklist.md


5.2 Technical Requirements
Before merge:
Lint passes


Typecheck passes


Unit tests pass


Integration tests pass (if applicable)


Migrations validated (if DB changes)


RLS verified via test


5.3 Who Can Approve
Human engineers always have merge authority


Codex cannot approve its own PRs


Codex-generated PRs require human approval unless all CI gates enforce safety (future optional mode)


5.4 Merge Rules
feature/* → dev


fix/* → dev unless hotfix


refactor/* → dev


integration/* → dev


dev → main only during release cycle



6. Release Process
Tenet uses Semantic Versioning (SemVer).
Format: major.minor.patch
6.1 When version increments
major → breaking changes or new core modules


minor → new features, routing logic, agent expansions


patch → fixes, refactors, small improvements


6.2 Release Flow
dev → release branch → main → tagged release → deployment
6.3 Tagging
Tags use SemVer:
v1.3.0
v2.0.1

7. Changelog Management
Changelogs are auto-generated from Conventional Commits.
Sections include:
Added


Fixed


Changed


Removed


Security


The changelog must be updated in each release branch.

8. Hotfix Protocol
Hotfix branches are created ONLY for production emergencies.
Process:
main → fix/hotfix-description → PR → main → dev
Rules:
Must include explanation of root cause


Must include regression tests


Must pass full CI


Must not introduce new features



9. CI/CD Gates
To merge into dev or main, CI must verify:
Lint


Type checks


Tests


Security checks


Build integrity


Migration validity


Tenant isolation tests (key RLS tests)


No bypasses allowed.

10. Codex-Specific Rules
Codex must:
Never push directly to main


Always create feature/fix/refactor branches


Always reference relevant specs in each PR


Perform self-check using review-checklist.md


Follow branching standards precisely


Codex is allowed to:
Generate branches


Write commits following Conventional Commits


Submit PRs for human review


Codex is NOT allowed to:
Invent branch types


Merge PRs into protected branches


Update version numbers without user instruction



11. Summary
Tenet uses a strict, telecom-grade version control system designed for:
Predictability


Traceability


Multi-agent collaboration


Enterprise stability


This document defines how ALL contributors — human or Codex — must collaborate.

