# Canon / delivery progress

Statuses: `pending` | `in_progress` | `waiting_user` | `done`

Protocol: `/start` · `/work` · `/next` (skill `ddd-start`).

| # | Stage | Status | Notes |
|---|--------|--------|-------|
| 0 | onboarding | pending | explain `/start` · `/work` · `/next` + stage map |
| 1 | bootstrap | pending | root `npm install`, env, `build:contract`, loop deps |
| 2 | intent | pending | → `canon/01_intent.md` |
| 3 | context | pending | → `canon/02_context/context.md` |
| 4 | event_storming | pending | → `canon/03_event_storming.dio` |
| 5 | event_storming_analysis | pending | agreed event flow |
| 6 | bounded_contexts | pending | → `canon/04_bounded_contexts.md` |
| 7 | domain_model | pending | → `canon/05_domain_model.md` |
| 8 | rules | pending | → `canon/06_rules.md` |
| 9 | use_cases | pending | → `canon/07_use_cases.md` |
| 10 | architecture | pending | → `canon/08_architecture.md` |
| 11 | contract_handoff | pending | `*/project.md` + `contract/plan.yml` only |
| 12 | run_contract_loop | pending | help/spawn contract loop (bg) |
| 13 | review_contract | pending | review; `/next` = approve; `/work` may edit `contract/src` |
| 14 | server_handoff | pending | `server/plan.yml` from approved contract |
| 15 | run_server_loop | pending | help/spawn server loop (bg) |
| 16 | run_client_and_wait | pending | client append/restarts; gate before `/next` |
| 17 | development_complete | pending | formal end; hotpatch in packages |

Current stage: `0` (onboarding)

Last update:
