import { connect, NatsConnection, JSONCodec } from 'nats';
import { Baggage } from '../interfaces';
import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';

class Client extends EventEmitter {
  private baggage?: Baggage;
  constructor(private natsClient: NatsConnection) {
    super();
    const symElapsedSubscribe = natsClient.subscribe('maths.sum.elapsed');
    for await (const message of symElapsedSubscribe) {
    }
  }
  private generateBaggage(): Baggage {
    if (this.baggage) {
      const inThisMoment = Date.now();
      if (inThisMoment >= this.baggage.timeout) {
        throw new Error('Время на выполнение метода истекло');
      }
      return this.baggage;
    }
    return {
      traceId: randomUUID(),
      timeout: Date.now() + 5_000_000,
    };
  }
  public async sum(params: { a: number; b: number }): Promise<{ result: number }> {
    if (this.baggage) {
    }
    const message = JSONCodec().encode({
      payload: params,
      baggage: this.generateBaggage(),
    });
    const result = await this.natsClient.request('maths.sum', message);
    return JSONCodec<{ payload: { result: number }; baggage: Baggage }>().decode(result.data).payload;
  }
}

(async () => {
  const natsClient = await connect({ servers: ['localhost:4222'] });
  const client = new Client(natsClient);
  const result = await client.sum({ a: 10, b: 15 }); 
  console.log(result);
})();
