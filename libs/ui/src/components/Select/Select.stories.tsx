import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
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
type Story = StoryObj<typeof Select>;

const countryOptions = [
  { value: 'es', label: 'Spain' },
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
  { value: 'it', label: 'Italy' },
  { value: 'pt', label: 'Portugal' },
  { value: 'uk', label: 'United Kingdom' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived', disabled: true },
];

// Basic
export const Default: Story = {
  args: {
    placeholder: 'Select an option',
    options: countryOptions,
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Country',
    placeholder: 'Select your country',
    options: countryOptions,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Country',
    placeholder: 'Select your country',
    options: countryOptions,
    helperText: 'Select the country where you reside',
  },
};

export const Required: Story = {
  args: {
    label: 'Country',
    placeholder: 'Select your country',
    options: countryOptions,
    required: true,
  },
};

// Sizes
export const Small: Story = {
  args: {
    label: 'Size',
    placeholder: 'Small select',
    options: countryOptions,
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    label: 'Size',
    placeholder: 'Medium select',
    options: countryOptions,
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    label: 'Size',
    placeholder: 'Large select',
    options: countryOptions,
    size: 'lg',
  },
};

// States
export const WithError: Story = {
  args: {
    label: 'Country',
    placeholder: 'Select your country',
    options: countryOptions,
    error: 'Please select a country',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Country',
    placeholder: 'Select your country',
    options: countryOptions,
    disabled: true,
  },
};

export const WithDisabledOption: Story = {
  args: {
    label: 'Status',
    placeholder: 'Select status',
    options: statusOptions,
    helperText: 'Archived status is not available',
  },
};

export const WithDefaultValue: Story = {
  args: {
    label: 'Country',
    options: countryOptions,
    defaultValue: 'es',
  },
};

// Controlled
export const Controlled: Story = {
  render: () => {
    const ControlledSelect = () => {
      const [value, setValue] = useState('');

      return (
        <div className="space-y-4">
          <Select
            label="Country"
            placeholder="Select your country"
            options={countryOptions}
            value={value}
            onValueChange={setValue}
          />
          <p className="text-sm text-secondary-600">
            Selected value: {value || 'None'}
          </p>
        </div>
      );
    };

    return <ControlledSelect />;
  },
};

// All sizes showcase
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Select label="Small" size="sm" placeholder="Small" options={countryOptions} />
      <Select label="Medium" size="md" placeholder="Medium" options={countryOptions} />
      <Select label="Large" size="lg" placeholder="Large" options={countryOptions} />
    </div>
  ),
};

// Form example
export const FormExample: Story = {
  render: () => (
    <div className="space-y-4">
      <Select
        label="Country"
        placeholder="Select country"
        options={countryOptions}
        required
      />
      <Select
        label="Status"
        placeholder="Select status"
        options={statusOptions}
        required
      />
    </div>
  ),
};
