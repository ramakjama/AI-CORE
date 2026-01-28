"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  HardDrive,
  Activity,
  Download,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { format, subDays } from "date-fns";
import dynamic from "next/dynamic";
import type { ChartData, ChartOptions } from "chart.js";
import type { EChartsOption } from "echarts";

// Dynamically import chart components to avoid SSR issues
const Line = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Line),
  { ssr: false }
);
const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), {
  ssr: false,
});
const Pie = dynamic(() => import("react-chartjs-2").then((mod) => mod.Pie), {
  ssr: false,
});
const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
});

// Register Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Types
interface KPIData {
  totalDocuments: number;
  totalUsers: number;
  storageUsed: number;
  activeSessions: number;
  documentChange: number;
  userChange: number;
  storageChange: number;
  sessionChange: number;
}

interface UsageData {
  labels: string[];
  values: number[];
}

interface DocumentsByType {
  labels: string[];
  values: number[];
}

interface StorageByCategory {
  labels: string[];
  values: number[];
}

interface ActiveUsersData {
  labels: string[];
  values: number[];
}

type DateRange = "7d" | "30d" | "90d" | "custom";

// Mock API functions
const fetchKPIData = async (range: DateRange): Promise<KPIData> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    totalDocuments: 1247,
    totalUsers: 156,
    storageUsed: 45.8,
    activeSessions: 23,
    documentChange: 12.5,
    userChange: 8.3,
    storageChange: 15.2,
    sessionChange: -5.1,
  };
};

const fetchUsageData = async (range: DateRange): Promise<UsageData> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const labels = Array.from({ length: days }, (_, i) =>
    format(subDays(new Date(), days - i - 1), "MMM d")
  );
  const values = Array.from({ length: days }, () =>
    Math.floor(Math.random() * 100 + 50)
  );
  return { labels, values };
};

const fetchDocumentsByType = async (
  range: DateRange
): Promise<DocumentsByType> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    labels: ["Documents", "Spreadsheets", "Presentations", "PDFs", "Images"],
    values: [450, 320, 180, 215, 82],
  };
};

const fetchStorageByCategory = async (
  range: DateRange
): Promise<StorageByCategory> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    labels: ["Documents", "Images", "Videos", "Archives", "Other"],
    values: [15.2, 12.5, 10.1, 5.8, 2.2],
  };
};

