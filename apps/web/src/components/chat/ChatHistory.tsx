'use client';

import { useState } from 'react';
import type { ChatHistoryProps } from '@/types/chat';
import {
  MessageSquare,
  Plus,
  Trash2,
  Search,
  Calendar,
  Loader2,
} from 'lucide-react';

export function ChatHistory({
  conversations,
  currentConversationId,
  onConversationSelect,
  onConversationDelete,
  onNewConversation,
  isLoading = false,
}: ChatHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (deleteConfirm === id) {
      onConversationDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;

    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  };

  const groupConversationsByDate = () => {
    const groups: { [key: string]: typeof conversations } = {
      Hoy: [],
      Ayer: [],
      'Últimos 7 días': [],
      'Últimos 30 días': [],
      Anteriores: [],
    };

    const now = new Date();

    filteredConversations.forEach((conv) => {
      const date = new Date(conv.updatedAt);
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        groups['Hoy'].push(conv);
      } else if (days === 1) {
        groups['Ayer'].push(conv);
      } else if (days < 7) {
        groups['Últimos 7 días'].push(conv);
      } else if (days < 30) {
        groups['Últimos 30 días'].push(conv);
      } else {
        groups['Anteriores'].push(conv);
      }
    });

    return Object.entries(groups).filter(([_, convs]) => convs.length > 0);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">Nueva conversación</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              {searchQuery
                ? 'No se encontraron conversaciones'
                : 'No hay conversaciones aún'}
            </p>
          </div>
        ) : (
          <div>
            {groupConversationsByDate().map(([groupName, groupConvs]) => (
              <div key={groupName} className="mb-4">
                <div className="px-4 py-2 flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {groupName}
                  </h3>
                </div>

                <div className="space-y-1 px-2">
                  {groupConvs.map((conversation) => {
                    const isActive = conversation.id === currentConversationId;
                    const isDeleting = deleteConfirm === conversation.id;

                    return (
                      <div
                        key={conversation.id}
                        onClick={() => onConversationSelect(conversation.id)}
                        className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-purple-50 dark:bg-purple-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <MessageSquare
                          className={`w-4 h-4 flex-shrink-0 ${
                            isActive
                              ? 'text-purple-600'
                              : 'text-gray-400 group-hover:text-gray-600'
                          }`}
                        />

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              isActive
                                ? 'text-purple-900 dark:text-purple-100'
                                : 'text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            {conversation.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {conversation.metadata?.messageCount || 0} mensajes •{' '}
                            {formatDate(conversation.updatedAt)}
                          </p>
                        </div>

                        <button
                          onClick={(e) => handleDelete(conversation.id, e)}
                          className={`flex-shrink-0 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100 ${
                            isDeleting ? 'opacity-100' : ''
                          }`}
                          title={isDeleting ? 'Confirmar eliminación' : 'Eliminar'}
                        >
                          <Trash2
                            className={`w-4 h-4 ${
                              isDeleting
                                ? 'text-red-600'
                                : 'text-gray-400 hover:text-red-500'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
