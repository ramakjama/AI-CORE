'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SystemHealth } from '@/components/admin/system-health'
import { ModuleManagement } from '@/components/admin/module-management'
import { AgentMonitoring } from '@/components/admin/agent-monitoring'
import { useSystemStore } from '@/store/system-store'

export default function AdminDashboard() {
  const { fetchSystemStatus } = useSystemStore()

  useEffect(() => {
    fetchSystemStatus()
    const interval = setInterval(fetchSystemStatus, 5000)
    return () => clearInterval(interval)
  }, [fetchSystemStatus])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System control and monitoring center
        </p>
      </div>

      <SystemHealth />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Module Management</CardTitle>
            <CardDescription>
              Control and configure system modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModuleManagement />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Agent Monitoring</CardTitle>
            <CardDescription>
              Monitor AI agent activity and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AgentMonitoring />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
