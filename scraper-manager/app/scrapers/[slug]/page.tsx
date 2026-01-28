import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogViewer } from '@/components/LogViewer';
import { ProgressTracker } from '@/components/ProgressTracker';
import { getStatusColor } from '@/lib/utils';
import { Code2, Zap, Settings, TrendingUp } from 'lucide-react';

async function getScraper(slug: string) {
  return await prisma.scraper.findUnique({
    where: { slug },
    include: {
      config: true,
      executions: {
        orderBy: { startedAt: 'desc' },
        take: 10,
      },
      metrics: {
        orderBy: { timestamp: 'desc' },
        take: 100,
      },
    },
  });
}

export default async function ScraperDetailPage({ params }: { params: { slug: string } }) {
  const scraper = await getScraper(params.slug);

  if (!scraper) {
    notFound();
  }

  const latestExecution = scraper.executions[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{scraper.name}</h1>
          <p className="text-muted-foreground">{scraper.description}</p>
        </div>
        <Badge className={`${getStatusColor(scraper.status)} text-lg px-4 py-2`}>
          {scraper.status}
        </Badge>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tech Stack */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  Technology Stack
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {scraper.techStack.map((tech) => (
                    <Badge key={tech} variant="outline">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Key Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {scraper.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Recent Executions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>Last 10 executions of this scraper</CardDescription>
            </CardHeader>
            <CardContent>
              {scraper.executions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No executions yet</p>
              ) : (
                <div className="space-y-3">
                  {scraper.executions.map((execution) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getStatusColor(execution.status)}>
                            {execution.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(execution.startedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{execution.itemsProcessed}</span> items processed
                          {execution.duration && (
                            <span className="text-muted-foreground ml-2">
                              in {(execution.duration / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-green-600">{execution.itemsSucceeded} succeeded</div>
                        {execution.itemsFailed > 0 && (
                          <div className="text-red-600">{execution.itemsFailed} failed</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Execution Tab */}
        <TabsContent value="execution">
          <ProgressTracker execution={latestExecution} />
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <LogViewer scraperId={scraper.id} />
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Scraper Configuration
              </CardTitle>
              <CardDescription>Current configuration for this scraper</CardDescription>
            </CardHeader>
            <CardContent>
              {scraper.config ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Enabled</label>
                      <p className="text-sm text-muted-foreground">
                        {scraper.config.enabled ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Max Retries</label>
                      <p className="text-sm text-muted-foreground">{scraper.config.maxRetries}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Timeout</label>
                      <p className="text-sm text-muted-foreground">
                        {scraper.config.timeout / 1000}s
                      </p>
                    </div>
                    {scraper.config.schedule && (
                      <div>
                        <label className="text-sm font-medium">Schedule</label>
                        <p className="text-sm text-muted-foreground">{scraper.config.schedule}</p>
                      </div>
                    )}
                  </div>

                  {scraper.config.settings && (
                    <div className="mt-6">
                      <label className="text-sm font-medium mb-2 block">Advanced Settings</label>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                        {JSON.stringify(scraper.config.settings, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No configuration found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>Real-time performance data and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              {scraper.metrics.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No metrics available yet</p>
              ) : (
                <div className="space-y-4">
                  {/* Add charts here using Recharts */}
                  <p className="text-sm text-muted-foreground">
                    {scraper.metrics.length} metrics recorded
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
