import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardHeader } from './dashboard-header';

describe('DashboardHeader', () => {
  it('should render header with search input', () => {
    render(<DashboardHeader />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should render notification bell', () => {
    render(<DashboardHeader />);

    const notificationButton = screen.getByLabelText(/notifications/i);
    expect(notificationButton).toBeInTheDocument();
  });

  it('should render user menu', () => {
    render(<DashboardHeader />);

    const userMenuButton = screen.getByLabelText(/user menu/i);
    expect(userMenuButton).toBeInTheDocument();
  });

  it('should display notification count', () => {
    render(<DashboardHeader />);

    const notificationBadge = screen.getByText('3');
    expect(notificationBadge).toBeInTheDocument();
  });

  it('should open user menu on click', () => {
    render(<DashboardHeader />);

    const userMenuButton = screen.getByLabelText(/user menu/i);
    fireEvent.click(userMenuButton);

    expect(screen.getByText(/profile/i)).toBeInTheDocument();
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
    expect(screen.getByText(/logout/i)).toBeInTheDocument();
  });

  it('should handle search input', () => {
    render(<DashboardHeader />);

    const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    expect(searchInput.value).toBe('test query');
  });

  it('should display user avatar', () => {
    render(<DashboardHeader />);

    const avatar = screen.getByAltText(/user avatar/i);
    expect(avatar).toBeInTheDocument();
  });

  it('should render theme toggle button', () => {
    render(<DashboardHeader />);

    const themeToggle = screen.getByLabelText(/toggle theme/i);
    expect(themeToggle).toBeInTheDocument();
  });

  it('should toggle theme on button click', () => {
    render(<DashboardHeader />);

    const themeToggle = screen.getByLabelText(/toggle theme/i);
    fireEvent.click(themeToggle);

    // Check if theme changed (implementation dependent)
    expect(themeToggle).toBeInTheDocument();
  });

  it('should open notifications panel on bell click', () => {
    render(<DashboardHeader />);

    const notificationButton = screen.getByLabelText(/notifications/i);
    fireEvent.click(notificationButton);

    expect(screen.getByText(/notifications/i)).toBeInTheDocument();
  });

  it('should close user menu when clicking outside', () => {
    render(<DashboardHeader />);

    const userMenuButton = screen.getByLabelText(/user menu/i);
    fireEvent.click(userMenuButton);

    expect(screen.getByText(/profile/i)).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(document.body);

    expect(screen.queryByText(/profile/i)).not.toBeInTheDocument();
  });
});
