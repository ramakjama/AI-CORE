# AI Assistant System - Complete Documentation

## Overview

The AI Assistant is a comprehensive, intelligent chat interface integrated into the AIT Suite Portal. It provides contextual AI assistance with streaming responses, command palette, text selection suggestions, and conversation management.

## Features

### 1. AI Assistant Panel (Right Sidebar)
- **Slide-in/out animation** with Framer Motion
- **400px width** responsive panel
- **Chat interface** with message bubbles (user=blue/right, assistant=gray/left)
- **Typing indicator** during AI responses
- **Streaming responses** with real-time updates
- **Suggestion chips** for quick actions
- **Auto-scroll** to bottom on new messages
- **Minimize/maximize** functionality
- **Clear conversation** button
- **New conversation** button
- **Message timestamps**
- **Unread message badge** on topbar button

### 2. Command Palette (Cmd+J / Ctrl+J)
- **Quick access** with keyboard shortcut
- **Predefined AI commands:**
  - `/summarize` (⌘S) - Summarize documents or selected text
  - `/translate` (⌘T) - Translate to Spanish/English
  - `/improve` (⌘I) - Improve writing, grammar, and style
  - `/explain` (⌘E) - Explain concepts in simple terms
  - `/generate` (⌘G) - Generate creative content
- **Search functionality** to filter commands
- **Keyboard navigation** (↑↓ arrows, Enter to select)
- **Context-aware** - Uses selected text if available
- **Auto-opens AI panel** and sends command

### 3. Contextual Suggestions
- **Appears on text selection** anywhere in the app
- **Floating toolbar** with quick actions:
  - Summarize
  - Translate
  - Improve
  - Explain
- **Positioned near selection** with arrow indicator
- **Click suggestion** opens AI panel with pre-filled query
- **Auto-hides** on click outside or Escape key

### 4. Conversation Management
- **Multiple conversations** support
- **Persistent storage** (localStorage)
- **Auto-generated titles** from first message
- **Conversation history** kept (last 10)
- **Clear individual conversations**
- **Switch between conversations**

### 5. Streaming Support
- **Server-Sent Events (SSE)** for real-time responses
- **Fallback** to regular API if streaming fails
- **Progressive message display** as chunks arrive
- **Graceful error handling**

## File Structure

```
apps/suite-portal/
├── src/
│   ├── components/
│   │   └── ai-assistant/
│   │       ├── AIAssistantPanel.tsx       # Main chat panel component
│   │       ├── CommandPalette.tsx         # Cmd+J command interface
│   │       ├── ContextualSuggestions.tsx  # Text selection suggestions
│   │       └── index.tsx                  # Exports
│   ├── store/
│   │   └── ai-assistant.store.ts          # Zustand state management
│   ├── lib/
│   │   └── ai/
│   │       └── assistant-client.ts        # API client with streaming
│   └── hooks/
│       └── use-ai-assistant.ts            # Main hook for AI logic
```

## Components

### AIAssistantPanel.tsx

The main chat interface component.

**Props:** None (uses stores internally)

**Features:**
- Slide-in animation from right side
- Message list with auto-scroll
- Input field with send button
- Typing indicator
- Suggestion chips
- Minimize/maximize controls
- Clear conversation
- New conversation

**Usage:**
```tsx
import { AIAssistantPanel } from '@/components/ai-assistant';

// Already integrated in app-layout.tsx
<AIAssistantPanel />
```

### CommandPalette.tsx

Quick command interface with keyboard shortcuts.

**Keyboard Shortcuts:**
- `Cmd+J` / `Ctrl+J` - Toggle command palette
- `↑↓` - Navigate commands
- `Enter` - Execute selected command
- `Escape` - Close palette

**Commands:**
- `/summarize` - Summarize content
- `/translate` - Translate text
- `/improve` - Improve writing
- `/explain` - Explain concepts
- `/generate` - Generate content

**Usage:**
```tsx
import { CommandPalette } from '@/components/ai-assistant';

<CommandPalette />
```

### ContextualSuggestions.tsx

Text selection suggestions toolbar.

**Features:**
- Auto-appears on text selection
- Floating toolbar with 4 quick actions
- Positioned above selection
- Auto-hides on outside click or Escape
- Mobile-friendly with tooltips

**Usage:**
```tsx
import { ContextualSuggestions } from '@/components/ai-assistant';

<ContextualSuggestions />
```

## State Management

### ai-assistant.store.ts

Zustand store managing AI assistant state.

**State:**
```typescript
interface AIAssistantState {
  conversations: AIConversation[];          // All conversations
  activeConversationId: string | null;     // Current conversation
  isTyping: boolean;                       // AI typing state
  unreadCount: number;                     // Unread messages badge
  suggestions: AISuggestion[];             // Quick action suggestions
}
```

