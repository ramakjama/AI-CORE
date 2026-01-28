'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useModuleStore } from '@/store/module-store'

export function ModuleManagement() {
  const { modules, loading, fetchModules, toggleModule } = useModuleStore()

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {modules.length} modules available
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchModules}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {modules.map((module) => (
          <div
            key={module.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="flex-1">
              <p className="font-medium">{module.name}</p>
              <p className="text-sm text-muted-foreground">{module.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={module.status === 'active' ? 'default' : 'secondary'}>
                {module.status}
              </Badge>
              <Switch
                checked={module.status === 'active'}
                onCheckedChange={() => toggleModule(module.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
