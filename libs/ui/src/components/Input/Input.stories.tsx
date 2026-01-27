import type { Meta, StoryObj } from '@storybook/react';
import { Mail, Lock, Search, User, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['default', 'error', 'success'],
    },
    disabled: {
      control: 'boolean',
    },
    required: {
      control: 'boolean',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Input>;

// Basic
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email address',
    placeholder: 'Enter your email',
    type: 'email',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    helperText: 'Your username must be unique',
  },
};

export const Required: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'Enter your name',
    required: true,
  },
};

// Sizes
export const Small: Story = {
  args: {
    label: 'Small Input',
    placeholder: 'Small size',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    label: 'Medium Input',
    placeholder: 'Medium size (default)',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    label: 'Large Input',
    placeholder: 'Large size',
    size: 'lg',
  },
};

// States
export const WithError: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    error: 'Password must be at least 8 characters',
    defaultValue: 'short',
  },
};

export const WithSuccess: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    successMessage: 'Username is available!',
    defaultValue: 'john_doe',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    disabled: true,
    defaultValue: 'Disabled value',
  },
};

// With Icons
export const WithLeftIcon: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter email',
    type: 'email',
    leftElement: <Mail className="h-5 w-5" />,
  },
};

export const WithRightIcon: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search...',
    rightElement: <Search className="h-5 w-5" />,
  },
};

export const PasswordWithToggle: Story = {
  render: () => {
    const PasswordInput = () => {
      const [showPassword, setShowPassword] = useState(false);

      return (
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter password"
          leftElement={<Lock className="h-5 w-5" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-secondary-400 hover:text-secondary-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          }
        />
      );
    };

    return <PasswordInput />;
  },
};

// Form example
export const FormExample: Story = {
  render: () => (
    <div className="space-y-4">
      <Input
        label="Full Name"
        placeholder="John Doe"
        leftElement={<User className="h-5 w-5" />}
        required
      />
      <Input
        label="Email"
        type="email"
        placeholder="john@example.com"
        leftElement={<Mail className="h-5 w-5" />}
        required
      />
      <Input
        label="Password"
        type="password"
        placeholder="Enter password"
        leftElement={<Lock className="h-5 w-5" />}
        helperText="Must be at least 8 characters"
        required
      />
    </div>
  ),
};

// All sizes showcase
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Input label="Small" size="sm" placeholder="Small input" />
      <Input label="Medium" size="md" placeholder="Medium input" />
      <Input label="Large" size="lg" placeholder="Large input" />
    </div>
  ),
};

// All states showcase
export const AllStates: Story = {
  render: () => (
    <div className="space-y-4">
      <Input label="Default" placeholder="Default state" />
      <Input label="With Error" error="This field is required" />
      <Input label="With Success" successMessage="Looks good!" />
      <Input label="Disabled" disabled defaultValue="Cannot edit" />
    </div>
  ),
};
