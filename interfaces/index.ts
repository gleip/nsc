export interface Service {
  name: string;
  description: string;
  methods: {
    name: string;
    description: string;
    request: Record<string, unknown>;
    response: Record<string, unknown>;
  }[];
  events?: {
    name: string;
    description: string;
    event: Record<string, unknown>;
  }[];
}

export interface Baggage {
  traceId: string;
  timeout: number;
}

export interface BaseMessage<M = unknown> {
  payload: M;
  baggage: Baggage;
}
