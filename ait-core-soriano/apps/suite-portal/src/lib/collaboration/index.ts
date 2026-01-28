/**
 * Collaboration Library
 *
 * Core Y.js collaboration infrastructure
 */

export {
  YjsProvider,
  createYjsProvider,
  Y,
} from './yjs-provider';
export type {
  AwarenessUser,
  ConnectionStatus,
  YjsProviderConfig,
} from './yjs-provider';

export {
  CollaborationManager,
  createCollaborationManager,
} from './collaboration-manager';
export type {
  CollaborationConfig,
  CollaborationEventHandlers,
} from './collaboration-manager';
