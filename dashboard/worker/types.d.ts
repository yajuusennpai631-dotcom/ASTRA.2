import 'hono';

declare module 'hono' {
  interface ContextVariableMap {
    adminUser: { id: string; username: string; avatar: string | null };
  }
}