import { Injectable, NotFoundException } from '@nestjs/common';
import { JsonFileStore } from '../common/json-file.store.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';

export interface Book {
  id: number;
  titulo: string;
  autor: string;
  ano: number;
  lido: boolean;
}

@Injectable()
export class BooksService {
  private readonly store = new JsonFileStore<Book>('books.json');

  findAll(): Promise<Book[]> {
    return this.store.read();
  }

  async findOne(id: number): Promise<Book> {
    const books = await this.store.read();
    return books[this.indexOf(books, id)];
  }

  create(dto: CreateBookDto): Promise<Book> {
    return this.store.update((books) => {
      const book: Book = {
        id: Math.max(0, ...books.map((item) => item.id)) + 1,
        titulo: dto.titulo,
        autor: dto.autor,
        ano: dto.ano,
        lido: false,
      };
      books.push(book);
      return book;
    });
  }

  update(id: number, dto: UpdateBookDto): Promise<Book> {
    return this.store.update((books) => {
      const index = this.indexOf(books, id);
      books[index] = {
        id,
        titulo: dto.titulo,
        autor: dto.autor,
        ano: dto.ano,
        lido: dto.lido,
      };
      return books[index];
    });
  }

  patch(id: number, dto: Partial<UpdateBookDto>): Promise<Book> {
    return this.store.update((books) => {
      const index = this.indexOf(books, id);
      books[index] = { ...books[index], ...dto, id };
      return books[index];
    });
  }

  remove(id: number): Promise<void> {
    return this.store.update((books) => {
      books.splice(this.indexOf(books, id), 1);
    });
  }

  private indexOf(books: Book[], id: number): number {
    const index = books.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException('Livro não encontrado');
    }
    return index;
  }
}
