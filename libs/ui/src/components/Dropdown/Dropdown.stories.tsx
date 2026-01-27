import type { Meta, StoryObj } from '@storybook/react';
import {
  User,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Copy,
  Share,
  MoreHorizontal,
  Cloud,
  CreditCard,
  Mail,
  MessageSquare,
  PlusCircle,
  UserPlus,
  Github,
} from 'lucide-react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownCheckboxItem,
  DropdownRadioItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownShortcut,
  DropdownGroup,
  DropdownSub,
  DropdownSubTrigger,
  DropdownSubContent,
  DropdownRadioGroup,
} from './Dropdown';
import { Button } from '../Button';
import { Avatar } from '../Avatar';
import { useState } from 'react';

const meta: Meta = {
  title: 'Components/Dropdown',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// Basic
export const Default: Story = {
  render: () => (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="outline">Open Menu</Button>
      </DropdownTrigger>
      <DropdownContent>
        <DropdownItem>Profile</DropdownItem>
        <DropdownItem>Settings</DropdownItem>
        <DropdownItem>Help</DropdownItem>
        <DropdownSeparator />
        <DropdownItem>Log out</DropdownItem>
      </DropdownContent>
    </Dropdown>
  ),
};

// With icons
export const WithIcons: Story = {
  render: () => (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Options
        </Button>
      </DropdownTrigger>
      <DropdownContent className="w-56">
        <DropdownItem>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownItem>
        <DropdownItem>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownItem>
        <DropdownItem>
          <CreditCard className="mr-2 h-4 w-4" />
          Billing
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem variant="danger">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  ),
};

// With shortcuts
export const WithShortcuts: Story = {
  render: () => (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="outline">Edit</Button>
      </DropdownTrigger>
      <DropdownContent className="w-56">
        <DropdownItem>
          <Copy className="mr-2 h-4 w-4" />
          Copy
          <DropdownShortcut>Ctrl+C</DropdownShortcut>
        </DropdownItem>
        <DropdownItem>
          <Edit className="mr-2 h-4 w-4" />
          Edit
          <DropdownShortcut>Ctrl+E</DropdownShortcut>
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem variant="danger">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
          <DropdownShortcut>Del</DropdownShortcut>
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  ),
};

// With checkbox items
export const WithCheckboxes: Story = {
  render: () => {
    const CheckboxDropdown = () => {
      const [showPanel, setShowPanel] = useState(true);
      const [showActivity, setShowActivity] = useState(false);

      return (
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="outline">View Options</Button>
          </DropdownTrigger>
          <DropdownContent className="w-56">
            <DropdownLabel>Toggle Panels</DropdownLabel>
            <DropdownCheckboxItem
              checked={showPanel}
              onCheckedChange={setShowPanel}
            >
              Show Side Panel
            </DropdownCheckboxItem>
            <DropdownCheckboxItem
              checked={showActivity}
              onCheckedChange={setShowActivity}
            >
              Show Activity
            </DropdownCheckboxItem>
          </DropdownContent>
        </Dropdown>
      );
    };

    return <CheckboxDropdown />;
  },
};

// With radio items
export const WithRadioItems: Story = {
  render: () => {
    const RadioDropdown = () => {
      const [position, setPosition] = useState('bottom');

      return (
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="outline">Position: {position}</Button>
          </DropdownTrigger>
          <DropdownContent className="w-56">
            <DropdownLabel>Panel Position</DropdownLabel>
            <DropdownRadioGroup value={position} onValueChange={setPosition}>
              <DropdownRadioItem value="top">Top</DropdownRadioItem>
              <DropdownRadioItem value="bottom">Bottom</DropdownRadioItem>
              <DropdownRadioItem value="right">Right</DropdownRadioItem>
            </DropdownRadioGroup>
          </DropdownContent>
        </Dropdown>
      );
    };

    return <RadioDropdown />;
  },
};

// With submenus
export const WithSubmenus: Story = {
  render: () => (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="outline">Actions</Button>
      </DropdownTrigger>
      <DropdownContent className="w-56">
        <DropdownItem>
          <Plus className="mr-2 h-4 w-4" />
          New File
        </DropdownItem>
        <DropdownSub>
          <DropdownSubTrigger>
            <Share className="mr-2 h-4 w-4" />
            Share
          </DropdownSubTrigger>
          <DropdownSubContent>
            <DropdownItem>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </DropdownItem>
            <DropdownItem>
              <MessageSquare className="mr-2 h-4 w-4" />
              Message
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem>
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </DropdownItem>
          </DropdownSubContent>
        </DropdownSub>
        <DropdownSeparator />
        <DropdownItem variant="danger">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  ),
};

// User menu
export const UserMenu: Story = {
  render: () => (
    <Dropdown>
      <DropdownTrigger asChild>
        <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500">
          <Avatar
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
            alt="John Doe"
            size="sm"
          />
        </button>
      </DropdownTrigger>
      <DropdownContent className="w-56">
        <DropdownLabel>
          <div className="flex flex-col">
            <span className="font-medium">John Doe</span>
            <span className="text-xs font-normal text-secondary-500">
              john@example.com
            </span>
          </div>
        </DropdownLabel>
        <DropdownSeparator />
        <DropdownGroup>
          <DropdownItem>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownItem>
          <DropdownItem>
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </DropdownItem>
          <DropdownItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownItem>
        </DropdownGroup>
        <DropdownSeparator />
        <DropdownItem>
          <Github className="mr-2 h-4 w-4" />
          GitHub
        </DropdownItem>
        <DropdownItem>
          <Cloud className="mr-2 h-4 w-4" />
          API
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem variant="danger">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  ),
};

// Actions menu (icon button)
export const ActionsMenu: Story = {
  render: () => (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownTrigger>
      <DropdownContent>
        <DropdownItem>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownItem>
        <DropdownItem>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem variant="danger">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  ),
};

// With groups
export const WithGroups: Story = {
  render: () => (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New
        </Button>
      </DropdownTrigger>
      <DropdownContent className="w-56">
        <DropdownGroup>
          <DropdownLabel>Create</DropdownLabel>
          <DropdownItem>
            <Plus className="mr-2 h-4 w-4" />
            New Document
          </DropdownItem>
          <DropdownItem>
            <Plus className="mr-2 h-4 w-4" />
            New Folder
          </DropdownItem>
        </DropdownGroup>
        <DropdownSeparator />
        <DropdownGroup>
          <DropdownLabel>Invite</DropdownLabel>
          <DropdownItem>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </DropdownItem>
          <DropdownItem>
            <Mail className="mr-2 h-4 w-4" />
            Email Invite
          </DropdownItem>
        </DropdownGroup>
      </DropdownContent>
    </Dropdown>
  ),
};
