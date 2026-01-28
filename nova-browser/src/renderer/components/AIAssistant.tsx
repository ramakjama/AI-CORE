import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Send,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Globe,
  FileText,
  Code,
  Image,
} from 'lucide-react';
import { useBrowserStore } from '../stores/browserStore';

interface AIAssistantProps {
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAssistant({ onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m Nova AI, your intelligent browser assistant powered by AI Innovation Technologies.\n\nI can help you:\n\n• Summarize web pages\n• Answer questions about content\n• Translate text\n• Generate code\n• Search for information\n\nHow can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { tabs, activeTab } = useBrowserStore();

  const currentTab = tabs.find(t => t.id === activeTab);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      const responses = [
        'I\'ve analyzed your request. Based on the current page context...',
        'Great question! Let me process that information...',
        'Here\'s a summary of what I found:',
        'I\'ve searched the web and these are the most relevant results:',
      ];

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)] + '\n\nThis is a demonstration of Nova AI. In the full version, you\'d have access to an advanced language model for precise and contextual responses.\n\n*Powered by AI Innovation Technologies*',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const quickActions = [
    { icon: FileText, label: 'Summarize', action: () => setInput('Summarize this page') },
    { icon: Globe, label: 'Translate', action: () => setInput('Translate this page to Spanish') },
    { icon: Code, label: 'Explain code', action: () => setInput('Explain the code on this page') },
    { icon: Image, label: 'Describe', action: () => setInput('Describe the images on this page') },
  ];

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="absolute right-0 top-0 bottom-0 w-[400px] bg-nova-white/95 backdrop-blur-xl border-l border-black/10 flex flex-col shadow-tech-hover"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-black/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nova-tech to-nova-cyber flex items-center justify-center shadow-glow-tech">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-nova-black">Nova AI</h3>
            <p className="text-[11px] text-nova-graphite">Intelligent Assistant</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-black/5 rounded-lg transition-colors"
          title="Close AI assistant"
        >
          <X className="w-5 h-5 text-nova-graphite" />
        </button>
      </div>

      {/* Context indicator */}
      {currentTab && currentTab.url !== 'nova://newtab' && (
        <div className="px-4 py-2 bg-nova-pearl/50 border-b border-black/5">
          <p className="text-[10px] text-nova-graphite uppercase tracking-wider font-medium">Current Context</p>
          <p className="text-[12px] text-nova-charcoal truncate mt-0.5">{currentTab.title}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map(message => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-nova-black text-white'
                  : 'bg-nova-pearl text-nova-charcoal border border-black/5'
              }`}
            >
              <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{message.content}</p>

              {message.role === 'assistant' && (
                <div className="flex items-center gap-1 mt-3 pt-2 border-t border-black/10">
                  <button type="button" className="p-1.5 hover:bg-black/5 rounded transition-colors" title="Copy">
                    <Copy className="w-3 h-3 text-nova-graphite" />
                  </button>
                  <button type="button" className="p-1.5 hover:bg-black/5 rounded transition-colors" title="Good response">
                    <ThumbsUp className="w-3 h-3 text-nova-graphite" />
                  </button>
                  <button type="button" className="p-1.5 hover:bg-black/5 rounded transition-colors" title="Bad response">
                    <ThumbsDown className="w-3 h-3 text-nova-graphite" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-nova-graphite"
          >
            <Loader2 className="w-4 h-4 animate-spin text-nova-tech" />
            <span className="text-[12px]">Nova AI is thinking...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {messages.length <= 1 && (
        <div className="px-4 py-3 border-t border-black/5">
          <p className="text-[10px] text-nova-graphite uppercase tracking-wider font-medium mb-2">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={action.action}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-nova-pearl hover:bg-nova-silver/30 rounded-lg text-[11px] text-nova-charcoal font-medium transition-colors border border-black/5"
              >
                <action.icon className="w-3 h-3 text-nova-tech" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-black/5">
        <div className="flex items-center gap-2 bg-nova-pearl rounded-xl px-4 py-2.5 border border-black/5 focus-within:border-nova-tech/30 focus-within:shadow-glow-tech transition-all">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent text-nova-black placeholder-nova-graphite outline-none text-[13px]"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            title="Send message"
            className={`p-2 rounded-lg transition-all ${
              input.trim() && !isLoading
                ? 'bg-nova-black text-white hover:bg-nova-charcoal'
                : 'bg-nova-silver/30 text-nova-graphite'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-nova-steel mt-2 text-center">
          Nova AI may make mistakes. Verify important information.
        </p>
      </div>
    </motion.div>
  );
}
