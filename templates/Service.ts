import { connect, NatsConnection, JSONCodec } from 'nats';
import { Baggage, BaseMessage } from '../interfaces';
import { MethodSum } from './Method';

export interface ServiceStartParams {
  servers: string[];
}

class Service {
  private natsClient?: NatsConnection;
  constructor(private servers: string[]) {}
  public async start() {
    try {
      this.natsClient = await connect({
        servers: this.servers,
      });
      const sumMethod = this.natsClient.subscribe('maths.sum');
      for await (const message of sumMethod) {
        const decodedMessage = JSONCodec<BaseMessage<{ a: number; b: number }>>().decode(message.data);
        // Здесь создаем каждую необходимую зависимость с нужным контекстом из багажа,
        // а также прокидываем в контекст emitter для генераци событий. По сути это preHandle.
        const context = new MethodSum();
        context['emitter'] = {
          sumElapsedEvent: this.getEvent<{ result: number }>('maths.sum.elapsed', decodedMessage.baggage),
        };
        const result = {
          payload: await context.handler.call(context, decodedMessage.payload),
          baggage: decodedMessage.baggage,
        };
        message.respond(this.buildMessage(result));
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.name, error.message);
      } else {
        console.error('Не удалось подключиться к Nats', error);
      }
      process.exit(1);
    }
  }
  private getEvent<P>(subject: string, baggage: Baggage) {
    return (params: P) => {
      if (!this.natsClient) {
        throw new Error('Нет подключения к Nats');
      }
      this.natsClient.publish(subject, this.buildMessage({ params, baggage }));
    };
  }
  private buildMessage(message: unknown) {
    return Buffer.from(JSON.stringify(message));
  }
}

new Service(['localhost:4222']).start();
