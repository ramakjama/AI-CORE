import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarGroup } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
    },
    variant: {
      control: 'select',
      options: ['circle', 'square'],
    },
    status: {
      control: 'select',
      options: ['online', 'offline', 'busy', 'away', undefined],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

// Basic
export const Default: Story = {
  args: {
    name: 'John Doe',
  },
};

export const WithImage: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    alt: 'John Doe',
  },
};

export const WithInitials: Story = {
  args: {
    name: 'John Doe',
  },
};

export const WithFallback: Story = {
  args: {},
};

// Sizes
export const ExtraSmall: Story = {
  args: {
    name: 'John Doe',
    size: 'xs',
  },
};

export const Small: Story = {
  args: {
    name: 'John Doe',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    name: 'John Doe',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    name: 'John Doe',
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    name: 'John Doe',
    size: 'xl',
  },
};

export const DoubleExtraLarge: Story = {
  args: {
    name: 'John Doe',
    size: '2xl',
  },
};

// Variants
export const Square: Story = {
  args: {
    name: 'John Doe',
    variant: 'square',
  },
};

// Status
export const Online: Story = {
  args: {
    name: 'John Doe',
    status: 'online',
  },
};

export const Offline: Story = {
  args: {
    name: 'John Doe',
    status: 'offline',
  },
};

export const Busy: Story = {
  args: {
    name: 'John Doe',
    status: 'busy',
  },
};

export const Away: Story = {
  args: {
    name: 'John Doe',
    status: 'away',
  },
};

// All sizes
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar name="JD" size="xs" />
      <Avatar name="JD" size="sm" />
      <Avatar name="JD" size="md" />
      <Avatar name="JD" size="lg" />
      <Avatar name="JD" size="xl" />
      <Avatar name="JD" size="2xl" />
    </div>
  ),
};

// All statuses
export const AllStatuses: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar name="John" status="online" />
      <Avatar name="Jane" status="offline" />
      <Avatar name="Bob" status="busy" />
      <Avatar name="Alice" status="away" />
    </div>
  ),
};

// Avatar Group
export const Group: Story = {
  render: () => (
    <AvatarGroup max={3}>
      <Avatar name="John Doe" />
      <Avatar name="Jane Smith" />
      <Avatar name="Bob Wilson" />
      <Avatar name="Alice Johnson" />
      <Avatar name="Charlie Brown" />
    </AvatarGroup>
  ),
};

export const GroupWithImages: Story = {
  render: () => (
    <AvatarGroup max={4}>
      <Avatar
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
        alt="User 1"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
        alt="User 2"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
        alt="User 3"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
        alt="User 4"
      />
      <Avatar name="Extra User" />
      <Avatar name="Another User" />
    </AvatarGroup>
  ),
};

// With image and status
export const ImageWithStatus: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    alt: 'John Doe',
    status: 'online',
    size: 'lg',
  },
};

// User profile example
export const UserProfile: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
        alt="John Doe"
        status="online"
        size="lg"
      />
      <div>
        <p className="font-medium text-secondary-900">John Doe</p>
        <p className="text-sm text-secondary-500">john@example.com</p>
      </div>
    </div>
  ),
};
