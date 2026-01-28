import { render, screen } from '@testing-library/react';
import { TypingIndicator } from '../TypingIndicator';

describe('TypingIndicator', () => {
  it('renders when show is true', () => {
    render(<TypingIndicator show={true} />);

    expect(screen.getByText('Pensando...')).toBeInTheDocument();
  });

  it('does not render when show is false', () => {
    const { container } = render(<TypingIndicator show={false} />);

    expect(container.firstChild).toBeNull();
  });

  it('displays custom message', () => {
    render(<TypingIndicator show={true} message="Escribiendo respuesta..." />);

    expect(screen.getByText('Escribiendo respuesta...')).toBeInTheDocument();
  });

  it('renders AI avatar', () => {
    render(<TypingIndicator show={true} />);

    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('renders animated dots', () => {
    const { container } = render(<TypingIndicator show={true} />);

    const dots = container.querySelectorAll('.animate-bounce');
    expect(dots).toHaveLength(3);
  });
});
