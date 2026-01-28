import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';
import type { Message } from '@/types/chat';

const mockMessage: Message = {
  id: '1',
  conversationId: 'conv-1',
  role: 'user',
  content: 'Hello, this is a test message',
  timestamp: new Date('2024-01-27T10:00:00'),
};

const mockAssistantMessage: Message = {
  id: '2',
  conversationId: 'conv-1',
  role: 'assistant',
  content: 'Hello! How can I help you?',
  timestamp: new Date('2024-01-27T10:01:00'),
};

describe('MessageBubble', () => {
  beforeAll(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });
  });

  it('renders user message correctly', () => {
    render(<MessageBubble message={mockMessage} />);

    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('renders assistant message correctly', () => {
    render(<MessageBubble message={mockAssistantMessage} />);

    expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument();
  });

  it('applies correct styling for user messages', () => {
    const { container } = render(<MessageBubble message={mockMessage} />);

    const bubble = container.querySelector('.bg-blue-600');
    expect(bubble).toBeInTheDocument();
  });

  it('applies correct styling for assistant messages', () => {
    const { container } = render(<MessageBubble message={mockAssistantMessage} />);

    const bubble = container.querySelector('.bg-gray-100');
    expect(bubble).toBeInTheDocument();
  });

  it('calls onCopy when copy button is clicked', async () => {
    const onCopy = jest.fn();
    render(
      <MessageBubble message={mockAssistantMessage} onCopy={onCopy} />
    );

    const copyButton = screen.getByTitle('Copiar');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        mockAssistantMessage.content
      );
      expect(onCopy).toHaveBeenCalled();
    });
  });

  it('calls onFeedback when thumbs up is clicked', () => {
    const onFeedback = jest.fn();
    render(
      <MessageBubble message={mockAssistantMessage} onFeedback={onFeedback} />
    );

    const thumbsUpButton = screen.getByTitle('Me gusta');
    fireEvent.click(thumbsUpButton);

    expect(onFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: 'positive',
      })
    );
  });

  it('calls onFeedback when thumbs down is clicked', () => {
    const onFeedback = jest.fn();
    render(
      <MessageBubble message={mockAssistantMessage} onFeedback={onFeedback} />
    );

    const thumbsDownButton = screen.getByTitle('No me gusta');
    fireEvent.click(thumbsDownButton);

    expect(onFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: 'negative',
      })
    );
  });

  it('calls onRegenerate when regenerate button is clicked', () => {
    const onRegenerate = jest.fn();
    render(
      <MessageBubble
        message={mockAssistantMessage}
        onRegenerate={onRegenerate}
      />
    );

    const regenerateButton = screen.getByTitle('Regenerar respuesta');
    fireEvent.click(regenerateButton);

    expect(onRegenerate).toHaveBeenCalled();
  });

  it('shows error status when message has error', () => {
    const errorMessage: Message = {
      ...mockMessage,
      status: 'error',
    };

    render(<MessageBubble message={errorMessage} />);

    expect(screen.getByText('Error al enviar')).toBeInTheDocument();
  });

  it('shows streaming animation when isStreaming is true', () => {
    const { container } = render(
      <MessageBubble message={mockAssistantMessage} isStreaming={true} />
    );

    const bubble = container.querySelector('.animate-pulse');
    expect(bubble).toBeInTheDocument();
  });

  it('does not show action buttons for user messages', () => {
    render(<MessageBubble message={mockMessage} />);

    expect(screen.queryByTitle('Copiar')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Me gusta')).not.toBeInTheDocument();
  });

  it('hides action buttons when streaming', () => {
    render(
      <MessageBubble message={mockAssistantMessage} isStreaming={true} />
    );

    expect(screen.queryByTitle('Copiar')).not.toBeInTheDocument();
  });
});
