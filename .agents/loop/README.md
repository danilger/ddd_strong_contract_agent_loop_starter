{ "projectPath": "D:\\projects\\loop_test2" }

# loop2

LangGraph-оркестратор OpenSpec-цикла: по `plan.yml` последовательно запускает Pi-агента (`propose → apply → sync → archive`) и крутит луп, пока в плане не кончатся changes.

Схема потока: [`schema.dio`](./schema.dio).

## Что делает

1. Проверяет обязательные файлы в целевом проекте.
2. Если есть активный change из `plan.yml` — сразу `apply` (resume).
3. Иначе берёт следующий slug из `plan.yml`, которого ещё нет в `archive/`, и делает `propose`.
4. После успешного apply → sync → archive → снова проверка активных changes.
5. При ошибке агента или артефактов — стоп без retry.

## Требования к целевому проекту

В корне `project_path` должны быть:

- `project.md`
- `plan.yml` — список slug, **по одному на строку** (не полноценный YAML)
- `openspec/config.yaml`
- `AGENTS.md`

Changes вне `plan.yml` игнорируются.

`plan.yml` **только для чтения** оркестратором/Pi: нельзя править, ставить `[x]` или иначе отмечать этапы — прогресс только через OpenSpec archive.

## Env (`.env`)

| Переменная | Назначение |
|---|---|
| `ROLE_PLAN_MODEL` | модель для `/opsx-propose` |
| `ROLE_CODE_MODEL` | модель для apply / sync / archive |
| `ROLE_REVIEW_MODEL` | зарезервировано (пока не используется) |
| `PROJECT_PATH` | fallback для Studio, если в input нет `projectPath` |
| `PI_AGENT_PORT` | порт для дочерних процессов Pi (по умолчанию `3000`), чтобы не конфликтовать со Studio |
| `PI_SHELL_PATH` | путь к bash для Pi (на Windows — Git Bash, чтобы не брать WSL без `node`) |
| `PI_VERBOSE` | `1` / `true` — человекочитаемый лог Pi в консоль (thinking, tools, results); также `npm run dev:log` |

Плюс ключи провайдера моделей, как требует ваша установка Pi (`DEEPSEEK_API_KEY` / `OPENAI_API_KEY` / …).

Первая строка этого файла — пример input для LangGraph Studio:

```json
{ "projectPath": "D:\\projects\\loop_test2" }
```

## Запуск

```bash
npm install
```

CLI:

```bash
npm run cli -- <project_path>
# или
npx tsx src/cli.ts <project_path>
```

LangGraph Studio / dev:

```bash
npm run dev       # обычный режим
npm run dev:log   # Studio + человекочитаемый лог Pi (PI_VERBOSE=1)
```

Тот же лог для CLI:

```bash
npx cross-env PI_VERBOSE=1 npm run cli -- <project_path>
```

Граф: `openspec_loop` (`langgraph.json`). В Studio передайте input с `projectPath` (см. первую строку README).

Typecheck:

```bash
npm run typecheck
```

## Контракт успеха по шагам

| Шаг | OK |
|---|---|
| propose | exit 0 + `openspec/changes/{change}/` с `proposal.md` и `tasks.md` |
| apply | exit 0 + в `tasks.md` нет незакрытых `- [ ]` |
| sync | exit 0 |
| archive | нет `changes/{change}/`, есть след в `changes/archive/` |

## Структура

```
src/
  graph.ts          # StateGraph
  state.ts          # GraphState + Route
  cli.ts            # CLI entry
  config.ts         # .env, модели по ролям
  lib/
    pi.ts           # запуск Pi SDK
    plan.ts         # чтение plan.yml
    openspecFs.ts   # FS: active/archive/выбор change
    artifacts.ts    # валидация артефактов
  nodes/            # ноды графа
```
