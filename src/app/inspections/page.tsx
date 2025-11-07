'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Eye, Copy } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function InspectionsPage() {
  const [inspections, setInspections] = useState([
    {
      id: '1',
      legalName: 'Bar El Puerto',
      tradeName: 'El Puerto',
      status: 'completed',
      performedBy: 'Juan Pérez',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      legalName: 'Taller Naval SL',
      tradeName: 'Taller Naval',
      status: 'draft',
      performedBy: 'María García',
      createdAt: new Date('2024-01-14'),
      updatedAt: new Date('2024-01-14'),
    }
  ])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = inspection.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.tradeName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'reviewed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inspections</h1>
        <Link href="/inspections/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Inspection
          </Button>
        </Link>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inspections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="completed">Completed</option>
          <option value="reviewed">Reviewed</option>
        </select>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Inspection List</h2>
          {filteredInspections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No inspections found. <Link href="/inspections/new" className="text-primary hover:underline">Create your first inspection</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInspections.map((inspection) => (
                <div key={inspection.id} className="p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{inspection.legalName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                          {inspection.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Trade name: {inspection.tradeName}
                      </p>
                      <p className="text-sm text-muted-foreground mb-1">
                        Performed by: {inspection.performedBy}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Created: {formatDateTime(inspection.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/inspections/${inspection.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4 mr-1" />
                        Duplicate
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
