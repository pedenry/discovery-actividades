'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([])
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Activities</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Activity
        </Button>
      </div>

      {showForm && (
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Create New Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Legal Name</label>
              <Input placeholder="Enter legal name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Trade Name</label>
              <Input placeholder="Enter trade name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Admin Title Code</label>
              <Input placeholder="Enter admin title code" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sector</label>
              <Input placeholder="Enter sector" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button>Save Activity</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Activity List</h2>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No activities created yet. Click "New Activity" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity: any, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h3 className="font-semibold">{activity.legalName}</h3>
                  <p className="text-sm text-muted-foreground">{activity.sector}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
