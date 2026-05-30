import type { IPC } from '../../../shared/constants/ipc'

declare global {
  interface Window {
    api: {
      invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>
      IPC: typeof IPC
    },
  }
}
