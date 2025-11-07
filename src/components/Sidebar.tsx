'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  MapPin, 
  Wrench, 
  Calendar, 
  Search, 
  Truck, 
  Users, 
  FileText, 
  Settings,
  UserCog,
  Layout
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Ports',
    href: '/ports',
    icon: MapPin,
  },
  {
    title: 'Manteinement',
    href: '/maintenance',
    icon: Wrench,
  },
  {
    title: 'Calendari',
    href: '/calendar',
    icon: Calendar,
  },
  {
    title: 'Explorador',
    href: '/explorer',
    icon: Search,
  },
  {
    title: 'Proveidors',
    href: '/providers',
    icon: Truck,
  },
  {
    title: 'Concesiones',
    href: '/concesiones',
    icon: FileText,
  },
  {
    title: 'Plantillas',
    href: '/templates',
    icon: Layout,
  },
]

const bottomMenuItems = [
  {
    title: 'Ajustaments',
    href: '/settings',
    icon: Users,
  },
  {
    title: 'Report',
    href: '/reports',
    icon: FileText,
  },
  {
    title: 'Manuals',
    href: '/manuals',
    icon: FileText,
  },
  {
    title: 'Paperers',
    href: '/papers',
    icon: FileText,
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-gray-900">Apports</span>
          <div className="ml-auto">
            <Settings className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Menu */}
      <div className="flex-1 py-4">
        <nav className="px-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className={cn(
                  'w-4 h-4',
                  isActive ? 'text-blue-700' : 'text-gray-400'
                )} />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Menu */}
      <div className="border-t border-gray-200 py-4">
        <nav className="px-2">
          {bottomMenuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className={cn(
                  'w-4 h-4',
                  isActive ? 'text-blue-700' : 'text-gray-400'
                )} />
                {item.title}
              </Link>
            )
          })}
        </nav>

        {/* Administrator Section */}
        <div className="mt-4 px-2">
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600">
            <UserCog className="w-4 h-4 text-gray-400" />
            <span>Administrador</span>
          </div>
        </div>
      </div>
    </div>
  )
}
