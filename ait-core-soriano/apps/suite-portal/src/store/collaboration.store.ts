import { create } from 'zustand';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
  };
  lastSeen: Date;
  isActive: boolean;
}

interface CollaborationState {
  activeUsers: CollaborationUser[];
  isCollaborating: boolean;
  documentId: string | null;

  setActiveUsers: (users: CollaborationUser[]) => void;
  addUser: (user: CollaborationUser) => void;
  removeUser: (userId: string) => void;
  updateUserCursor: (userId: string, cursor: { x: number; y: number }) => void;
  startCollaboration: (documentId: string) => void;
  stopCollaboration: () => void;
}

export const useCollaborationStore = create<CollaborationState>((set) => ({
  activeUsers: [],
  isCollaborating: false,
  documentId: null,

  setActiveUsers: (users) =>
    set({
      activeUsers: users,
    }),

  addUser: (user) =>
    set((state) => ({
      activeUsers: [...state.activeUsers, user],
    })),

  removeUser: (userId) =>
    set((state) => ({
      activeUsers: state.activeUsers.filter((user) => user.id !== userId),
    })),

  updateUserCursor: (userId, cursor) =>
    set((state) => ({
      activeUsers: state.activeUsers.map((user) =>
        user.id === userId
          ? {
              ...user,
              cursor,
              lastSeen: new Date(),
            }
          : user
      ),
    })),

  startCollaboration: (documentId) =>
    set({
      isCollaborating: true,
      documentId,
    }),

  stopCollaboration: () =>
    set({
      isCollaborating: false,
      documentId: null,
      activeUsers: [],
    }),
}));
