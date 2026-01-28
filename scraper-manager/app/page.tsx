import { prisma } from '@/lib/prisma';
import { ScraperCard } from '@/components/ScraperCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

async function getScrapers() {
  try {
    return await prisma.scraper.findMany({
      orderBy: { priority: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching scrapers:', error);
    return [];
  }
}

async function getStats() {
  try {
    const [total, running, completed, failed] = await Promise.all([
      prisma.scraper.count(),
      prisma.scraper.count({ where: { status: 'RUNNING' } }),
      prisma.scraperExecution.count({ where: { status: 'COMPLETED' } }),
      prisma.scraperExecution.count({ where: { status: 'FAILED' } }),
    ]);

    return { total, running, completed, failed };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { total: 0, running: 0, completed: 0, failed: 0 };
  }
}

export default async function HomePage() {
  const scrapers = await getScrapers();
  const stats = await getStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Scraper Manager Dashboard</h1>
        <p className="text-muted-foreground">
          Manage and monitor all your web scrapers in one place
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scrapers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Active scraper modules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Now</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
            <p className="text-xs text-muted-foreground">Currently executing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Successful executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Failed executions</p>
          </CardContent>
        </Card>
      </div>

      {/* Scrapers Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Scrapers</h2>
        {scrapers.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No scrapers found. Run the setup script to initialize scrapers.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scrapers.map((scraper) => (
              <ScraperCard key={scraper.id} scraper={scraper} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
