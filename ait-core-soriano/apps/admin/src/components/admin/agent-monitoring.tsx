'use client'

import { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { useAgentStore } from '@/store/agent-store'

export function AgentMonitoring() {
  const { agents, fetchAgents } = useAgentStore()

  useEffect(() => {
    fetchAgents()
    const interval = setInterval(fetchAgents, 10000)
    return () => clearInterval(interval)
  }, [fetchAgents])

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto">
      {agents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No agents active</p>
      ) : (
        agents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="flex-1">
              <p className="font-medium">{agent.name}</p>
              <p className="text-sm text-muted-foreground">{agent.type}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tasks: {agent.tasksCompleted} | Uptime: {agent.uptime}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  agent.status === 'active'
                    ? 'default'
                    : agent.status === 'idle'
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {agent.status}
              </Badge>
              <div
                className={`h-2 w-2 rounded-full ${
                  agent.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                }`}
              />
            </div>
          </div>
        ))
      )}
    </div>
  )
}
