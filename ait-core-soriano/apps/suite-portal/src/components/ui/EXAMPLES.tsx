/**
 * Component Usage Examples
 *
 * This file demonstrates how to use all the Shadcn UI components.
 * Copy and paste the examples you need into your application.
 */

import {
  Button,
  Input,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Avatar,
  AvatarImage,
  AvatarFallback,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui';

// Example 1: Button Variants
export function ButtonExamples() {
  return (
    <div className="flex flex-wrap gap-4">
      <Button>Default Button</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>

      {/* Different sizes */}
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">📧</Button>
    </div>
  );
}

// Example 2: Input with Labels
export function InputExamples() {
  return (
    <div className="flex flex-col gap-4 max-w-md">
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <Input type="email" placeholder="Enter your email" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Password</label>
        <Input type="password" placeholder="Enter your password" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Error State</label>
        <Input error placeholder="This field has an error" />
        <p className="text-sm text-destructive mt-1">This field is required</p>
      </div>
    </div>
  );
}

// Example 3: Dialog (Modal)
export function DialogExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account
            and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete Account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Example 4: Form in Dialog
export function FormDialogExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Edit Profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" placeholder="john@example.com" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Example 5: Avatar
export function AvatarExamples() {
  return (
    <div className="flex gap-4 items-center">
      {/* Avatar with image */}
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>

      {/* Avatar with fallback only */}
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>

      {/* Different sizes */}
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">SM</AvatarFallback>
      </Avatar>

      <Avatar className="h-16 w-16">
        <AvatarFallback className="text-lg">LG</AvatarFallback>
      </Avatar>
    </div>
  );
}

// Example 6: Tooltip
export function TooltipExamples() {
  return (
    <TooltipProvider>
      <div className="flex gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add to library</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost">
              ℹ️
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>More information</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

// Example 7: Dropdown Menu
export function DropdownMenuExample() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Billing</DropdownMenuItem>
        <DropdownMenuItem>Team</DropdownMenuItem>
        <DropdownMenuItem>Subscription</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Example 8: User Menu (Avatar + Dropdown)
export function UserMenuExample() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-muted-foreground">john@example.com</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Billing</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Example 9: Complete Form Example
export function CompleteFormExample() {
  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Sign Up</h2>

      <form className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Full Name</label>
          <Input placeholder="John Doe" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input type="email" placeholder="john@example.com" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <Input type="password" placeholder="••••••••" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Confirm Password</label>
          <Input type="password" placeholder="••••••••" />
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">
            Create Account
          </Button>
          <Button type="button" variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// Example 10: Action Buttons with Tooltips
export function ActionButtonsExample() {
  return (
    <TooltipProvider>
      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="outline">
              ✏️
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="outline">
              👁️
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="destructive">
              🗑️
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

// Example 11: Confirmation Dialog
export function ConfirmationDialogExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Item</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this item? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Example 12: All Components Together
export function AllComponentsShowcase() {
  return (
    <div className="p-8 space-y-8">
      <section>
        <h3 className="text-lg font-semibold mb-4">Buttons</h3>
        <ButtonExamples />
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Inputs</h3>
        <InputExamples />
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Dialogs</h3>
        <div className="flex gap-4">
          <DialogExample />
          <FormDialogExample />
          <ConfirmationDialogExample />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Avatars</h3>
        <AvatarExamples />
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Tooltips</h3>
        <TooltipExamples />
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Dropdown Menus</h3>
        <div className="flex gap-4">
          <DropdownMenuExample />
          <UserMenuExample />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Action Buttons</h3>
        <ActionButtonsExample />
      </section>
    </div>
  );
}

export default AllComponentsShowcase;
