# Разработка в `server/`

Сервер — **DDD + CQRS + domain events** поверх `@nestjs/cqrs`.
Живой эталон BC: [`src/auth/`](./src/auth/) + persistence [`src/db/`](./src/db/) (SQLite).
Каркас имён/слоёв (CRUD, read-only): [`.agents/examples/server/src/user/`](../.agents/examples/server/src/user/).
Новый код **копирует каркас слоёв** в `server/src/<slug>/`, не use case-ы и не application-`*Service`.

## Контекст конкретного приложения
Общие правила архитектуры — в этом файле.
Детали логики и функционала **этого** продукта (домены, роли, сценарии, ограничения ТЗ) —
в [`project.md`](./project.md).

До завершения **contract handoff** (этап 10) `project.md` пуст (или только заголовок-заглушка).
`plan.yml` без рабочих slug до **server handoff** (этап 11 / `/handoff-server`) после approve контракта.
Root-агент заполняет его под задачу; Pi/loop читает оба файла.

## Направление зависимостей

```text
presentation → application → domain
infrastructure → application (реализует порты)
```

**Запрещено:** domain/application → Nest HTTP, Drizzle, `@repo/contract`.


| Слой               | Путь                   | Ответственность                                                       |
| ------------------ | ---------------------- | --------------------------------------------------------------------- |
| **Domain**         | `**/domain/`**         | `AggregateRoot`, VO, `*.domain-event.ts`, локальные инварианты        |
| **Application**    | `**/application/`**    | commands, queries, handlers, event-handlers, write/read **ports**     |
| **Infrastructure** | `**/infrastructure/`** | `*RepositoryAdapter` — Drizzle, `*Schema.safeParse`                   |
| **Presentation**   | `**/presentation/`**   | ts-rest controller, `CommandBus`/`QueryBus`, command/dto **adapters** |




## CQRS (обязательно)

- **Commands** — мутации: `*.command.ts` + `*.command.handler.ts`, `@CommandHandler`.
- **Queries** — чтение: `*.query.ts` + `*.query.handler.ts`, `@QueryHandler`.
- Модуль: `imports: [CqrsModule]`, все handlers в `providers`.
- Контроллер **не** инжектит handlers напрямую — только `CommandBus` / `QueryBus`.



### Write handler

- Принимает **Command** (не HTTP DTO).
- Загружает/создаёт агрегат через **WriteRepositoryPort**.
- Мутирует через методы агрегата.
- Выполняет все `save()` только внутри `unitOfWork.execute(...)`.
- `eventPublisher.mergeObjectContext(aggregate)` → `unitOfWork.execute(() => save)` → `aggregate.commit()`.
- `commit()` вызывается только после успешного завершения UoW.



### Query handler

- Принимает **Query**.
- Читает **ReadModel** через **ReadRepositoryPort**.
- **Не** загружает `AggregateRoot` для простого GET/list.



## Порты репозиториев (write / read)

```typescript
// Write — агрегат
interface XWriteRepositoryPort {
  save(aggregate: X): Promise<void>;
  loadById(id: string): Promise<X | null>;
  delete(id: string): Promise<void>;
}

// Read — плоская модель для API
interface XReadRepositoryPort {
  findById(id: string): Promise<XReadModel | null>;
  findAll(): Promise<XReadModel[]>;
}
```

- Один `DrizzleXRepositoryAdapter` может реализовать **оба** порта (`useExisting` в module).
- **Запрещён** `update(id, dto)` в порте — update только через load → aggregate method → save.



## Unit of Work

- Любой вызов `.save(...)` в `server/src/**/*.ts` разрешён только внутри callback `unitOfWork.execute(...)`.
- Несколько записей одного command handler — в одном UoW и одной транзакции.
- Domain events публикуются через `commit()` только после успешного UoW.



## Domain events

- События в `domain/events/*.domain-event.ts`.
- Агрегат: `apply(new XDomainEvent(...))` в методах мутации.
- Подписчики: `application/event-handlers/*.domain-event.handler.ts`, `@EventsHandler`.
- После persist: `commit()` публикует события в `EventBus`.



## Контракт `@repo/contract` — только на границе


| Разрешено                                                   | Запрещено                                             |
| ----------------------------------------------------------- | ----------------------------------------------------- |
| `presentation/*-command.adapter.ts` — DTO → Command         | import contract в `application/commands/*.handler.ts` |
| `presentation/*-dto.adapter.ts` — ReadModel/Aggregate → DTO | import contract в `domain/**`                         |
| `infrastructure/**` — `*Schema.safeParse`                   | DTO в `*WriteRepositoryPort`                          |




## Presentation

- `@TsRestHandler(..., { validateResponses: true })`.
- Create/update/delete: `commandBus.execute(adapter.adapt(body))`.
- Get/list: `queryBus.execute(new GetXQuery(...))`.
- Маппинг ответа: `*DtoAdapter.adaptFromAggregate` (write) / `adaptFromReadModel` (read).



## GoF-нейминг (обязательный для server-кода)

