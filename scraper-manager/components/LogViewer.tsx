'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLogLevelColor } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface LogEntry {
  id: string;
  level: string;
  message: string;
  timestamp: Date;
  details?: any;
}

interface LogViewerProps {
  scraperId?: string;
  executionId?: string;
  maxLogs?: number;
}

export function LogViewer({ scraperId, executionId, maxLogs = 100 }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    // Connect to WebSocket for real-time logs
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');

    ws.onopen = () => {
      console.log('WebSocket connected');
      if (scraperId) {
        ws.send(JSON.stringify({ type: 'subscribe:logs', scraperId }));
      }
      if (executionId) {
        ws.send(JSON.stringify({ type: 'subscribe:execution', executionId }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data);
        setLogs((prev) => {
          const newLogs = [...prev, log];
          if (newLogs.length > maxLogs) {
            return newLogs.slice(-maxLogs);
          }
          return newLogs;
        });
      } catch (error) {
        console.error('Error parsing log:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [scraperId, executionId, maxLogs]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ALL') return true;
    return log.level === filter;
  });

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Real-time Logs</CardTitle>
          <div className="flex gap-2">
            <Badge
              variant={filter === 'ALL' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilter('ALL')}
            >
              All
            </Badge>
            <Badge
              variant={filter === 'ERROR' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilter('ERROR')}
            >
              Errors
            </Badge>
            <Badge
              variant={filter === 'WARN' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilter('WARN')}
            >
              Warnings
            </Badge>
            <Badge
              variant={filter === 'INFO' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilter('INFO')}
            >
              Info
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto px-6 pb-6 font-mono text-sm"
          onScroll={(e) => {
            const element = e.currentTarget;
            const isAtBottom =
              Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10;
            setAutoScroll(isAtBottom);
          }}
        >
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No logs yet...
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 transition-colors"
                >
                  <Badge className={getLogLevelColor(log.level)} variant="outline">
                    {log.level}
                  </Badge>
                  <div className="flex-1">
                    <div className="text-foreground">{log.message}</div>
                    {log.details && (
                      <pre className="mt-1 text-xs text-muted-foreground overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
