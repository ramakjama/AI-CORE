import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByText('Click me');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply default variant styles', () => {
    render(<Button>Default</Button>);

    const button = screen.getByText('Default');
    expect(button).toHaveClass('bg-primary');
  });

  it('should apply variant styles', () => {
    render(
      <>
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </>,
    );

    expect(screen.getByText('Destructive')).toHaveClass('bg-destructive');
    expect(screen.getByText('Outline')).toHaveClass('border');
    expect(screen.getByText('Secondary')).toHaveClass('bg-secondary');
  });

  it('should apply size styles', () => {
    render(
      <>
        <Button size="default">Default Size</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button size="icon">Icon</Button>
      </>,
    );

    expect(screen.getByText('Small')).toHaveClass('h-9');
    expect(screen.getByText('Large')).toHaveClass('h-11');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:pointer-events-none');
  });

  it('should not trigger click when disabled', () => {
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    );

    const button = screen.getByText('Disabled');
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should render as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>,
    );

    const link = screen.getByText('Link Button');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/test');
  });

  it('should accept custom className', () => {
    render(<Button className="custom-class">Custom</Button>);

    const button = screen.getByText('Custom');
    expect(button).toHaveClass('custom-class');
  });

  it('should render with icon', () => {
    render(
      <Button>
        <span>Icon</span>
        Text
      </Button>,
    );

    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('should support different button types', () => {
    render(
      <>
        <Button type="button">Button</Button>
        <Button type="submit">Submit</Button>
        <Button type="reset">Reset</Button>
      </>,
    );

    expect(screen.getByText('Button')).toHaveAttribute('type', 'button');
    expect(screen.getByText('Submit')).toHaveAttribute('type', 'submit');
    expect(screen.getByText('Reset')).toHaveAttribute('type', 'reset');
  });

  it('should forward ref', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Button</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('should apply loading state', () => {
    render(<Button disabled>Loading...</Button>);

    const button = screen.getByText('Loading...');
    expect(button).toBeDisabled();
  });
});
