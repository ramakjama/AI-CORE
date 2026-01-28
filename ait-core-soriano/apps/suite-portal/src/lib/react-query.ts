import { QueryClient, DefaultOptions } from '@tanstack/react-query';

// Default options for React Query
const defaultOptions: DefaultOptions = {
  queries: {
    // Data is considered fresh for 5 minutes
    staleTime: 5 * 60 * 1000,

    // Cache data for 10 minutes
    gcTime: 10 * 60 * 1000,

    // Don't refetch on window focus
    refetchOnWindowFocus: false,

    // Don't refetch on reconnect
    refetchOnReconnect: false,

    // Don't refetch on mount
    refetchOnMount: false,

    // Retry failed requests once
    retry: 1,

    // Retry delay
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  mutations: {
    // Retry failed mutations once
    retry: 1,

    // Retry delay
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
};

// Create Query Client
export const queryClient = new QueryClient({
  defaultOptions,
});

// Query keys factory for consistent cache management
export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'] as const,
  },

  // Storage
  storage: {
    all: ['storage'] as const,
    files: (folderId?: string) =>
      [...queryKeys.storage.all, 'files', folderId] as const,
    file: (fileId: string) => [...queryKeys.storage.all, 'file', fileId] as const,
    shares: (fileId: string) =>
      [...queryKeys.storage.all, 'shares', fileId] as const,
    search: (query: string) =>
      [...queryKeys.storage.all, 'search', query] as const,
  },

  // Documents
  documents: {
    all: ['documents'] as const,
    list: () => [...queryKeys.documents.all, 'list'] as const,
    detail: (documentId: string) =>
      [...queryKeys.documents.all, 'detail', documentId] as const,
  },

  // Mail
  mail: {
    all: ['mail'] as const,
    emails: (params?: { folder?: string; page?: number; limit?: number }) =>
      [...queryKeys.mail.all, 'emails', params] as const,
    email: (emailId: string) => [...queryKeys.mail.all, 'email', emailId] as const,
  },

  // Calendar
  calendar: {
    all: ['calendar'] as const,
    events: (params?: { start?: string; end?: string }) =>
      [...queryKeys.calendar.all, 'events', params] as const,
    event: (eventId: string) =>
      [...queryKeys.calendar.all, 'event', eventId] as const,
  },

  // Tasks
  tasks: {
    all: ['tasks'] as const,
    list: (params?: { project_id?: string; status?: string }) =>
      [...queryKeys.tasks.all, 'list', params] as const,
    detail: (taskId: string) => [...queryKeys.tasks.all, 'detail', taskId] as const,
    projects: () => [...queryKeys.tasks.all, 'projects'] as const,
  },

  // CRM
  crm: {
    all: ['crm'] as const,
    contacts: (params?: { page?: number; limit?: number; search?: string }) =>
      [...queryKeys.crm.all, 'contacts', params] as const,
    contact: (contactId: string) =>
      [...queryKeys.crm.all, 'contact', contactId] as const,
    notes: (contactId: string) =>
      [...queryKeys.crm.all, 'notes', contactId] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    usage: (period?: string) =>
      [...queryKeys.analytics.all, 'usage', period] as const,
  },

  // Collaboration
  collaboration: {
    all: ['collaboration'] as const,
    sessions: (documentId: string) =>
      [...queryKeys.collaboration.all, 'sessions', documentId] as const,
    activeUsers: (sessionId: string) =>
      [...queryKeys.collaboration.all, 'active-users', sessionId] as const,
  },

  // Spreadsheets
  spreadsheets: {
    all: ['spreadsheets'] as const,
    list: () => [...queryKeys.spreadsheets.all, 'list'] as const,
    detail: (spreadsheetId: string) =>
      [...queryKeys.spreadsheets.all, 'detail', spreadsheetId] as const,
    sheet: (spreadsheetId: string, sheetId: string) =>
      [...queryKeys.spreadsheets.all, 'sheet', spreadsheetId, sheetId] as const,
  },

  // Presentations
  presentations: {
    all: ['presentations'] as const,
    list: () => [...queryKeys.presentations.all, 'list'] as const,
    detail: (presentationId: string) =>
      [...queryKeys.presentations.all, 'detail', presentationId] as const,
    slide: (presentationId: string, slideId: string) =>
      [...queryKeys.presentations.all, 'slide', presentationId, slideId] as const,
  },

  // AI Assistant
  assistant: {
    all: ['assistant'] as const,
    conversations: () => [...queryKeys.assistant.all, 'conversations'] as const,
    conversation: (conversationId: string) =>
      [...queryKeys.assistant.all, 'conversation', conversationId] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (params?: { page?: number; unread_only?: boolean }) =>
      [...queryKeys.notifications.all, 'list', params] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
};

// Helper function to invalidate related queries
export const invalidateQueries = {
  storage: () => queryClient.invalidateQueries({ queryKey: queryKeys.storage.all }),
  documents: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.documents.all }),
  mail: () => queryClient.invalidateQueries({ queryKey: queryKeys.mail.all }),
  calendar: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all }),
  tasks: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  crm: () => queryClient.invalidateQueries({ queryKey: queryKeys.crm.all }),
  collaboration: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.collaboration.all }),
  spreadsheets: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.spreadsheets.all }),
  presentations: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.presentations.all }),
  assistant: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.assistant.all }),
  notifications: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
};

// Prefetch helpers
export const prefetchQueries = {
  storage: {
    files: (folderId?: string) =>
      queryClient.prefetchQuery({
        queryKey: queryKeys.storage.files(folderId),
        queryFn: async () => {
          const { storage } = await import('./api');
          return storage.listFiles(folderId);
        },
      }),
  },

  documents: {
    list: () =>
      queryClient.prefetchQuery({
        queryKey: queryKeys.documents.list(),
        queryFn: async () => {
          const { documents } = await import('./api');
          return documents.list();
        },
      }),
  },

  calendar: {
    events: (params?: { start?: string; end?: string }) =>
      queryClient.prefetchQuery({
        queryKey: queryKeys.calendar.events(params),
        queryFn: async () => {
          const { calendar } = await import('./api');
          return calendar.listEvents(params);
        },
      }),
  },

  tasks: {
    list: (params?: { project_id?: string; status?: string }) =>
      queryClient.prefetchQuery({
        queryKey: queryKeys.tasks.list(params),
        queryFn: async () => {
          const { tasks } = await import('./api');
          return tasks.listTasks(params);
        },
      }),
  },
};

// Optimistic update helpers
export const optimisticUpdate = {
  // Update a single item in a list
  updateListItem: <T extends { id: string }>(
    queryKey: readonly unknown[],
    itemId: string,
    updater: (item: T) => T
  ) => {
    queryClient.setQueryData<T[]>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((item) =>
        item.id === itemId ? updater(item) : item
      );
    });
  },

  // Add an item to a list
  addListItem: <T>(queryKey: readonly unknown[], newItem: T) => {
    queryClient.setQueryData<T[]>(queryKey, (oldData) => {
      if (!oldData) return [newItem];
      return [newItem, ...oldData];
    });
  },

  // Remove an item from a list
  removeListItem: <T extends { id: string }>(
    queryKey: readonly unknown[],
    itemId: string
  ) => {
    queryClient.setQueryData<T[]>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      return oldData.filter((item) => item.id !== itemId);
    });
  },
};

// Export for use in providers
export { QueryClient } from '@tanstack/react-query';
