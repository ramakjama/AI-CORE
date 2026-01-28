'use client'

import { Module } from '@/store/module-store'
import { Badge } from '@/components/ui/badge'

interface ModulesOverviewProps {
  modules: Module[]
}

export function ModulesOverview({ modules }: ModulesOverviewProps) {
  const getStatusColor = (status: Module['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'inactive':
        return 'bg-gray-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-4">
      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">No modules available</p>
      ) : (
        modules.slice(0, 5).map((module) => (
          <div
            key={module.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full ${getStatusColor(module.status)}`} />
              <div>
                <p className="font-medium">{module.name}</p>
                <p className="text-sm text-muted-foreground">{module.category}</p>
              </div>
            </div>
            <Badge variant="outline">{module.status}</Badge>
          </div>
        ))
      )}
    </div>
  )
}
