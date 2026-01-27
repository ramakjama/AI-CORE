import type { Meta, StoryObj } from '@storybook/react';
import { User, Settings, Bell, CreditCard } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
import { Badge } from '../Badge';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '500px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

// Default variant
export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <div className="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
          <h3 className="font-semibold mb-2">Account Settings</h3>
          <p className="text-secondary-600 dark:text-secondary-400">
            Manage your account details and preferences.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="password">
        <div className="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
          <h3 className="font-semibold mb-2">Password Settings</h3>
          <p className="text-secondary-600 dark:text-secondary-400">
            Change your password and security options.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="settings">
        <div className="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
          <h3 className="font-semibold mb-2">General Settings</h3>
          <p className="text-secondary-600 dark:text-secondary-400">
            Configure general application settings.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

// Underline variant
export const Underline: Story = {
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList variant="underline">
        <TabsTrigger variant="underline" value="overview">Overview</TabsTrigger>
        <TabsTrigger variant="underline" value="analytics">Analytics</TabsTrigger>
        <TabsTrigger variant="underline" value="reports">Reports</TabsTrigger>
        <TabsTrigger variant="underline" value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="p-4">
          <h3 className="font-semibold mb-2">Overview</h3>
          <p className="text-secondary-600">Dashboard overview content.</p>
        </div>
      </TabsContent>
      <TabsContent value="analytics">
        <div className="p-4">
          <h3 className="font-semibold mb-2">Analytics</h3>
          <p className="text-secondary-600">Analytics and metrics content.</p>
        </div>
      </TabsContent>
      <TabsContent value="reports">
        <div className="p-4">
          <h3 className="font-semibold mb-2">Reports</h3>
          <p className="text-secondary-600">Reports and exports content.</p>
        </div>
      </TabsContent>
      <TabsContent value="notifications">
        <div className="p-4">
          <h3 className="font-semibold mb-2">Notifications</h3>
          <p className="text-secondary-600">Notification settings content.</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

// Pills variant
export const Pills: Story = {
  render: () => (
    <Tabs defaultValue="all">
      <TabsList variant="pills">
        <TabsTrigger variant="pills" value="all">All</TabsTrigger>
        <TabsTrigger variant="pills" value="active">Active</TabsTrigger>
        <TabsTrigger variant="pills" value="completed">Completed</TabsTrigger>
        <TabsTrigger variant="pills" value="archived">Archived</TabsTrigger>
      </TabsList>
      <TabsContent value="all">
        <div className="p-4">All items content</div>
      </TabsContent>
      <TabsContent value="active">
        <div className="p-4">Active items content</div>
      </TabsContent>
      <TabsContent value="completed">
        <div className="p-4">Completed items content</div>
      </TabsContent>
      <TabsContent value="archived">
        <div className="p-4">Archived items content</div>
      </TabsContent>
    </Tabs>
  ),
};

// With icons
export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="profile">
      <TabsList>
        <TabsTrigger value="profile" icon={<User className="h-4 w-4" />}>
          Profile
        </TabsTrigger>
        <TabsTrigger value="settings" icon={<Settings className="h-4 w-4" />}>
          Settings
        </TabsTrigger>
        <TabsTrigger value="notifications" icon={<Bell className="h-4 w-4" />}>
          Notifications
        </TabsTrigger>
        <TabsTrigger value="billing" icon={<CreditCard className="h-4 w-4" />}>
          Billing
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <div className="p-4">Profile settings content</div>
      </TabsContent>
      <TabsContent value="settings">
        <div className="p-4">General settings content</div>
      </TabsContent>
      <TabsContent value="notifications">
        <div className="p-4">Notification preferences content</div>
      </TabsContent>
      <TabsContent value="billing">
        <div className="p-4">Billing information content</div>
      </TabsContent>
    </Tabs>
  ),
};

// With badges
export const WithBadges: Story = {
  render: () => (
    <Tabs defaultValue="inbox">
      <TabsList variant="underline">
        <TabsTrigger
          variant="underline"
          value="inbox"
          badge={<Badge variant="primary" size="sm">24</Badge>}
        >
          Inbox
        </TabsTrigger>
        <TabsTrigger
          variant="underline"
          value="sent"
          badge={<Badge variant="default" size="sm">5</Badge>}
        >
          Sent
        </TabsTrigger>
        <TabsTrigger variant="underline" value="drafts">
          Drafts
        </TabsTrigger>
        <TabsTrigger
          variant="underline"
          value="spam"
          badge={<Badge variant="danger" size="sm">2</Badge>}
        >
          Spam
        </TabsTrigger>
      </TabsList>
      <TabsContent value="inbox">
        <div className="p-4">Inbox messages</div>
      </TabsContent>
      <TabsContent value="sent">
        <div className="p-4">Sent messages</div>
      </TabsContent>
      <TabsContent value="drafts">
        <div className="p-4">Draft messages</div>
      </TabsContent>
      <TabsContent value="spam">
        <div className="p-4">Spam messages</div>
      </TabsContent>
    </Tabs>
  ),
};

// Disabled tab
export const WithDisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Active Tab</TabsTrigger>
        <TabsTrigger value="tab2">Another Tab</TabsTrigger>
        <TabsTrigger value="tab3" disabled>
          Disabled Tab
        </TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <div className="p-4">Content for active tab</div>
      </TabsContent>
      <TabsContent value="tab2">
        <div className="p-4">Content for another tab</div>
      </TabsContent>
      <TabsContent value="tab3">
        <div className="p-4">Content for disabled tab (not accessible)</div>
      </TabsContent>
    </Tabs>
  ),
};

// Full width
export const FullWidth: Story = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <div className="p-4">Content 1</div>
      </TabsContent>
      <TabsContent value="tab2">
        <div className="p-4">Content 2</div>
      </TabsContent>
      <TabsContent value="tab3">
        <div className="p-4">Content 3</div>
      </TabsContent>
    </Tabs>
  ),
};
