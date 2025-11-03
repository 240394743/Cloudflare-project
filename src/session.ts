// src/session.ts

export class FitnessSession {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  // Handle requests sent directly to this Durable Object
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/reset") {
      await this.state.storage.deleteAll();
      return new Response("Session reset");
    }

    // Example: store and retrieve a counter
    let count = (await this.state.storage.get<number>("count")) || 0;
    count++;
    await this.state.storage.put("count", count);

    return new Response(`Hello from FitnessSession DO. Count = ${count}`);
  }
}