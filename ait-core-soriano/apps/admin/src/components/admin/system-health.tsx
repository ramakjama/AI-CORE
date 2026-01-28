'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Cpu, HardDrive, Network } from 'lucide-react'
import { useSystemStore } from '@/store/system-store'

export function SystemHealth() {
  const { systemStatus } = useSystemStore()

  const metrics = [
    {
      name: 'CPU Usage',
      value: `${systemStatus?.cpu || 0}%`,
      icon: Cpu,
      status: (systemStatus?.cpu || 0) > 80 ? 'error' : 'normal',
    },
    {
      name: 'Memory',
      value: `${systemStatus?.memory || 0}%`,
      icon: HardDrive,
      status: (systemStatus?.memory || 0) > 80 ? 'error' : 'normal',
    },
    {
      name: 'Network',
      value: systemStatus?.network ? 'Online' : 'Offline',
      icon: Network,
      status: systemStatus?.network ? 'normal' : 'error',
    },
    {
      name: 'Active Modules',
      value: `${systemStatus?.activeModules || 0}`,
      icon: Activity,
      status: 'normal',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.name}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <div
              className={`h-2 w-2 rounded-full mt-2 ${
                metric.status === 'error' ? 'bg-red-500' : 'bg-green-500'
              }`}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
