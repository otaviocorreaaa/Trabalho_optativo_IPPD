# Backend NestJS: Tasks e Books

API REST com dois módulos, cada um persistido em um arquivo JSON:

| Módulo | Rota base | Arquivo           | Campos                                              |
| ------ | --------- | ----------------- | --------------------------------------------------- |
| Tasks  | `/tasks`  | `data/tasks.json` | `descricao`, `inicio`, `fim`, `status`, `resultado` |
| Books  | `/books`  | `data/books.json` | `titulo`, `autor`, `ano`, `lido`                    |

## Como executar

```bash
npm install
npm run start
```

O servidor sobe em `http://localhost:3000`. Use a variável `PORT` para trocar a porta.

## Rotas

`/tasks` e `/books` têm os mesmos métodos:

| Método | Caminho       | Descrição                    |
| ------ | ------------- | ---------------------------- |
| GET    | `/tasks`      | Lista todos os itens         |
| GET    | `/tasks/:id`  | Retorna um item              |
| POST   | `/tasks`      | Cria um item                 |
| PUT    | `/tasks/:id`  | Substitui o item inteiro     |
| PATCH  | `/tasks/:id`  | Altera só os campos enviados |
| DELETE | `/tasks/:id`  | Remove um item               |

Exemplos:

```bash
curl -X POST localhost:3000/tasks -H "Content-Type: application/json" -d '{"descricao":"Calcular primos","inicio":1,"fim":100}'
curl -X PATCH localhost:3000/tasks/1 -H "Content-Type: application/json" -d '{"status":"CONCLUIDA"}'

curl -X POST localhost:3000/books -H "Content-Type: application/json" -d '{"titulo":"Dom Casmurro","autor":"Machado de Assis","ano":1899}'
curl -X PUT localhost:3000/books/1 -H "Content-Type: application/json" -d '{"titulo":"Dom Casmurro","autor":"Machado de Assis","ano":1899,"lido":true}'
```

## Testes

```bash
npm run test:e2e
```

Os testes cobrem todas as rotas dos dois módulos, a gravação no arquivo JSON, a
permanência dos dados após reiniciar a aplicação e requisições simultâneas. Eles
usam um diretório temporário (variável `DATA_DIR`), sem alterar `data/`.
