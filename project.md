# Starter monorepo (root)

Contract-first monorepo: `contract/` (`@repo/contract`) · `server/` · `client/`.

## Роль этого контура

**Handoff only.** Root-агент (Cursor или Pi) продумывает задачу и заполняет пакетные
`plan.yml`, продуктовый `project.md` и при необходимости `openspec/config.yaml`.
До handoff пакетные `project.md` пустые; архитектурные правила живут в `*/AGENTS.md`.
Код фич в `contract|server|client/src` из корня **не** пишется.

## Агенты

- Root: **Cursor или Pi** (OpenSpec: `.cursor/skills` + `.agents/skills`).
- Пакеты: **только Pi** + loop с `projectPath` = каталог пакета.

## Pipeline

1. Root handoff → `contract/plan.yml` + `server/plan.yml` (включая `add_to_client_plan_*`); `client/plan.yml` пуст.
2. loop@contract → review.
3. loop@server → по плану; `add_to_client_plan_*` append’ит slug в `client/plan.yml`.
4. loop@client → late-join / рестарт при новых строках в plan.
5. Hotfix — Pi cwd в пакете.

См. корневой `README.md` § «Агенты, OpenSpec и loop».
