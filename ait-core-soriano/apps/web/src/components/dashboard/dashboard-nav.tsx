'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Shield,
  BarChart3,
  Briefcase,
  Bot,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Policies', href: '/dashboard/policies', icon: FileText },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Claims', href: '/dashboard/claims', icon: Briefcase },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'AI Agents', href: '/dashboard/agents', icon: Bot },
  { name: 'Compliance', href: '/dashboard/compliance', icon: Shield },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-card border-r">
      <div className="p-6">
        <h1 className="text-xl font-bold">AIT-CORE</h1>
        <p className="text-sm text-muted-foreground">Soriano Mediadores</p>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
