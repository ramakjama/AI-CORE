import { render, screen, fireEvent } from '@testing-library/react';
import { QuickActions } from '../QuickActions';
import type { QuickAction } from '@/types/chat';

const mockActions: QuickAction[] = [
  {
    id: '1',
    label: '¿Cómo emitir una póliza?',
    prompt: '¿Cómo emitir una póliza de auto?',
    icon: '🚗',
    category: 'Pólizas',
  },
  {
    id: '2',
    label: '¿Qué coberturas tiene Occident Hogar?',
    prompt: '¿Cuáles son las coberturas del seguro Occident Hogar?',
    icon: '🏠',
    category: 'Productos',
  },
  {
    id: '3',
    label: '¿Cómo gestionar un siniestro?',
    prompt: '¿Cuál es el procedimiento para gestionar un siniestro?',
    icon: '📋',
    category: 'Siniestros',
  },
];

describe('QuickActions', () => {
  it('renders all quick actions', () => {
    render(
      <QuickActions actions={mockActions} onActionClick={jest.fn()} />
    );

    expect(screen.getByText('¿Cómo emitir una póliza?')).toBeInTheDocument();
    expect(
      screen.getByText('¿Qué coberturas tiene Occident Hogar?')
    ).toBeInTheDocument();
    expect(screen.getByText('¿Cómo gestionar un siniestro?')).toBeInTheDocument();
  });

  it('renders with correct icons', () => {
    render(
      <QuickActions actions={mockActions} onActionClick={jest.fn()} />
    );

    expect(screen.getByText('🚗')).toBeInTheDocument();
    expect(screen.getByText('🏠')).toBeInTheDocument();
    expect(screen.getByText('📋')).toBeInTheDocument();
  });

  it('renders category labels', () => {
    render(
      <QuickActions actions={mockActions} onActionClick={jest.fn()} />
    );

    expect(screen.getByText('Pólizas')).toBeInTheDocument();
    expect(screen.getByText('Productos')).toBeInTheDocument();
    expect(screen.getByText('Siniestros')).toBeInTheDocument();
  });

  it('calls onActionClick when action is clicked', () => {
    const onActionClick = jest.fn();
    render(
      <QuickActions actions={mockActions} onActionClick={onActionClick} />
    );

    const firstAction = screen.getByText('¿Cómo emitir una póliza?');
    fireEvent.click(firstAction);

    expect(onActionClick).toHaveBeenCalledWith(mockActions[0]);
  });

  it('renders with custom column count', () => {
    const { container } = render(
      <QuickActions
        actions={mockActions}
        onActionClick={jest.fn()}
        columns={3}
      />
    );

    const grid = container.querySelector('[style*="grid-template-columns"]');
    expect(grid).toHaveStyle('grid-template-columns: repeat(3, minmax(0, 1fr))');
  });

  it('renders default 2 columns when not specified', () => {
    const { container } = render(
      <QuickActions actions={mockActions} onActionClick={jest.fn()} />
    );

    const grid = container.querySelector('[style*="grid-template-columns"]');
    expect(grid).toHaveStyle('grid-template-columns: repeat(2, minmax(0, 1fr))');
  });

  it('does not render when actions array is empty', () => {
    const { container } = render(
      <QuickActions actions={[]} onActionClick={jest.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders header with icon', () => {
    render(
      <QuickActions actions={mockActions} onActionClick={jest.fn()} />
    );

    expect(screen.getByText('Acciones rápidas')).toBeInTheDocument();
  });
});
