# Backend

Primeira parte do trabalho optativo de IPPD. API feita em NestJS com dois módulos: `tasks` e `books`.

Os dados ficam salvos em `data/tasks.json` e `data/books.json`.

## Como rodar

```bash
npm install
npm run start
```

O servidor sobe em `http://localhost:3000`.

## Rotas

Vale para `/tasks` e para `/books`:

- `GET /tasks`
- `GET /tasks/:id`
- `POST /tasks`
- `PUT /tasks/:id`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`

## Testes

```bash
npm run test:e2e
```
