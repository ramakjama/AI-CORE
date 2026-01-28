import { AdminNav } from '@/components/admin/admin-nav'
import { AdminHeader } from '@/components/admin/admin-header'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 p-6 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  )
}