**Actions:**
- `createConversation()` - Create new conversation
- `setActiveConversation(id)` - Switch conversation
- `addMessage(conversationId, message)` - Add message
- `updateMessage(conversationId, messageId, updates)` - Update message
- `removeMessage(conversationId, messageId)` - Remove message
- `clearConversation(conversationId)` - Clear all messages
- `deleteConversation(conversationId)` - Delete conversation
- `setIsTyping(isTyping)` - Set typing state
- `incrementUnreadCount()` - Increment badge
- `resetUnreadCount()` - Reset badge
- `updateConversationTitle(conversationId, title)` - Update title
- `setSuggestions(suggestions)` - Set quick actions

**Persistence:**
- Stores last 10 conversations in localStorage
- Persists active conversation ID
- Auto-restores on page reload

## API Client

### assistant-client.ts

API client for AI Assistant endpoints.

**Methods:**

```typescript
// Send message (non-streaming)
async sendMessage(message: string, conversationId?: string): Promise<SendMessageResponse>

// Send message with streaming (SSE)
async sendMessageStream(options: StreamMessageOptions): Promise<void>

// Get conversation by ID
async getConversation(conversationId: string): Promise<AssistantConversation>

// List all conversations
async listConversations(): Promise<AssistantConversation[]>

// Create new conversation
async createConversation(title?: string): Promise<CreateConversationResponse>

// Delete conversation
async deleteConversation(conversationId: string): Promise<void>

// Clear all conversations
async clearAllConversations(): Promise<void>

// Execute command
async executeCommand(command: string, context?: string, conversationId?: string): Promise<SendMessageResponse>
```

**Streaming Support:**

```typescript
await assistantClient.sendMessageStream({
  message: 'Your question here',
  conversationId: 'conv-123',
  onChunk: (chunk) => {
    console.log('Received chunk:', chunk);
  },
  onComplete: (fullResponse) => {
    console.log('Complete response:', fullResponse);
  },
  onError: (error) => {
    console.error('Error:', error);
  }
});
```

## Hook

### use-ai-assistant.ts

Main hook for AI assistant functionality.

**Usage:**

```typescript
import { useAIAssistant } from '@/hooks/use-ai-assistant';

function MyComponent() {
  const {
    messages,              // Current conversation messages
    sendMessage,           // Send message function
    isTyping,             // AI typing state
    currentConversation,  // Active conversation ID
    clearConversation,    // Clear current conversation
    suggestions,          // Quick action suggestions
    createNewConversation, // Create new conversation
    error                 // Error state
  } = useAIAssistant();

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <button onClick={() => sendMessage('Hello!')}>
        Send
      </button>
    </div>
  );
}
```

**Features:**
- Auto-creates conversation if needed
- Handles streaming responses
- Updates messages in real-time
- Fallback to non-streaming on error
- Increments unread count when panel closed
- Auto-sets conversation title from first message

## Integration

### In app-layout.tsx

The AI Assistant is integrated into the main app layout:

```tsx
import { AIAssistantPanel, CommandPalette, ContextualSuggestions } from '@/components/ai-assistant';

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div>
      {/* ... other components ... */}

      {/* AI Assistant Panel */}
      <AIAssistantPanel />

      {/* AI Command Palette (Cmd+J) */}
      <CommandPalette />

      {/* Contextual Suggestions on Text Selection */}
      <ContextualSuggestions />
    </div>
  );
}
```

### In topbar.tsx

AI Assistant button with unread count badge:

```tsx
import { useAIAssistantStore } from '@/store/ai-assistant.store';

const { unreadCount: aiUnreadCount, resetUnreadCount: resetAIUnreadCount } = useAIAssistantStore();

<button
  onClick={() => {
    toggleAIAssistant();
    resetAIUnreadCount();
  }}
>
  <Sparkles className="w-5 h-5" />
  {aiUnreadCount > 0 && (
    <span className="badge">{aiUnreadCount}</span>
  )}
</button>
```

## Backend Requirements

### API Endpoints

The AI Assistant expects these endpoints:

#### POST /assistant/messages
Send a message to the AI assistant.

**Request:**
```json
{
  "message": "Your question here",
  "conversation_id": "optional-conversation-id"
}
```

