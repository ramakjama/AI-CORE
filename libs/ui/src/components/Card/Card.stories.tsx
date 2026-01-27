import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { Button } from '../Button';
import { Badge } from '../Badge';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outline', 'ghost'],
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    rounded: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'full'],
    },
    interactive: {
      control: 'boolean',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Card>;

// Basic
export const Default: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description goes here</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-secondary-600 dark:text-secondary-400">
            This is the card content. You can put any content here.
          </p>
        </CardContent>
      </>
    ),
  },
};

export const WithFooter: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Card with Footer</CardTitle>
          <CardDescription>This card has action buttons</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-secondary-600 dark:text-secondary-400">
            Card content with some additional information.
          </p>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button size="sm">Save</Button>
        </CardFooter>
      </>
    ),
  },
};

// Variants
export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <>
        <CardHeader>
          <CardTitle>Elevated Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-secondary-600">This card has a shadow effect.</p>
        </CardContent>
      </>
    ),
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: (
      <>
        <CardHeader>
          <CardTitle>Ghost Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-secondary-600">This card has a subtle background.</p>
        </CardContent>
      </>
    ),
  },
};

export const Interactive: Story = {
  args: {
    interactive: true,
    children: (
      <>
        <CardHeader>
          <CardTitle>Interactive Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-secondary-600">Click this card to interact.</p>
        </CardContent>
      </>
    ),
  },
};

// Complex example
export const ProductCard: Story = {
  args: {
    variant: 'elevated',
    padding: 'none',
    children: (
      <>
        <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 rounded-t-lg" />
        <div className="p-4">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle>Product Name</CardTitle>
              <Badge variant="success">In Stock</Badge>
            </div>
            <CardDescription>Category - Subcategory</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-secondary-900">$99.99</p>
          </CardContent>
          <CardFooter className="border-0 pt-2">
            <Button fullWidth>Add to Cart</Button>
          </CardFooter>
        </div>
      </>
    ),
  },
};

// Stats card
export const StatsCard: Story = {
  args: {
    children: (
      <>
        <CardHeader className="pb-2">
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-3xl">$45,231.89</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-success-600">
            +20.1% from last month
          </p>
        </CardContent>
      </>
    ),
  },
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Card variant="default">
        <CardContent>Default Card</CardContent>
      </Card>
      <Card variant="elevated">
        <CardContent>Elevated Card</CardContent>
      </Card>
      <Card variant="outline">
        <CardContent>Outline Card</CardContent>
      </Card>
      <Card variant="ghost">
        <CardContent>Ghost Card</CardContent>
      </Card>
    </div>
  ),
};

// All padding sizes
export const AllPaddings: Story = {
  render: () => (
    <div className="space-y-4">
      <Card padding="sm">
        <CardContent>Small Padding</CardContent>
      </Card>
      <Card padding="md">
        <CardContent>Medium Padding (default)</CardContent>
      </Card>
      <Card padding="lg">
        <CardContent>Large Padding</CardContent>
      </Card>
    </div>
  ),
};
