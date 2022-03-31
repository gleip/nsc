import * as fs from 'fs/promises';
import Ajv from 'ajv';
import * as serviceSchema from './validators/service_description.schema.json';
import { Service } from './interfaces';

enum COMMANDS {
  BUILD = 'build',
}

export class NSC {
  private command?: string;
  private path?: string;
  constructor() {
    this.command = process.argv[2];
    this.path = process.argv[3];
  }
  public async start() {
    try {
      if (!this.command) {
        throw new Error('Не задана команада');
      }
      switch (this.command) {
        case COMMANDS.BUILD: {
          await this.build();
          break;
        }
        default: {
          throw new Error('Неизвестная команда');
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
      process.exit(1);
    }
  }
  private async build() {
    if (!this.path) {
      throw new Error('Не задан путь к описанию сервиса');
    }
    await fs.access(this.path).catch(() => {
      throw new Error(`Файл описания сервиса ${this.path} не найден или нет прав на чтение`);
    });
    const serviceDescribeRaw = await fs.readFile(this.path);
    const serviceDescribe: Service = JSON.parse(serviceDescribeRaw.toString());
    const serviceValidator = new Ajv().compile(serviceSchema);
    const validDescribe = serviceValidator(serviceDescribe);
    if (!validDescribe) {
      throw new Error(JSON.stringify(serviceValidator.errors));
    }

  }
}

new NSC().start();
