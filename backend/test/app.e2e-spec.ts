import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

async function startApp(): Promise<INestApplication<App>> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  await app.init();
  return app;
}

const resources = [
  {
    route: '/tasks',
    file: 'tasks.json',
    create: { descricao: 'Calcular primos', inicio: 1, fim: 100 },
    defaults: { status: 'PENDENTE', resultado: null },
    replace: {
      descricao: 'Calcular pares',
      inicio: 2,
      fim: 20,
      status: 'CONCLUIDA',
      resultado: [2, 4],
    },
    partial: { status: 'EM_ANDAMENTO' },
  },
  {
    route: '/books',
    file: 'books.json',
    create: { titulo: 'Dom Casmurro', autor: 'Machado de Assis', ano: 1899 },
    defaults: { lido: false },
    replace: {
      titulo: 'Memórias Póstumas',
      autor: 'Machado de Assis',
      ano: 1881,
      lido: true,
    },
    partial: { lido: true },
  },
];

describe.each(resources)(
  '$route (e2e)',
  ({ route, file, create, defaults, replace, partial }) => {
    let app: INestApplication<App>;
    let dataDir: string;

    const api = () => request(app.getHttpServer());

    beforeEach(async () => {
      // Diretório temporário: os testes não tocam nos dados reais em data/.
      dataDir = await mkdtemp(join(tmpdir(), 'backend-e2e-'));
      process.env.DATA_DIR = dataDir;
      app = await startApp();
    });

    afterEach(async () => {
      await app.close();
      delete process.env.DATA_DIR;
      await rm(dataDir, { recursive: true, force: true });
    });

    it('POST cria e GET retorna o item', async () => {
      const created = await api().post(route).send(create).expect(201);
      expect(created.body).toEqual({ id: 1, ...create, ...defaults });

      await api().get(route).expect(200, [created.body]);
      await api().get(`${route}/1`).expect(200, created.body);
    });

    it('PUT substitui o item inteiro', async () => {
      await api().post(route).send(create).expect(201);

      const updated = await api().put(`${route}/1`).send(replace).expect(200);
      expect(updated.body).toEqual({ id: 1, ...replace });
      await api().get(`${route}/1`).expect(200, updated.body);
    });

    it('PATCH altera só os campos enviados e não muda o id', async () => {
      await api().post(route).send(create).expect(201);

      const patched = await api()
        .patch(`${route}/1`)
        .send({ ...partial, id: 99 })
        .expect(200);
      expect(patched.body).toEqual({
        id: 1,
        ...create,
        ...defaults,
        ...partial,
      });
      await api().get(`${route}/1`).expect(200, patched.body);
    });

    it('DELETE remove o item', async () => {
      await api().post(route).send(create).expect(201);

      await api().delete(`${route}/1`).expect(200);
      await api().get(`${route}/1`).expect(404);
      await api().get(route).expect(200, []);
    });

    it('responde 404 para id inexistente e 400 para id inválido', async () => {
      await api().get(`${route}/999`).expect(404);
      await api().put(`${route}/999`).send(replace).expect(404);
      await api().patch(`${route}/999`).send(partial).expect(404);
      await api().delete(`${route}/999`).expect(404);
      await api().get(`${route}/abc`).expect(400);
    });

    it('grava no arquivo JSON e mantém os dados após reiniciar', async () => {
      const created = await api().post(route).send(create).expect(201);

      const onDisk = await readFile(join(dataDir, file), 'utf-8');
      expect(JSON.parse(onDisk)).toEqual([created.body]);

      await app.close();
      app = await startApp();

      await api().get(route).expect(200, [created.body]);
    });

    it('não perde itens nem repete ids em requisições simultâneas', async () => {
      const responses = await Promise.all(
        Array.from({ length: 10 }, () => api().post(route).send(create)),
      );

      const ids = responses.map(
        (response) => (response.body as { id: number }).id,
      );
      expect(new Set(ids).size).toBe(10);

      const all = await api().get(route).expect(200);
      expect(all.body).toHaveLength(10);
    });
  },
);
