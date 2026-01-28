'use client'

import { useEffect, useState } from 'react'
import { useWebSocket } from '@/hooks/use-websocket'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  type: string
  message: string
  timestamp: string
}

export function RecentActivity() {
  const { lastMessage } = useWebSocket()
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    if (lastMessage) {
      const newActivity: Activity = {
        id: Date.now().toString(),
        type: lastMessage.type || 'info',
        message: lastMessage.message || 'New event',
        timestamp: new Date().toISOString(),
      }
      setActivities(prev => [newActivity, ...prev].slice(0, 10))
    }
  }, [lastMessage])

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity</p>
      ) : (
        activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
            <div className="flex-1 space-y-1">
              <p className="text-sm">{activity.message}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
