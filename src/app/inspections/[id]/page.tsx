'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import EvidenceUploader from '@/components/EvidenceUploader'
import { ArrowLeft, Copy, Edit, Save } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function InspectionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  
  // Mock inspection data - in real app, fetch from Firestore
  const [inspection, setInspection] = useState({
    id: params.id,
    legalName: 'Bar El Puerto',
    tradeName: 'El Puerto',
    adminTitleCode: 'BAR-2024-001',
    responsibleName: 'Carlos García',
    contactPerson: 'María García',
    email: 'info@elpuerto.com',
    phone: '+34 123 456 789',
    sector: 'Restauración',
    performedBy: 'Juan Pérez',
    status: 'completed',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    items: {
      'item1': {
        id: 'item1',
        name: 'Valid business license',
        type: 'requirement',
        compliance: 'compliant',
        evidences: {
          'ev1': {
            id: 'ev1',
            installation: 'Main bar area',
            fileUrl: 'license.pdf',
            evidenceType: 'documentary',
            installationRef: 'BAR-001',
            issuer: 'City Council',
            validFrom: new Date('2024-01-01'),
            validTo: new Date('2024-12-31'),
            remarks: 'Valid license displayed',
            required: true
          }
        }
      },
      'item2': {
        id: 'item2',
        name: 'Fire safety certificate',
        type: 'requirement',
        compliance: 'nonCompliant',
        evidences: {}
      },
      'item3': {
        id: 'item3',
        name: 'Environmental compliance',
        type: 'requirement',
        compliance: 'n/a',
        evidences: {}
      }
    }
  })

  const updateItemCompliance = (itemId: string, compliance: string) => {
    setInspection(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [itemId]: {
          ...(prev.items as any)[itemId],
          compliance
        }
      }
    }))
  }

  const addEvidence = (itemId: string, file: File, evidenceData: any) => {
    const evidenceId = `ev_${Date.now()}`
    // In real app, upload file to Firebase Storage first
    console.log('Adding evidence:', { itemId, file, evidenceData })
    
    setInspection(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [itemId]: {
          ...(prev.items as any)[itemId],
          evidences: {
            ...(prev.items as any)[itemId].evidences,
            [evidenceId]: {
              ...evidenceData,
              id: evidenceId,
              fileUrl: `uploaded/${file.name}`,
              validFrom: new Date(evidenceData.validFrom),
              validTo: new Date(evidenceData.validTo)
            }
          }
        }
      }
    }))
  }

  const removeEvidence = (itemId: string, evidenceId: string) => {
    setInspection(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [itemId]: {
          ...(prev.items as any)[itemId],
          evidences: Object.fromEntries(
            Object.entries((prev.items as any)[itemId].evidences).filter(([id]) => id !== evidenceId)
          )
        }
      }
    }))
  }

  const duplicateInspection = () => {
    // In real app, call duplicateInspection API
    console.log('Duplicating inspection:', inspection.id)
    router.push('/inspections/new')
  }

  const saveInspection = () => {
    // In real app, save to Firestore
    console.log('Saving inspection:', inspection)
    setIsEditing(false)
  }

  const getComplianceColor = (compliance: string) => {
    switch (compliance) {
      case 'compliant': return 'bg-green-100 text-green-800'
      case 'nonCompliant': return 'bg-red-100 text-red-800'
      case 'n/a': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{inspection.legalName}</h1>
            <p className="text-muted-foreground">
              Trade name: {inspection.tradeName} • Status: {inspection.status}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={duplicateInspection}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          {isEditing ? (
            <Button onClick={saveInspection}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inspection Details */}
        <div className="lg:col-span-1">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Inspection Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admin Title Code</p>
                <p>{inspection.adminTitleCode}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Responsible</p>
                <p>{inspection.responsibleName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact</p>
                <p>{inspection.contactPerson}</p>
                <p className="text-sm text-muted-foreground">{inspection.email}</p>
                <p className="text-sm text-muted-foreground">{inspection.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sector</p>
                <p>{inspection.sector}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Performed By</p>
                <p>{inspection.performedBy}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p>{formatDateTime(inspection.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Inspection Items */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Inspection Items</h2>
            {Object.values(inspection.items).map((item: any) => (
              <div key={item.id} className="bg-card p-6 rounded-lg border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getComplianceColor(item.compliance)}`}>
                    {item.compliance}
                  </span>
                </div>

                {isEditing && (
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={item.compliance === 'compliant' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateItemCompliance(item.id, 'compliant')}
                    >
                      Compliant
                    </Button>
                    <Button
                      variant={item.compliance === 'nonCompliant' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => updateItemCompliance(item.id, 'nonCompliant')}
                    >
                      Non-Compliant
                    </Button>
                    <Button
                      variant={item.compliance === 'n/a' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => updateItemCompliance(item.id, 'n/a')}
                    >
                      N/A
                    </Button>
                  </div>
                )}

                <EvidenceUploader
                  onUpload={(file, evidenceData) => addEvidence(item.id, file, evidenceData)}
                  onRemove={(evidenceId) => removeEvidence(item.id, evidenceId)}
                  evidences={Object.values(item.evidences)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
