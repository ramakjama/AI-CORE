import type { Meta, StoryObj } from '@storybook/react';
import { Check, X, Clock, AlertTriangle, Info } from 'lucide-react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'danger', 'info', 'outline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    dot: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

// Basic variants
export const Default: Story = {
  args: {
    children: 'Default',
    variant: 'default',
  },
};

export const Primary: Story = {
  args: {
    children: 'Primary',
    variant: 'primary',
  },
};

export const Success: Story = {
  args: {
    children: 'Success',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Warning',
    variant: 'warning',
  },
};

export const Danger: Story = {
  args: {
    children: 'Error',
    variant: 'danger',
  },
};

export const Info: Story = {
  args: {
    children: 'Info',
    variant: 'info',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

// With dot
export const WithDot: Story = {
  args: {
    children: 'Active',
    variant: 'success',
    dot: true,
  },
};

// Sizes
export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    children: 'Medium',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    children: 'Large',
    size: 'lg',
  },
};

// With icons
export const WithLeftIcon: Story = {
  args: {
    children: 'Completed',
    variant: 'success',
    leftIcon: <Check className="h-3 w-3" />,
  },
};

export const WithRightIcon: Story = {
  args: {
    children: 'Remove',
    variant: 'danger',
    rightIcon: <X className="h-3 w-3" />,
  },
};

// Status badges
export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success" leftIcon={<Check className="h-3 w-3" />}>
        Completed
      </Badge>
      <Badge variant="warning" leftIcon={<Clock className="h-3 w-3" />}>
        Pending
      </Badge>
      <Badge variant="danger" leftIcon={<X className="h-3 w-3" />}>
        Failed
      </Badge>
      <Badge variant="info" leftIcon={<Info className="h-3 w-3" />}>
        In Progress
      </Badge>
    </div>
  ),
};

// All variants
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

// All sizes
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

// With dots
export const AllWithDots: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default" dot>Default</Badge>
      <Badge variant="primary" dot>Primary</Badge>
      <Badge variant="success" dot>Success</Badge>
      <Badge variant="warning" dot>Warning</Badge>
      <Badge variant="danger" dot>Danger</Badge>
      <Badge variant="info" dot>Info</Badge>
    </div>
  ),
};

// Use cases
export const UseCases: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-secondary-600">Order Status:</span>
        <Badge variant="success" dot>Delivered</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-secondary-600">Priority:</span>
        <Badge variant="danger">High</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-secondary-600">Type:</span>
        <Badge variant="outline">Feature</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-secondary-600">Version:</span>
        <Badge variant="primary">v2.0.0</Badge>
      </div>
    </div>
  ),
};
