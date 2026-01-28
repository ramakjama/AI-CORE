'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatDuration, formatNumber } from '@/lib/utils';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';

interface ProgressTrackerProps {
  execution?: {
    id: string;
    status: string;
    progress: number;
    currentStep?: string;
    totalSteps?: number;
    itemsProcessed: number;
    itemsSucceeded: number;
    itemsFailed: number;
    itemsSkipped: number;
    startedAt: Date;
    duration?: number;
  };
}

export function ProgressTracker({ execution }: ProgressTrackerProps) {
  if (!execution) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          No execution in progress
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (execution.status) {
      case 'RUNNING':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-600" />;
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Execution Progress</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge variant={execution.status === 'RUNNING' ? 'default' : 'secondary'}>
              {execution.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-semibold">{execution.progress.toFixed(1)}%</span>
          </div>
          <Progress value={execution.progress} className="h-3" />
          {execution.currentStep && (
            <p className="text-sm text-muted-foreground">{execution.currentStep}</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Processed</p>
            <p className="text-2xl font-bold">{formatNumber(execution.itemsProcessed)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Succeeded</p>
            <p className="text-2xl font-bold text-green-600">
              {formatNumber(execution.itemsSucceeded)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Failed</p>
            <p className="text-2xl font-bold text-red-600">
              {formatNumber(execution.itemsFailed)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Skipped</p>
            <p className="text-2xl font-bold text-yellow-600">
              {formatNumber(execution.itemsSkipped)}
            </p>
          </div>
        </div>

        {/* Time Info */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Started</p>
            <p className="text-sm font-medium">
              {new Date(execution.startedAt).toLocaleString()}
            </p>
          </div>
          {execution.duration && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-sm font-medium">{formatDuration(execution.duration)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
