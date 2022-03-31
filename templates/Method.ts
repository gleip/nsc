@related
export class MethodSum {
  private emitter: { sumElapsedEvent: (params: { result: number }) => void };
  @
  public async handler({ a, b }: { a: number; b: number }): Promise<{ result: number }> {
    const start = Date.now();
    const result = this.sum(a, b);
    const finish = Date.now();
    this.emitter.sumElapsedEvent({ result: finish - start });
    return { result };
  }
  private sum(a: number, b: number) {
    return a + b;
  }
}
