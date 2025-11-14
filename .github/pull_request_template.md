Is this complete 

# Pull Request Template

**File:** `.github/pull_request_template.md`
**Purpose:** Ensure every PR to the Tenet codebase (human or Codex-generated) is consistent, traceable, spec-aligned, and compliant with Tenet’s engineering standards.

Copy of this file will live at:
`.github/pull_request_template.md`

---

# 🧩 PR Summary

**Describe what this PR does.**
Include a high-level overview of what changed and why.

> *Example: Implements AR Collections Routing (v1) according to routing-engine-spec.md.*

---

# 🔗 Relevant Specification Files

**List every spec file that governs this change.**
*(Codex: this is required.)*

* [ ] PRD
* [ ] architecture.md
* [ ] data-model.md
* [ ] api-spec.md
* [ ] routing-engine-spec.md
* [ ] agents-and-sops-spec.md
* [ ] prompts-and-ai-config.md
* [ ] ux-flows.md
* [ ] style-guide.md
* [ ] design-principles.md
* [ ] coding-standards.md
* [ ] security-and-compliance.md
* [ ] testing-and-quality.md
* [ ] version-control-and-branching.md
* [ ] integrations.md
* [ ] deployment-and-env.md
* [ ] Other: ___________________

> *Codex MUST fill this out using the uploaded markdown context before generating code.*

---

# 🧪 Testing & Verification

**Check all that apply and add notes for each one completed.**

## Backend / API

* [ ] Unit tests added / updated
* [ ] Integration tests (API) added / updated
* [ ] Zod validation added for new inputs
* [ ] AI output validation implemented
* [ ] DB queries reviewed for RLS compliance
* [ ] Migrations tested locally

## Frontend / UI

* [ ] Matches ux-flows.md
* [ ] Matches style-guide.md
* [ ] Matches design-principles.md
* [ ] Includes loading, empty, and error states
* [ ] Mobile/desktop responsiveness tested

## AI & Routing

* [ ] Routing logic matches routing-engine-spec.md
* [ ] Agent/SOP behavior matches agents-and-sops-spec.md
* [ ] Prompt structure matches prompts-and-ai-config.md
* [ ] AI outputs validated + repair/retry logic added
* [ ] Logs updated (routing trace, model info, SOP invoked)

## Security

* [ ] No secrets in code
* [ ] RLS validated (multi-tenant isolation)
* [ ] Sensitive fields not logged
* [ ] Auth boundaries tested

> *Attach screenshots, sample API calls, or logs when relevant.*

---

# 📂 File & Structure Verification

Check that file placement matches the repo standards.

* [ ] Correct file paths used
* [ ] Architecture consistent with architecture.md
* [ ] Components not duplicated
* [ ] No dead code or commented-out logic

---

# 📝 PR Checklist (Required)

This PR passes the requirements defined in **review-checklist.md**:

* [ ] Code Quality & Architecture ✓
* [ ] Types & Validation ✓
* [ ] Error Handling ✓
* [ ] UX/UI Consistency ✓
* [ ] AI Behavior & Safety ✓
* [ ] Integrations Review ✓
* [ ] Deployment Readiness ✓
* [ ] Documentation & PR Hygiene ✓

> *Codex must perform a full internal run-through of review-checklist.md before submitting the PR.*

---

# 🚦 Merge Intent

Select one:

* [ ] Merge into `dev`
* [ ] Merge into `main` (release only)
* [ ] Hotfix → `main` → `dev`

---

# 👀 Screenshots / Loom / Logs

Attach supporting materials for reviewers:

* UI screenshots
* API request/response examples
* Routing trace samples
* AI output before/after validation logs

---

# 🗣 Reviewer Notes

Explain anything reviewers should know:

> *Example: This PR touches routing. Special attention needed on AR invoice flow due to RLS edge case.*

---

# 🧾 Additional Context (Optional)

Anything else relevant for human reviewers or future readers.

> *Codex: include any assumptions, open questions, or spec gaps discovered.*