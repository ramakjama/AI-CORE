'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ModulesOverview } from '@/components/dashboard/modules-overview'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { SystemStats } from '@/components/dashboard/system-stats'
import { useWebSocket } from '@/hooks/use-websocket'
import { useModuleStore } from '@/store/module-store'

export default function DashboardPage() {
  const { isConnected, lastMessage } = useWebSocket()
  const { modules, fetchModules } = useModuleStore()

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to AIT-CORE Soriano Insurance Management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <SystemStats />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Modules Overview</CardTitle>
            <CardDescription>
              Active modules and their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModulesOverview modules={modules} />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest events and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
