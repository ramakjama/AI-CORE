"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  FolderPlus,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Activity,
  BarChart3,
  HardDrive,
  FileIcon,
  Video,
} from "lucide-react";
import { format } from "date-fns";

// Types
interface Document {
  id: string;
  name: string;
  type: string;
  modified: Date;
  size: string;
}

interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: Date;
  type: "create" | "edit" | "delete" | "share";
}

interface Event {
  id: string;
  title: string;
  time: string;
  type: "meeting" | "deadline" | "reminder";
}

interface Task {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
  dueDate?: Date;
}

interface StorageData {
  used: number;
  total: number;
  byType: {
    documents: number;
    images: number;
    videos: number;
    other: number;
  };
}

interface AnalyticsData {
  labels: string[];
  values: number[];
}

// Mock API functions
const fetchDocuments = async (): Promise<Document[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [
    {
      id: "1",
      name: "Q4 Financial Report.xlsx",
      type: "spreadsheet",
      modified: new Date(Date.now() - 1000 * 60 * 30),
      size: "2.4 MB",
    },
    {
      id: "2",
      name: "Project Proposal.docx",
      type: "document",
      modified: new Date(Date.now() - 1000 * 60 * 60 * 2),
      size: "1.8 MB",
    },
    {
      id: "3",
      name: "Presentation Slides.pptx",
      type: "presentation",
      modified: new Date(Date.now() - 1000 * 60 * 60 * 5),
      size: "5.2 MB",
    },
    {
      id: "4",
      name: "Meeting Notes.txt",
      type: "document",
      modified: new Date(Date.now() - 1000 * 60 * 60 * 24),
      size: "12 KB",
    },
    {
      id: "5",
      name: "Budget Analysis.xlsx",
      type: "spreadsheet",
      modified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      size: "3.1 MB",
    },
  ];
};

const fetchActivities = async (): Promise<Activity[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [
    {
      id: "1",
      user: "Sarah Chen",
      action: "created",
      target: "Marketing Campaign.docx",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      type: "create",
    },
    {
      id: "2",
      user: "Mike Johnson",
      action: "edited",
      target: "Q4 Budget.xlsx",
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      type: "edit",
    },
    {
      id: "3",
      user: "Emily Davis",
      action: "shared",
      target: "Project Timeline",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      type: "share",
    },
    {
      id: "4",
      user: "Alex Thompson",
      action: "deleted",
      target: "Old Draft.docx",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      type: "delete",
    },
  ];
};

const fetchEvents = async (): Promise<Event[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [
    {
      id: "1",
      title: "Team Standup",
      time: "09:00 AM",
      type: "meeting",
    },
    {
      id: "2",
      title: "Client Presentation",
      time: "02:00 PM",
      type: "meeting",
    },
    {
      id: "3",
      title: "Project Deadline",
      time: "05:00 PM",
      type: "deadline",
    },
  ];
};

const fetchTasks = async (): Promise<Task[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [
    {
      id: "1",
      title: "Review Q4 financial report",
      priority: "high",
      completed: false,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
    {
      id: "2",
      title: "Update project documentation",
      priority: "medium",
      completed: false,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    },
    {
      id: "3",
      title: "Prepare presentation slides",
      priority: "high",
      completed: true,
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      id: "4",
      title: "Team meeting agenda",
      priority: "low",
      completed: false,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  ];
};

const fetchStorageData = async (): Promise<StorageData> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    used: 45.8,
    total: 100,
    byType: {
      documents: 15.2,
      images: 12.5,
      videos: 10.1,
      other: 8.0,
    },
  };
};