const fetchActiveUsersData = async (
  range: DateRange
): Promise<ActiveUsersData> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const labels = Array.from({ length: days }, (_, i) =>
    format(subDays(new Date(), days - i - 1), "MMM d")
  );
  const values = Array.from({ length: days }, () =>
    Math.floor(Math.random() * 50 + 10)
  );
  return { labels, values };
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Queries
  const { data: kpiData, isLoading: kpiLoading, refetch: refetchKPI } = useQuery({
    queryKey: ["analytics-kpi", dateRange],
    queryFn: () => fetchKPIData(dateRange),
  });

  const { data: usageData, isLoading: usageLoading, refetch: refetchUsage } = useQuery({
    queryKey: ["analytics-usage", dateRange],
    queryFn: () => fetchUsageData(dateRange),
  });

  const { data: documentsData, isLoading: documentsLoading, refetch: refetchDocuments } = useQuery({
    queryKey: ["analytics-documents", dateRange],
    queryFn: () => fetchDocumentsByType(dateRange),
  });

  const { data: storageData, isLoading: storageLoading, refetch: refetchStorage } = useQuery({
    queryKey: ["analytics-storage", dateRange],
    queryFn: () => fetchStorageByCategory(dateRange),
  });

  const { data: activeUsersData, isLoading: activeUsersLoading, refetch: refetchActiveUsers } = useQuery({
    queryKey: ["analytics-active-users", dateRange],
    queryFn: () => fetchActiveUsersData(dateRange),
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetchKPI();
        refetchUsage();
        refetchDocuments();
        refetchStorage();
        refetchActiveUsers();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetchKPI, refetchUsage, refetchDocuments, refetchStorage, refetchActiveUsers]);

  const handleExportReport = () => {
    console.log("Exporting report as PDF...");
    // TODO: Implement PDF export
  };

  const handleRefresh = () => {
    refetchKPI();
    refetchUsage();
    refetchDocuments();
    refetchStorage();
    refetchActiveUsers();
  };

  // Chart configurations
  const lineChartData: ChartData<"line"> = {
    labels: usageData?.labels || [],
    datasets: [
      {
        label: "Usage",
        data: usageData?.values || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const lineChartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  const barChartData: ChartData<"bar"> = {
    labels: documentsData?.labels || [],
    datasets: [
      {
        label: "Documents",
        data: documentsData?.values || [],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(168, 85, 247, 0.8)",
        ],
        borderColor: [
          "rgb(59, 130, 246)",
          "rgb(16, 185, 129)",
          "rgb(245, 158, 11)",
          "rgb(239, 68, 68)",
          "rgb(168, 85, 247)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y} documents`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  const pieChartData: ChartData<"pie"> = {
    labels: storageData?.labels || [],
    datasets: [
      {
        data: storageData?.values || [],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(168, 85, 247, 0.8)",
        ],
        borderColor: [
          "rgb(59, 130, 246)",
          "rgb(16, 185, 129)",
          "rgb(245, 158, 11)",
          "rgb(239, 68, 68)",
          "rgb(168, 85, 247)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const pieChartOptions: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed} GB`,
        },
      },
    },
  };

  // ECharts Area Chart configuration
  const areaChartOption: EChartsOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: activeUsersData?.labels || [],
    },
    yAxis: {
      type: "value",
      name: "Users",
    },
    series: [
      {
        name: "Active Users",
        type: "line",
        smooth: true,
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(168, 85, 247, 0.5)" },
              { offset: 1, color: "rgba(168, 85, 247, 0.1)" },
            ],
          },
        },
        lineStyle: { color: "rgb(168, 85, 247)" },
        itemStyle: { color: "rgb(168, 85, 247)" },
        data: activeUsersData?.values || [],
      },
    ],
  };

  const KPICard = ({
    title,
    value,
    change,
    icon: Icon,
    suffix = "",
  }: {
    title: string;
    value: number;
    change: number;
    icon: any;
    suffix?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">
              {value.toLocaleString()}
              {suffix}
            </p>
            <div
              className={`flex items-center gap-1 text-xs ${
                change >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              <TrendingUp
                className={`h-3 w-3 ${change < 0 ? "rotate-180" : ""}`}
              />
              <span>
                {Math.abs(change)}% {change >= 0 ? "increase" : "decrease"}
              </span>
            </div>
          </div>
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Monitor your workspace performance and insights
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={dateRange}
              onValueChange={(value) => setDateRange(value as DateRange)}
            >
              <SelectTrigger className="w-[150px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="icon"
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? "Auto-refresh enabled" : "Enable auto-refresh"}
            >
              <Activity className={`h-4 w-4 ${autoRefresh ? "animate-pulse" : ""}`} />
            </Button>
            <Button onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          variants={itemVariants}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {kpiLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-8 w-16 bg-muted rounded" />
                    <div className="h-3 w-20 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <KPICard
                title="Total Documents"
                value={kpiData?.totalDocuments || 0}
                change={kpiData?.documentChange || 0}
                icon={FileText}
              />
              <KPICard
                title="Total Users"
                value={kpiData?.totalUsers || 0}
                change={kpiData?.userChange || 0}
                icon={Users}
              />
              <KPICard
                title="Storage Used"
                value={kpiData?.storageUsed || 0}
                change={kpiData?.storageChange || 0}
                icon={HardDrive}
                suffix=" GB"
              />
              <KPICard
                title="Active Sessions"
                value={kpiData?.activeSessions || 0}
                change={kpiData?.sessionChange || 0}
                icon={Activity}
              />
            </>
          )}
        </motion.div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Line Chart - Usage Over Time */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Usage Over Time
                </CardTitle>
                <CardDescription>
                  Track your workspace activity trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usageLoading ? (
                  <div className="h-[300px] animate-pulse bg-muted rounded" />
                ) : (
                  <div className="h-[300px]">
                    <Line data={lineChartData} options={lineChartOptions} />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Bar Chart - Documents by Type */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents by Type
                </CardTitle>
                <CardDescription>
                  Distribution of document types
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="h-[300px] animate-pulse bg-muted rounded" />
                ) : (
                  <div className="h-[300px]">
                    <Bar data={barChartData} options={barChartOptions} />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pie Chart - Storage by Category */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Storage by Category
                </CardTitle>
                <CardDescription>
                  Storage distribution across categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {storageLoading ? (
                  <div className="h-[300px] animate-pulse bg-muted rounded" />
                ) : (
                  <div className="h-[300px]">
                    <Pie data={pieChartData} options={pieChartOptions} />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Area Chart - Active Users */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Active Users
                </CardTitle>
                <CardDescription>
                  Monitor user engagement over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeUsersLoading ? (
                  <div className="h-[300px] animate-pulse bg-muted rounded" />
                ) : (
                  <div className="h-[300px]">
                    <ReactECharts option={areaChartOption} style={{ height: "100%" }} />
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
