"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  User,
  Mail,
  Lock,
  Bell,
  Shield,
  Palette,
  Globe,
  Upload,
  Camera,
  Monitor,
  Sun,
  Moon,
  Smartphone,
  LogOut,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import { format } from "date-fns";

// Validation schemas
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileInput = z.infer<typeof profileSchema>;
type PasswordInput = z.infer<typeof passwordSchema>;

// Types
interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: Date;
  current: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskReminders: boolean;
  documentShares: boolean;
  calendarEvents: boolean;
  weeklyDigest: boolean;
}

interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  language: string;
}

const mockSessions: Session[] = [
  {
    id: "1",
    device: "Chrome on Windows",
    location: "Madrid, Spain",
    lastActive: new Date(),
    current: true,
  },
  {
    id: "2",
    device: "Safari on iPhone",
    location: "Madrid, Spain",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2),
    current: false,
  },
  {
    id: "3",
    device: "Firefox on Ubuntu",
    location: "Barcelona, Spain",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    current: false,
  },
];

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useTheme();

  // State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: false,
    taskReminders: true,
    documentShares: true,
    calendarEvents: true,
    weeklyDigest: false,
  });

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: (theme as any) || "system",
    fontSize: "medium",
    language: "es",
  });

  // Forms
  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      bio: "",
    },
  });

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handlers
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async (data: ProfileInput) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update user in store
      if (user) {
        setUser({
          ...user,
          name: data.name,
          email: data.email,
          avatar: avatarPreview || user.avatar,
        });
      }

      setSuccessMessage("Profile updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const changePassword = async (data: PasswordInput) => {
    try {
      // Simulate API call
      await authApi.post("/change-password", {
        current_password: data.currentPassword,
        new_password: data.newPassword,
      });

      passwordForm.reset();
      setSuccessMessage("Password changed successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      passwordForm.setError("currentPassword", {
        message: "Current password is incorrect",
      });
    }
  };

  const updateNotificationSettings = (key: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings({ ...notificationSettings, [key]: value });
    setSuccessMessage("Notification settings updated");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const updateAppearanceSettings = (key: keyof AppearanceSettings, value: any) => {
    const newSettings = { ...appearanceSettings, [key]: value };
    setAppearanceSettings(newSettings);

    if (key === "theme") {
      setTheme(value);
    }

    setSuccessMessage("Appearance settings updated");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const toggleTwoFactor = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTwoFactorEnabled(!twoFactorEnabled);
      setSuccessMessage(
        twoFactorEnabled
          ? "Two-factor authentication disabled"
          : "Two-factor authentication enabled"
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to toggle 2FA:", error);
    }
  };

  const logoutSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.id !== sessionId));
    setSuccessMessage("Session logged out");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const logoutAllDevices = () => {
    setSessions(sessions.filter((s) => s.current));
    setShowLogoutDialog(false);
    setSuccessMessage("All other sessions logged out");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-lg bg-green-500/10 p-4 text-green-600 dark:text-green-400"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile information and avatar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || user?.avatar} />
                    <AvatarFallback className="text-2xl">
                      {user?.name ? getInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                        <Camera className="h-4 w-4" />
                        Change Avatar
                      </div>
                    </Label>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or GIF. Max 2MB.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Profile Form */}
                <form
                  onSubmit={profileForm.handleSubmit(saveProfile)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      {...profileForm.register("name")}
                      placeholder="John Doe"
                    />
                    {profileForm.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {profileForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...profileForm.register("email")}
                      placeholder="john@example.com"
                    />
                    {profileForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {profileForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      {...profileForm.register("bio")}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                    {profileForm.formState.errors.bio && (
                      <p className="text-sm text-destructive">
                        {profileForm.formState.errors.bio.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit">Save Changes</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={passwordForm.handleSubmit(changePassword)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password *</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...passwordForm.register("currentPassword")}
                      placeholder="Enter current password"
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password *</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...passwordForm.register("newPassword")}
                      placeholder="Enter new password"
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...passwordForm.register("confirmPassword")}
                      placeholder="Confirm new password"
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit">Change Password</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Preferences</CardTitle>
                <CardDescription>
                  Manage how you receive email communications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new features and offers
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Product Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about important product changes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>
                  Choose how the app looks to you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => updateAppearanceSettings("theme", "light")}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                      appearanceSettings.theme === "light"
                        ? "border-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Sun className="h-6 w-6" />
                    <span className="text-sm font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => updateAppearanceSettings("theme", "dark")}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                      appearanceSettings.theme === "dark"
                        ? "border-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Moon className="h-6 w-6" />
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                  <button
                    onClick={() => updateAppearanceSettings("theme", "system")}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                      appearanceSettings.theme === "system"
                        ? "border-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Monitor className="h-6 w-6" />
                    <span className="text-sm font-medium">System</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Font Size</CardTitle>
                <CardDescription>
                  Adjust the text size for better readability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={appearanceSettings.fontSize}
                  onValueChange={(value) =>
                    updateAppearanceSettings("fontSize", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium (Default)</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Language</CardTitle>
                <CardDescription>
                  Select your preferred language
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={appearanceSettings.language}
                  onValueChange={(value) =>
                    updateAppearanceSettings("language", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      updateNotificationSettings("emailNotifications", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) =>
                      updateNotificationSettings("pushNotifications", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Task Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminders for upcoming tasks
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.taskReminders}
                    onCheckedChange={(checked) =>
                      updateNotificationSettings("taskReminders", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Document Shares</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications when someone shares a document with you
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.documentShares}
                    onCheckedChange={(checked) =>
                      updateNotificationSettings("documentShares", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Calendar Events</Label>
                    <p className="text-sm text-muted-foreground">
                      Reminders for upcoming calendar events
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.calendarEvents}
                    onCheckedChange={(checked) =>
                      updateNotificationSettings("calendarEvents", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a weekly summary of your activity
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklyDigest}
                    onCheckedChange={(checked) =>
                      updateNotificationSettings("weeklyDigest", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable 2FA</Label>
                    <p className="text-sm text-muted-foreground">
                      Require a code from your phone to sign in
                    </p>
                  </div>
                  <Switch checked={twoFactorEnabled} onCheckedChange={toggleTwoFactor} />
                </div>
                {twoFactorEnabled && (
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm">
                      Two-factor authentication is enabled. Use your authenticator app to
                      generate codes when signing in.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Manage devices where you're currently logged in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-muted p-2">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{session.device}</p>
                            {session.current && (
                              <Badge variant="default" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {session.location} • Last active{" "}
                            {format(session.lastActive, "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                      {!session.current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => logoutSession(session.id)}
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {session.id !== sessions[sessions.length - 1].id && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions that affect your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                  <div>
                    <Label className="text-destructive">Logout All Devices</Label>
                    <p className="text-sm text-muted-foreground">
                      Sign out from all devices except this one
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowLogoutDialog(true)}
                  >
                    Logout All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Logout All Devices Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout from all devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out from all devices except the current one. You'll need to
              sign in again on those devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={logoutAllDevices}>
              Logout All Devices
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
