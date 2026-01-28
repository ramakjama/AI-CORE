import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render card component', () => {
      render(<Card>Card Content</Card>);

      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<Card className="custom-card">Content</Card>);

      expect(container.firstChild).toHaveClass('custom-card');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Content</Card>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardHeader', () => {
    it('should render card header', () => {
      render(
        <Card>
          <CardHeader>Header Content</CardHeader>
        </Card>,
      );

      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('should apply header styles', () => {
      const { container } = render(
        <Card>
          <CardHeader>Header</CardHeader>
        </Card>,
      );

      const header = screen.getByText('Header');
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5');
    });
  });

  describe('CardTitle', () => {
    it('should render card title', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
        </Card>,
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('should render as h3 by default', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>,
      );

      const title = screen.getByText('Title');
      expect(title.tagName).toBe('H3');
    });
  });

  describe('CardDescription', () => {
    it('should render card description', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>This is a description</CardDescription>
          </CardHeader>
        </Card>,
      );

      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('should render as p tag', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>,
      );

      const description = screen.getByText('Description');
      expect(description.tagName).toBe('P');
    });

    it('should have muted text color', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>,
      );

      expect(screen.getByText('Description')).toHaveClass('text-muted-foreground');
    });
  });

  describe('CardContent', () => {
    it('should render card content', () => {
      render(
        <Card>
          <CardContent>Main Content</CardContent>
        </Card>,
      );

      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('should apply padding', () => {
      const { container } = render(
        <Card>
          <CardContent>Content</CardContent>
        </Card>,
      );

      expect(screen.getByText('Content')).toHaveClass('p-6', 'pt-0');
    });
  });

  describe('CardFooter', () => {
    it('should render card footer', () => {
      render(
        <Card>
          <CardFooter>Footer Content</CardFooter>
        </Card>,
      );

      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('should apply flex layout', () => {
      const { container } = render(
        <Card>
          <CardFooter>Footer</CardFooter>
        </Card>,
      );

      expect(screen.getByText('Footer')).toHaveClass('flex', 'items-center');
    });
  });

  describe('Complete Card', () => {
    it('should render complete card with all sections', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>Test Content</CardContent>
          <CardFooter>Test Footer</CardFooter>
        </Card>,
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByText('Test Footer')).toBeInTheDocument();
    });

    it('should maintain proper structure', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>,
      );

      const card = container.firstChild;
      expect(card?.childNodes).toHaveLength(3);
    });
  });
});