- Формат: `<domain>.<pattern>` в файлах, `<Domain><Pattern>` в классах.
- CQRS-эталон имён и слоёв: `src/auth/` (живой) и `.agents/examples/server/src/user/` (CRUD-каркас).
- Запрещено: `*UseCase`, `use-cases/`, `*Service` для application-логики, `*Repository` без `.adapter` или `.port`.



### Стандартные CQRS/DDD имена — не нарушение

- `*.controller.ts`, `*.module.ts`, `*.command.ts`, `*.command.handler.ts`
- `*.query.ts`, `*.query.handler.ts`
- `*.repository.adapter.ts`, `*.repository.port.ts`
- `*.domain-event.handler.ts`, `*.domain-event.ts`
- классы `*Controller`, `*Module`, `*Command`, `*Query`, `*Handler`, `*Adapter`, `*Port`, `*DomainEvent`
- `class * extends AggregateRoot` в `*.entity.ts`



## Инварианты



### Локальные — в domain (VO, методы агрегата)



### С внешними данными — в command handler через write port



### Глобальные / конкуренция — БД (unique) + обработка ошибок в infra/application



## Domain Service

**Не создавать**, если логика помещается в одном агрегате или это простая оркестрация в handler.

**Создавать только если** логика затрагивает несколько агрегатов с бизнес-правилами и нет явного владельца.
Domain Service живёт в `domain/`, без I/O и без Nest/портов/infra.

## Infrastructure и БД

- `safeParse` строк БД через схемы из `@repo/contract`.
- `server/src/db/schema.ts`: compile-time `IsExact` row ↔ contract schema.
- Ошибки БД не протекают наружу как raw SQL.



## Модуль Nest (`<slug>.module.ts`)

```typescript
@Module({
  imports: [CqrsModule],
  controllers: [...],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
    ...Adapters,
    DrizzleXRepositoryAdapter,
    { provide: X_WRITE_REPOSITORY, useExisting: DrizzleXRepositoryAdapter },
    { provide: X_READ_REPOSITORY, useExisting: DrizzleXRepositoryAdapter },
  ],
})
```



## Запрещено

- Единый `XRepositoryPort` без write/read split для новых модулей.
- Бизнес-логика в контроллере или drizzle-adapter (кроме persist/validate/map).
- Прямой contract DTO в command handler.
- Вызов `.save(...)` вне callback `unitOfWork.execute(...)`.



## Domain docs (draw.io)

После **создания** BC (`server/src/<slug>/`) или **изменения** структуры/файлов слоёв BC — актуализировать карты (cwd = `server/`):

1. Tactical map: `npm run docs:domain-map -- <slug>` → `src/<slug>/docs/.dio`
2. Strategic map + domain.md: `npm run docs:context-map -- --context <slug>` → `docs/contextMap.dio`, `docs/<slug>/domain.md`

Skills: `.agents/skills/domain-drawio-map`, `.agents/skills/context-map-drawio`
(`/skill:domain-drawio-map`, `/skill:context-map-drawio`).

Эталон вёрстки: `example.*.dio` в скиллах; живой пример — `.agents/examples/server/src/user/docs/.dio`.



## Loop / Pi и client handoff

- Агент: **только Pi** (loop `projectPath` = `server/`).
- Не менять `contract/src/**`, `client/src/**`, `client/openspec/**`.
- `plan.yml` наполняет **root** на **server-handoff** (этап 11), только после явного approve готового контракта — не на contract handoff.
  До того файл пуст / только `#` (без рабочих slug).
- Очередь UI планирует root в `server/plan.yml`. Типы slug’ов:
  - обычный BC/code change (например `create_authorization_bc`);
  - `add_to_client_plan_<client-slug>` — полноценный OpenSpec-change в **server** openspec;
    apply = **append-only** одна строка `<client-slug>` в конец `../client/plan.yml`.
- **Не** писать client-slug (`create_auth_ui` и т.п.) строками в `server/plan.yml` —
  только через префикс `add_to_client_plan_`.
- Server **не** решает сам, когда кормить client: только исполняет порядок плана.
- Append: не overwrite; не править/удалять существующие строки; не `[x]` в чужом plan.



## Enforcement

- При падении lint/arch/build исправлять код под архитектуру, а не ослаблять правила.
- Не добавлять `eslint-disable` и не менять arch/eslint-конфиг без явного запроса.
- Финальная проверка после server-изменений: `npm run check` (из `server/`).
- Устаревший `docs/.dio` / context map после изменения BC — незавершённая работа (как красный `check`).



## Чеклист перед завершением

1. Новый код повторяет структуру `src/auth/` или `.agents/examples/server/src/user/`?
2. Все `save()` внутри UoW, `commit()` — после успеха?
3. Query не трогает write port?
4. Application/domain без `@repo/contract`?
5. Карта `src/<slug>/docs/.dio` актуальна (`npm run docs:domain-map -- <slug>`)?
6. Context map / `docs/<slug>/domain.md` синхронизированы (`npm run docs:context-map -- --context <slug>`)?
7. Если текущий change — `add_to_client_plan_*`: в `../client/plan.yml` дописан нужный slug (append-only)?
8. `npm run check` зелёный (для code/BC changes)?

