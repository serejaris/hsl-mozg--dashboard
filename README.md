# hsl-mozg--dashboard

Исторический dashboard/Next.js слой вокруг `hsl-mozg`: UI, тесты и идеи, которые позже должны были объединиться с bot/dashboard в основной `hsl-mozg` monorepo.

## Что внутри

| Путь | Роль |
|---|---|
| `app/` | Next.js routes |
| `components/` | UI-компоненты |
| `lib/` | application logic |
| `tests/` | Vitest tests |
| `docs/` | заметки по dashboard |
| `CLAUDE.md` | repo-level правила |

## Границы

- Основной бот, оплаты и воронка живут в `hsl-mozg`.
- Этот repo не считать live source of truth без проверки деплоя/owner.
- Если задача про объединение bot + dashboard, сначала сверить актуальное состояние `hsl-mozg`.
