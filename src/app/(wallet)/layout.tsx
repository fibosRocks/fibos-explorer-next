import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-16 pb-20 lg:pb-6 px-4 lg:px-6">
        <div className="max-w-5xl mx-auto py-6">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
