import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('aiCore', {
  ping: () => 'pong',
});
