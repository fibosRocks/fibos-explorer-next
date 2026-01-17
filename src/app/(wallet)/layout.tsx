import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { WalletMobileNav } from '@/components/layout/WalletMobileNav'

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
        <div className="max-w-5xl mx-auto py-4 lg:py-6">
          <WalletMobileNav />
          <div className="mt-4 lg:mt-0">
            {children}
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
