import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../Button';
import { Input } from '../Input';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'],
    },
    position: {
      control: 'select',
      options: ['center', 'top'],
    },
    showCloseButton: {
      control: 'boolean',
    },
    closeOnClickOutside: {
      control: 'boolean',
    },
    closeOnEscape: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

// Basic
export const Default: Story = {
  args: {
    trigger: <Button>Open Modal</Button>,
    title: 'Modal Title',
    description: 'This is a description of what this modal does.',
    children: (
      <p className="text-secondary-600 dark:text-secondary-400">
        This is the modal content. You can put any content here including forms,
        images, or other components.
      </p>
    ),
  },
};

export const WithFooter: Story = {
  args: {
    trigger: <Button>Open Modal</Button>,
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed with this action?',
    children: (
      <p className="text-secondary-600 dark:text-secondary-400">
        This action cannot be undone. Please confirm that you want to continue.
      </p>
    ),
    footer: (
      <>
        <Button variant="outline">Cancel</Button>
        <Button variant="danger">Delete</Button>
      </>
    ),
  },
};

// Sizes
export const SmallSize: Story = {
  args: {
    trigger: <Button>Small Modal</Button>,
    title: 'Small Modal',
    children: <p>This is a small modal.</p>,
    size: 'sm',
  },
};

export const LargeSize: Story = {
  args: {
    trigger: <Button>Large Modal</Button>,
    title: 'Large Modal',
    children: (
      <div className="space-y-4">
        <p>This is a large modal with more content space.</p>
        <p>You can fit more content in this modal size.</p>
      </div>
    ),
    size: 'lg',
  },
};

export const ExtraLargeSize: Story = {
  args: {
    trigger: <Button>XL Modal</Button>,
    title: 'Extra Large Modal',
    children: (
      <div className="space-y-4">
        <p>This is an extra large modal.</p>
        <p>Perfect for complex forms or displaying lots of content.</p>
      </div>
    ),
    size: 'xl',
  },
};

// Form example
export const FormModal: Story = {
  args: {
    trigger: <Button>Edit Profile</Button>,
    title: 'Edit Profile',
    description: 'Update your personal information.',
    children: (
      <div className="space-y-4">
        <Input label="Full Name" placeholder="John Doe" />
        <Input label="Email" type="email" placeholder="john@example.com" />
        <Input label="Bio" placeholder="Tell us about yourself" />
      </div>
    ),
    footer: (
      <>
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </>
    ),
    size: 'lg',
  },
};

// Controlled
export const Controlled: Story = {
  render: () => {
    const ControlledModal = () => {
      const [open, setOpen] = useState(false);

      return (
        <div className="space-y-4">
          <Button onClick={() => setOpen(true)}>Open Controlled Modal</Button>
          <Modal
            open={open}
            onOpenChange={setOpen}
            title="Controlled Modal"
            description="This modal is controlled externally."
            footer={
              <>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setOpen(false)}>Confirm</Button>
              </>
            }
          >
            <p className="text-secondary-600">
              The open state is controlled by the parent component.
            </p>
          </Modal>
        </div>
      );
    };

    return <ControlledModal />;
  },
};

// Without close button
export const NoCloseButton: Story = {
  args: {
    trigger: <Button>Open Modal</Button>,
    title: 'Important Notice',
    children: (
      <p className="text-secondary-600">
        This modal requires you to take action before closing.
      </p>
    ),
    footer: <Button>Acknowledge</Button>,
    showCloseButton: false,
    closeOnClickOutside: false,
  },
};

// Delete confirmation
export const DeleteConfirmation: Story = {
  args: {
    trigger: <Button variant="danger">Delete Item</Button>,
    title: 'Delete Item',
    description: 'This action cannot be undone.',
    children: (
      <div className="space-y-4">
        <p className="text-secondary-600">
          Are you sure you want to delete this item? All associated data will be
          permanently removed.
        </p>
        <div className="p-3 bg-danger-50 dark:bg-danger-900/20 rounded-md border border-danger-200 dark:border-danger-800">
          <p className="text-sm text-danger-700 dark:text-danger-300">
            Warning: This action is irreversible.
          </p>
        </div>
      </div>
    ),
    footer: (
      <>
        <Button variant="outline">Cancel</Button>
        <Button variant="danger">Delete Permanently</Button>
      </>
    ),
    size: 'md',
  },
};

// Long content with scroll
export const LongContent: Story = {
  args: {
    trigger: <Button>Terms of Service</Button>,
    title: 'Terms of Service',
    children: (
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <p key={i} className="text-secondary-600">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>
        ))}
      </div>
    ),
    footer: (
      <>
        <Button variant="outline">Decline</Button>
        <Button>Accept</Button>
      </>
    ),
    size: 'lg',
  },
};

// Position top
export const TopPosition: Story = {
  args: {
    trigger: <Button>Top Position</Button>,
    title: 'Top Positioned Modal',
    children: <p>This modal appears at the top of the viewport.</p>,
    position: 'top',
  },
};
