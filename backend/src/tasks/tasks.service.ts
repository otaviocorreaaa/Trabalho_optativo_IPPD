import { Injectable, NotFoundException } from '@nestjs/common';
import { JsonFileStore } from '../common/json-file.store.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

export interface Task {
  id: number;
  descricao: string;
  inicio: number;
  fim: number;
  status: string;
  resultado: number[] | null;
}

@Injectable()
export class TasksService {
  private readonly store = new JsonFileStore<Task>('tasks.json');

  findAll(): Promise<Task[]> {
    return this.store.read();
  }

  async findOne(id: number): Promise<Task> {
    const tasks = await this.store.read();
    return tasks[this.indexOf(tasks, id)];
  }

  create(dto: CreateTaskDto): Promise<Task> {
    return this.store.update((tasks) => {
      const task: Task = {
        id: Math.max(0, ...tasks.map((item) => item.id)) + 1,
        descricao: dto.descricao,
        inicio: dto.inicio,
        fim: dto.fim,
        status: 'PENDENTE',
        resultado: null,
      };
      tasks.push(task);
      return task;
    });
  }

  update(id: number, dto: UpdateTaskDto): Promise<Task> {
    return this.store.update((tasks) => {
      const index = this.indexOf(tasks, id);
      tasks[index] = {
        id,
        descricao: dto.descricao,
        inicio: dto.inicio,
        fim: dto.fim,
        status: dto.status,
        resultado: dto.resultado,
      };
      return tasks[index];
    });
  }

  patch(id: number, dto: Partial<UpdateTaskDto>): Promise<Task> {
    return this.store.update((tasks) => {
      const index = this.indexOf(tasks, id);
      tasks[index] = { ...tasks[index], ...dto, id };
      return tasks[index];
    });
  }

  remove(id: number): Promise<void> {
    return this.store.update((tasks) => {
      tasks.splice(this.indexOf(tasks, id), 1);
    });
  }

  private indexOf(tasks: Task[], id: number): number {
    const index = tasks.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    return index;
  }
}
