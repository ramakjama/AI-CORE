import type { Meta, StoryObj } from '@storybook/react';
import { Plus, ArrowRight, Download, Trash2 } from 'lucide-react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'warning', 'link'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', 'icon', 'icon-sm', 'icon-lg'],
    },
    fullWidth: {
      control: 'boolean',
    },
    isLoading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Basic variants
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Danger: Story = {
  args: {
    children: 'Delete',
    variant: 'danger',
    leftIcon: <Trash2 className="h-4 w-4" />,
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

export const Link: Story = {
  args: {
    children: 'Link Button',
    variant: 'link',
  },
};

// Sizes
export const ExtraSmall: Story = {
  args: {
    children: 'Extra Small',
    size: 'xs',
  },
};

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    children: 'Medium Button',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    children: 'Extra Large',
    size: 'xl',
  },
};

// With icons
export const WithLeftIcon: Story = {
  args: {
    children: 'Add Item',
    leftIcon: <Plus className="h-4 w-4" />,
  },
};

export const WithRightIcon: Story = {
  args: {
    children: 'Continue',
    rightIcon: <ArrowRight className="h-4 w-4" />,
  },
};

export const WithBothIcons: Story = {
  args: {
    children: 'Download',
    leftIcon: <Download className="h-4 w-4" />,
    rightIcon: <ArrowRight className="h-4 w-4" />,
  },
};

export const IconOnly: Story = {
  args: {
    children: <Plus className="h-5 w-5" />,
    size: 'icon',
    'aria-label': 'Add item',
  },
};

// States
export const Loading: Story = {
  args: {
    children: 'Submit',
    isLoading: true,
  },
};

export const LoadingWithText: Story = {
  args: {
    children: 'Submit',
    isLoading: true,
    loadingText: 'Submitting...',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    children: 'Full Width Button',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

// All sizes showcase
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
};
