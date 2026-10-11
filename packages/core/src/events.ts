export interface DomainEvents {
  'user.created': { userId: string };
}

type Handler<K extends keyof DomainEvents> = (payload: DomainEvents[K]) => void | Promise<void>;

export function createEventBus() {
  const handlers = new Map<keyof DomainEvents, Set<Handler<keyof DomainEvents>>>();

  return {
    on<K extends keyof DomainEvents>(name: K, handler: Handler<K>): () => void {
      const set = handlers.get(name) ?? new Set();
      set.add(handler as Handler<keyof DomainEvents>);
      handlers.set(name, set);
      return () => set.delete(handler as Handler<keyof DomainEvents>);
    },
    async emit<K extends keyof DomainEvents>(name: K, payload: DomainEvents[K]): Promise<void> {
      const set = handlers.get(name);
      if (!set) return;
      await Promise.all([...set].map(async (handler) => handler(payload)));
    },
  };
}

export type EventBus = ReturnType<typeof createEventBus>;

export const events: EventBus = createEventBus();