const fetchAnalyticsData = async (): Promise<AnalyticsData> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    values: [12, 19, 15, 25, 22, 18, 20],
  };
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Queries
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: fetchActivities,
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });

  const { data: storageData, isLoading: storageLoading } = useQuery({
    queryKey: ["storage"],
    queryFn: fetchStorageData,
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalyticsData,
  });

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "create":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "edit":
        return <FileIcon className="h-4 w-4 text-blue-500" />;
      case "share":
        return <Users className="h-4 w-4 text-purple-500" />;
      case "delete":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getEventIcon = (type: Event["type"]) => {
    switch (type) {
      case "meeting":
        return <Video className="h-4 w-4 text-blue-500" />;
      case "deadline":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "reminder":
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
    }
  };

  const quickActions = [
    {
      icon: FileText,
      label: "New Document",
      color: "bg-blue-500",
      action: () => console.log("New Document"),
    },
    {
      icon: Upload,
      label: "Upload File",
      color: "bg-green-500",
      action: () => console.log("Upload File"),
    },
    {
      icon: FolderPlus,
      label: "Create Folder",
      color: "bg-yellow-500",
      action: () => console.log("Create Folder"),
    },
    {
      icon: Calendar,
      label: "Schedule Meeting",
      color: "bg-purple-500",
      action: () => console.log("Schedule Meeting"),
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name || "User"}!
          </h1>
          <p className="text-muted-foreground">
            {format(currentTime, "EEEE, MMMM d, yyyy 'at' h:mm a")}
          </p>
        </motion.div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Welcome Card */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-white">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-white text-blue-600 text-lg">
                      {user?.name ? getInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl text-white">
                      {user?.name || "User"}
                    </CardTitle>
                    <CardDescription className="text-blue-100">
                      {user?.role || "Member"} • {user?.email}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">24</div>
                    <div className="text-xs text-muted-foreground">
                      Documents
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">12</div>
                    <div className="text-xs text-muted-foreground">
                      Projects
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">8</div>
                    <div className="text-xs text-muted-foreground">
                      Tasks Due
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Storage Usage Widget */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Storage Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {storageLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-16 bg-muted rounded" />
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {storageData?.used} GB of {storageData?.total} GB used
                        </span>
                        <span className="font-medium">
                          {storageData &&
                            Math.round(
                              (storageData.used / storageData.total) * 100
                            )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          storageData
                            ? (storageData.used / storageData.total) * 100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-blue-500" />
                          Documents
                        </span>
                        <span className="font-medium">
                          {storageData?.byType.documents} GB
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-green-500" />
                          Images
                        </span>
                        <span className="font-medium">
                          {storageData?.byType.images} GB
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-purple-500" />
                          Videos
                        </span>
                        <span className="font-medium">
                          {storageData?.byType.videos} GB
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-gray-500" />
                          Other
                        </span>
                        <span className="font-medium">
                          {storageData?.byType.other} GB
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Frequently used actions at your fingertips
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto flex-col gap-2 p-4"
                      onClick={action.action}
                    >
                      <div
                        className={`${action.color} rounded-lg p-3 text-white`}
                      >
                        <action.icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-medium">
                        {action.label}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Calendar Widget */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-12 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                ) : events && events.length > 0 ? (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 rounded-lg border p-3"
                      >
                        {getEventIcon(event.type)}
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {event.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {event.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No events scheduled for today
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Documents */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Documents
                </CardTitle>
                <CardDescription>
                  Your most recently modified files
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-12 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents?.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded bg-blue-100 dark:bg-blue-900 p-2">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Modified {format(doc.modified, "MMM d, h:mm a")}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {doc.size}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Tasks Widget */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-12 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks?.slice(0, 4).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 rounded-lg border p-3"
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          className="mt-1 h-4 w-4 rounded border-gray-300"
                          onChange={() => console.log("Toggle task")}
                        />
                        <div className="flex-1 space-y-1">
                          <p
                            className={`text-sm font-medium leading-none ${
                              task.completed
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={getPriorityColor(task.priority)}
                              className="text-xs"
                            >
                              {task.priority}
                            </Badge>
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground">
                                {format(task.dueDate, "MMM d")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Feed */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  What's happening in your workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-12 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities?.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">{activity.user}</span>{" "}
                            {activity.action}{" "}
                            <span className="font-medium">
                              {activity.target}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(activity.timestamp, "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Analytics Chart */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Usage Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="animate-pulse">
                    <div className="h-48 bg-muted rounded" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Simple Bar Chart */}
                    <div className="flex items-end justify-between gap-2 h-32">
                      {analyticsData?.values.map((value, index) => (
                        <div
                          key={index}
                          className="flex flex-col items-center gap-2 flex-1"
                        >
                          <div className="w-full bg-muted rounded-t-lg overflow-hidden flex items-end h-full">
                            <div
                              className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg transition-all"
                              style={{
                                height: `${
                                  (value /
                                    Math.max(...(analyticsData?.values || []))) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {analyticsData?.labels[index]}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-muted-foreground">
                          +12% from last week
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
