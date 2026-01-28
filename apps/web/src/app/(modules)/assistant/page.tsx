'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ChatHistory } from '@/components/chat/ChatHistory';
import { ContextPanel } from '@/components/chat/ContextPanel';
import { useChat, useChatContext } from '@/hooks/chat';
import type { QuickAction } from '@/types/chat';
import { Search, Loader2 } from 'lucide-react';
import { chatApi } from '@/lib/api/chat-api';

const contextSuggestions: QuickAction[] = [
  {
    id: 'ctx-1',
    label: '¿Cómo actualizar datos del cliente?',
    prompt: '¿Cómo puedo actualizar los datos de este cliente en el sistema?',
    category: 'Cliente',
  },
  {
    id: 'ctx-2',
    label: '¿Ver historial de pólizas?',
    prompt: '¿Cómo puedo ver el historial completo de pólizas de este cliente?',
    category: 'Cliente',
  },
  {
    id: 'ctx-3',
    label: '¿Renovar esta póliza?',
    prompt: '¿Cuál es el procedimiento para renovar esta póliza?',
    category: 'Póliza',
  },
  {
    id: 'ctx-4',
    label: '¿Modificar coberturas?',
    prompt: '¿Cómo puedo modificar las coberturas de esta póliza?',
    category: 'Póliza',
  },
];

export default function AssistantPage() {
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [knowledgeSearchQuery, setKnowledgeSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const { context } = useChatContext();

  const {
    currentConversation,
    conversations,
    isLoading,
    loadConversation,
    createConversation,
    deleteConversation,
  } = useChat({
    conversationId: currentConversationId,
    userId: 'current-user-id',
    companyId: 'current-company-id',
    context,
  });

  useEffect(() => {
    const loadConversations = async () => {
      const response = await chatApi.getConversations(1, 20);
      if (response.success && response.data?.conversations) {
        if (response.data.conversations.length > 0) {
          setCurrentConversationId(response.data.conversations[0].id);
        }
      }
    };

    loadConversations();
  }, []);

  const handleConversationSelect = async (id: string) => {
    setCurrentConversationId(id);
    await loadConversation(id);
  };

  const handleNewConversation = async () => {
    const id = await createConversation({
      title: 'Nueva conversación',
      context,
    });

    if (id) {
      setCurrentConversationId(id);
    }
  };

  const handleKnowledgeSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!knowledgeSearchQuery.trim()) return;

    setIsSearching(true);

    try {
      const response = await chatApi.searchKnowledge({
        query: knowledgeSearchQuery,
        limit: 5,
      });

      if (response.success && response.data) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error('Knowledge search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const getSuggestionsForContext = () => {
    if (!context || context.type === 'general') {
      return [];
    }

    return contextSuggestions.filter((s) =>
      s.category?.toLowerCase().includes(context.type || '')
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Left Sidebar - Chat History */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-800">
        <ChatHistory
          conversations={conversations}
          currentConversationId={currentConversationId}
          onConversationSelect={handleConversationSelect}
          onConversationDelete={deleteConversation}
          onNewConversation={handleNewConversation}
          isLoading={isLoading}
        />
      </div>

      {/* Center - Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Knowledge Base Search Header */}
        <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <form onSubmit={handleKnowledgeSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en la base de conocimientos..."
              value={knowledgeSearchQuery}
              onChange={(e) => setKnowledgeSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-500 animate-spin" />
            )}
          </form>

          {searchResults.length > 0 && (
            <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-purple-900 dark:text-purple-100 mb-2">
                Se encontraron {searchResults.length} artículos:
              </p>
              <div className="space-y-1">
                {searchResults.slice(0, 3).map((result) => (
                  <a
                    key={result.id}
                    href={result.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    • {result.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            conversationId={currentConversationId}
            context={context}
            showHeader={true}
            showQuickActions={!currentConversation || currentConversation.messages.length === 0}
            onNewConversation={handleNewConversation}
          />
        </div>
      </div>

      {/* Right Sidebar - Context Panel */}
      <div className="w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-800">
        <ContextPanel
          context={context}
          suggestions={getSuggestionsForContext()}
          onSuggestionClick={(suggestion) => {
            console.log('Suggestion clicked:', suggestion);
          }}
        />
      </div>
    </div>
  );
}
