import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/**
 * Coleção persistida em um arquivo JSON.
 *
 * Todas as operações passam por uma única fila. Assim, o ciclo
 * "ler, alterar, gravar" de uma requisição nunca se intercala com o de outra,
 * o que causaria ids duplicados e alterações perdidas.
 */
export class JsonFileStore<T> {
  private readonly filePath: string;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(fileName: string) {
    const dataDir = process.env.DATA_DIR ?? join(process.cwd(), 'data');
    this.filePath = join(dataDir, fileName);
  }

  read(): Promise<T[]> {
    return this.enqueue(() => this.load());
  }

  /** Executa `change` sobre os itens e grava o arquivo se não houver erro. */
  update<R>(change: (items: T[]) => R): Promise<R> {
    return this.enqueue(async () => {
      const items = await this.load();
      const result = change(items);
      await this.save(items);
      return result;
    });
  }

  private enqueue<R>(job: () => Promise<R>): Promise<R> {
    const run = this.queue.then(job);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async load(): Promise<T[]> {
    try {
      return JSON.parse(await readFile(this.filePath, 'utf-8')) as T[];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private async save(items: T[]): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(items, null, 2), 'utf-8');
  }
}
