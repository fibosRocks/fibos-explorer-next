import { Navbar } from '@/components/layout/Navbar'
import { MobileNav } from '@/components/layout/MobileNav'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <Navbar />
      <main className="pt-16 pb-20 lg:pb-6 px-4 lg:px-6">
        <div className="max-w-6xl mx-auto py-6">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
