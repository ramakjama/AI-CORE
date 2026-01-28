'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Square, Settings, BarChart3, Activity } from 'lucide-react';
import { getStatusColor } from '@/lib/utils';
import Link from 'next/link';

interface ScraperCardProps {
  scraper: {
    id: string;
    name: string;
    slug: string;
    description: string;
    status: string;
    category: string;
    techStack: string[];
    features: string[];
    icon?: string;
    color?: string;
  };
  onStart?: () => void;
  onStop?: () => void;
}

const categoryIcons: Record<string, any> = {
  CLIENT_DATA: Activity,
  DOCUMENTS: BarChart3,
  PORTFOLIO: BarChart3,
  DATABASE: BarChart3,
  CLOUD: BarChart3,
  AI_ML: BarChart3,
  INTELLIGENCE: BarChart3,
  SYSTEM: Settings,
};

export function ScraperCard({ scraper, onStart, onStop }: ScraperCardProps) {
  const IconComponent = categoryIcons[scraper.category] || Activity;
  const isRunning = scraper.status === 'RUNNING';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: scraper.color || '#3B82F6' + '20' }}
            >
              <IconComponent
                className="w-6 h-6"
                style={{ color: scraper.color || '#3B82F6' }}
              />
            </div>
            <div>
              <CardTitle className="text-xl">{scraper.name}</CardTitle>
              <Badge className={`mt-2 ${getStatusColor(scraper.status)}`}>
                {scraper.status}
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription className="mt-3">{scraper.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Tech Stack</h4>
            <div className="flex flex-wrap gap-2">
              {scraper.techStack.slice(0, 4).map((tech) => (
                <Badge key={tech} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
              {scraper.techStack.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{scraper.techStack.length - 4} more
                </Badge>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Key Features</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {scraper.features.slice(0, 3).map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {isRunning ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={onStop}
            className="flex-1"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={onStart}
            className="flex-1"
          >
            <Play className="w-4 h-4 mr-2" />
            Start
          </Button>
        )}

        <Link href={`/scrapers/${scraper.slug}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <Settings className="w-4 h-4 mr-2" />
            Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
