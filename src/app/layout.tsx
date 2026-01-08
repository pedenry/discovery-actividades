import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import { Toaster } from '@/components/ui/toaster'
import { AnalyticsProvider } from '@/components/AnalyticsProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Apports - Port Activity Management',
  description: 'Sistema de gestión de actividades portuarias',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AnalyticsProvider>
          <div className=" min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-64">
              {children}
            </main>
          </div>
          <Toaster />
        </AnalyticsProvider>
      </body>
    </html>
  )
}
