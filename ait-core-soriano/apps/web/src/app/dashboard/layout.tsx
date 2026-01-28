import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  )
}