**Response:**
```json
{
  "id": "msg-123",
  "role": "assistant",
  "content": "AI response here",
  "conversationId": "conv-123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### POST /assistant/messages/stream
Stream a message response via Server-Sent Events.

**Request:**
```json
{
  "message": "Your question here"
}
```

**Query Params:**
- `conversation_id` (optional)

**Response:** SSE stream
```
data: {"content": "Hello", "delta": "Hello"}
data: {"content": " there", "delta": " there"}
data: [DONE]
```

#### GET /assistant/conversations
List all conversations.

**Response:**
```json
[
  {
    "id": "conv-123",
    "title": "My Conversation",
    "messages": [...],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
]
```

#### GET /assistant/conversations/:id
Get a specific conversation.

**Response:**
```json
{
  "id": "conv-123",
  "title": "My Conversation",
  "messages": [
    {
      "id": "msg-1",
      "role": "user",
      "content": "Hello",
      "timestamp": "2024-01-15T10:30:00Z",
      "conversationId": "conv-123"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:35:00Z"
}
```

#### POST /assistant/conversations
Create a new conversation.

**Request:**
```json
{
  "title": "New Conversation"
}
```

**Response:**
```json
{
  "id": "conv-123",
  "title": "New Conversation",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### DELETE /assistant/conversations/:id
Delete a specific conversation.

**Response:** 204 No Content

#### DELETE /assistant/conversations
Clear all conversations.

**Response:** 204 No Content

## Styling

### Dark Mode Support

All components support dark mode using Tailwind's `dark:` variant:

```tsx
className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
```

### Animations

Using Framer Motion for smooth animations:

```tsx
// Slide in from right
<motion.div
  initial={{ x: 400, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: 400, opacity: 0 }}
  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
>
```

### Colors

- **AI Assistant Theme:** Purple (`purple-600`, `purple-500`)
- **User Messages:** Blue (`blue-600`)
- **Assistant Messages:** Gray (`gray-100`, `gray-800`)
- **Icons:** Gray with hover effects

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+J` / `Ctrl+J` | Toggle Command Palette |
| `Cmd+S` | Summarize command |
| `Cmd+T` | Translate command |
| `Cmd+I` | Improve writing command |
| `Cmd+E` | Explain command |
| `Cmd+G` | Generate content command |
| `↑↓` | Navigate commands in palette |
| `Enter` | Execute selected command |
| `Escape` | Close palette/suggestions |

## Troubleshooting

### Streaming not working

If streaming fails, the system automatically falls back to regular API:

```typescript
try {
  await sendMessageStream(...);
} catch (err) {
  // Fallback to regular API
  const response = await sendMessage(...);
}
```

### Messages not appearing

1. Check if conversation is created:
   ```typescript
   const { currentConversation } = useAIAssistant();
   console.log('Current conversation:', currentConversation);
   ```

2. Check store state:
   ```typescript
   const { conversations } = useAIAssistantStore();
   console.log('All conversations:', conversations);
   ```

### Panel not opening

1. Check store state:
   ```typescript
   const { isAIAssistantOpen } = useAppStore();
   console.log('Panel open:', isAIAssistantOpen);
   ```

2. Ensure components are added to layout:
   ```tsx
   <AIAssistantPanel />  // In app-layout.tsx
   ```

### Unread count not updating

Reset unread count when opening panel:

```typescript
const { resetUnreadCount } = useAIAssistantStore();

onClick={() => {
  toggleAIAssistant();
  resetUnreadCount();  // Add this
}}
```

## Future Enhancements

### Planned Features

1. **Voice Input** - Speak to AI assistant
2. **File Attachments** - Send images, documents
3. **Code Highlighting** - Syntax highlighting for code blocks
4. **Markdown Rendering** - Rich text formatting
5. **Conversation Search** - Search through all conversations
6. **Export Conversations** - Download as PDF, TXT
7. **AI Settings** - Configure model, temperature, etc.
8. **Multi-language Support** - UI in multiple languages
9. **Conversation Sharing** - Share conversations with team
10. **AI Model Selection** - Choose different AI models

### API Enhancements

1. **Conversation tags** - Categorize conversations
2. **Conversation folders** - Organize conversations
3. **Conversation pinning** - Pin important conversations
4. **Message reactions** - React to AI responses
5. **Message editing** - Edit sent messages
6. **Regenerate response** - Ask AI to try again
7. **Response rating** - Rate AI responses
8. **Context retention** - Remember previous conversations

## Dependencies

Required packages (already in package.json):

```json
{
  "framer-motion": "^11.1.7",
  "lucide-react": "^0.376.0",
  "zustand": "^4.5.2",
  "nanoid": "^5.0.7",
  "axios": "^1.6.8"
}
```

## TypeScript Types

All components and hooks are fully typed with TypeScript for type safety and IntelliSense support.

Key types:

```typescript
// Message
interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

// Conversation
interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Suggestion
interface AISuggestion {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}
```

## License

Part of the AIT-CORE Suite Portal. All rights reserved.

## Support

For issues or questions, please contact the development team or open an issue in the repository.

---

**Version:** 1.0.0
**Last Updated:** January 2025
**Author:** AIT-CORE Development Team
