import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardNav } from './dashboard-nav';

// Mock usePathname
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('DashboardNav', () => {
  beforeEach(() => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/dashboard');
  });

  it('should render navigation items', () => {
    render(<DashboardNav />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Policies')).toBeInTheDocument();
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Claims')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('AI Agents')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should render logo and company name', () => {
    render(<DashboardNav />);

    expect(screen.getByText('AIT-CORE')).toBeInTheDocument();
    expect(screen.getByText('Soriano Mediadores')).toBeInTheDocument();
  });

  it('should highlight active navigation item', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/dashboard');

    render(<DashboardNav />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('bg-primary');
  });

  it('should not highlight inactive navigation items', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/dashboard');

    render(<DashboardNav />);

    const policiesLink = screen.getByText('Policies').closest('a');
    expect(policiesLink).not.toHaveClass('bg-primary');
    expect(policiesLink).toHaveClass('text-muted-foreground');
  });

  it('should render navigation icons', () => {
    render(<DashboardNav />);

    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      const svg = link.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  it('should have correct href for each navigation item', () => {
    render(<DashboardNav />);

    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('Policies').closest('a')).toHaveAttribute('href', '/dashboard/policies');
    expect(screen.getByText('Clients').closest('a')).toHaveAttribute('href', '/dashboard/clients');
    expect(screen.getByText('Analytics').closest('a')).toHaveAttribute(
      'href',
      '/dashboard/analytics',
    );
  });

  it('should update active state when pathname changes', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/dashboard/policies');

    const { rerender } = render(<DashboardNav />);

    const policiesLink = screen.getByText('Policies').closest('a');
    expect(policiesLink).toHaveClass('bg-primary');

    usePathname.mockReturnValue('/dashboard/analytics');
    rerender(<DashboardNav />);

    expect(policiesLink).not.toHaveClass('bg-primary');
    const analyticsLink = screen.getByText('Analytics').closest('a');
    expect(analyticsLink).toHaveClass('bg-primary');
  });

  it('should apply hover styles on non-active items', () => {
    render(<DashboardNav />);

    const policiesLink = screen.getByText('Policies').closest('a');
    expect(policiesLink).toHaveClass('hover:bg-muted');
  });
});
