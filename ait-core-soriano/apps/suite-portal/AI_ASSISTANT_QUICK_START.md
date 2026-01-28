# AI Assistant - Quick Start Guide

## Overview

Complete AI Assistant system with chat interface, command palette, and contextual suggestions.

## What's Included

✅ **AIAssistantPanel** - Right sidebar chat interface (400px wide)
✅ **CommandPalette** - Quick AI commands (Cmd+J)
✅ **ContextualSuggestions** - Text selection toolbar
✅ **Streaming Responses** - Real-time AI responses via SSE
✅ **Conversation Management** - Multiple conversations with persistence
✅ **Unread Badge** - Notification count on topbar button
✅ **Dark Mode Support** - Full dark mode compatibility
✅ **TypeScript** - Fully typed with IntelliSense

## Usage

### 1. Open AI Assistant

Click the sparkle icon (✨) in the topbar to open the AI assistant panel.

### 2. Send a Message

Type your question in the input field and press Enter or click Send.

### 3. Use Quick Commands (Cmd+J)

Press `Cmd+J` (or `Ctrl+J`) to open the command palette:

- **`/summarize`** - Summarize documents or text
- **`/translate`** - Translate to Spanish/English
- **`/improve`** - Improve writing quality
- **`/explain`** - Explain concepts simply
- **`/generate`** - Generate creative content

### 4. Select Text for Suggestions

Select any text in the app to see contextual suggestions:
- Summarize
- Translate
- Improve
- Explain

Click a suggestion to send it to AI assistant with the selected text.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+J` | Open command palette |
| `Cmd+S` | Summarize command |
| `Cmd+T` | Translate command |
| `Cmd+I` | Improve command |
| `Cmd+E` | Explain command |
| `Cmd+G` | Generate command |
| `Escape` | Close palette/suggestions |

## Features

### Chat Panel

- **Streaming responses** - See AI responses in real-time
- **Message history** - All messages saved automatically
- **Typing indicator** - Shows when AI is thinking
- **Suggestion chips** - Quick action buttons
- **Auto-scroll** - Scrolls to latest message
- **Minimize/maximize** - Collapse panel to save space
- **Clear conversation** - Start fresh

### Conversation Management

- **Multiple conversations** - Switch between different chats
- **Auto-save** - Conversations saved to localStorage
- **Smart titles** - Auto-generated from first message
- **Persistent** - Keeps last 10 conversations

### Unread Messages

- **Badge count** - Shows unread messages on topbar
- **Auto-reset** - Clears when panel opened
- **Pulse animation** - Alerts on new messages

## Files Created

```
apps/suite-portal/src/
├── components/ai-assistant/
│   ├── AIAssistantPanel.tsx          ✅ Main chat panel
│   ├── CommandPalette.tsx            ✅ Command interface (Cmd+J)
│   ├── ContextualSuggestions.tsx     ✅ Text selection suggestions
│   └── index.tsx                     ✅ Exports
├── store/
│   └── ai-assistant.store.ts         ✅ Zustand state management
├── lib/ai/
│   └── assistant-client.ts           ✅ API client + streaming
└── hooks/
    └── use-ai-assistant.ts           ✅ Main AI hook
```

## Integration

Already integrated in:

- ✅ **app-layout.tsx** - All components added
- ✅ **topbar.tsx** - AI button with unread badge

## Backend API Required

The frontend expects these endpoints:

### Essential Endpoints

```
POST   /assistant/messages              # Send message (non-streaming)
POST   /assistant/messages/stream       # Send message (SSE streaming)
GET    /assistant/conversations         # List conversations
GET    /assistant/conversations/:id     # Get conversation
POST   /assistant/conversations         # Create conversation
DELETE /assistant/conversations/:id     # Delete conversation
DELETE /assistant/conversations         # Clear all conversations
```

### Example Backend Response

**POST /assistant/messages**
```json
{
  "id": "msg-123",
  "role": "assistant",
  "content": "Hello! How can I help you today?",
  "conversationId": "conv-456",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**POST /assistant/messages/stream** (SSE)
```
data: {"content": "Hello", "delta": "Hello"}
data: {"content": "! How", "delta": "! How"}
data: {"content": " can I help", "delta": " can I help"}
data: [DONE]
```

## Testing Without Backend

For testing without a backend, you can mock the API:

```typescript
// In assistant-client.ts, add mock mode
const MOCK_MODE = true;

if (MOCK_MODE) {
  // Return mock responses
  return {
    id: nanoid(),
    role: 'assistant',
    content: 'This is a mock response. Connect to real API for actual AI.',
    conversationId: conversationId || nanoid(),
    timestamp: new Date().toISOString()
  };
}
```

## Styling

### Colors

- **Primary Theme:** Purple (`purple-600`, `purple-500`)
- **User Messages:** Blue (`blue-600`)
- **Assistant Messages:** Gray (`gray-100` / `gray-800`)

### Dark Mode

All components support dark mode automatically:
- White backgrounds → Dark gray
- Light text → White text
- Subtle borders maintained

### Animations

- **Slide-in panel** - Smooth spring animation
- **Message fade-in** - Each message animates
- **Typing dots** - Pulse animation
- **Badge pulse** - On new messages

## Customization

### Change Panel Width

```tsx
// In AIAssistantPanel.tsx
className="w-[400px]"  // Change to w-[500px] for wider
```

### Add Custom Commands

```tsx
// In CommandPalette.tsx
const AI_COMMANDS = [
  {
    id: 'custom',
    name: 'Custom Command',
    description: 'Your custom AI command',
    icon: YourIcon,
    command: '/custom',
    shortcut: '⌘C',
    category: 'custom',
  },
  // ... existing commands
];
```

### Change Suggestions

```tsx
// In ai-assistant.store.ts
const defaultSuggestions = [
  {
    id: '1',
    label: 'Your Custom Suggestion',
    prompt: '/your-prompt',
    icon: '🎯',
  },
  // ... existing suggestions
];
```

## Troubleshooting

### Panel Not Opening

1. Check store state: `useAppStore().isAIAssistantOpen`
2. Verify components added to layout
3. Check console for errors

### Streaming Not Working

1. Verify backend SSE endpoint
2. Check CORS headers
3. Falls back to regular API automatically

### Messages Not Saving

1. Check localStorage quota
2. Verify `persist` middleware in store
3. Clear localStorage and retry

## Next Steps

1. **Connect Backend API** - Implement required endpoints
2. **Test Streaming** - Verify SSE responses work
3. **Customize Styling** - Adjust colors and sizes
4. **Add More Commands** - Extend command palette
5. **Train AI Model** - Fine-tune for your use case

## Support

See full documentation in `AI_ASSISTANT_README.md`

---

**Status:** ✅ Complete and Ready to Use
**Version:** 1.0.0
**Created:** January 2025
