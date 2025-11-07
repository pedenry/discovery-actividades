'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, X, FileText, Image } from 'lucide-react'

interface EvidenceUploaderProps {
  onUpload: (file: File, evidenceData: any) => void
  onRemove: (evidenceId: string) => void
  evidences: any[]
}

export default function EvidenceUploader({ onUpload, onRemove, evidences }: EvidenceUploaderProps) {
  const [showForm, setShowForm] = useState(false)
  const [evidenceData, setEvidenceData] = useState({
    installation: '',
    evidenceType: 'documentary' as 'documentary' | 'observed',
    installationRef: '',
    issuer: '',
    validFrom: '',
    validTo: '',
    remarks: '',
    required: false
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = () => {
    if (selectedFile && evidenceData.installation) {
      onUpload(selectedFile, evidenceData)
      setSelectedFile(null)
      setEvidenceData({
        installation: '',
        evidenceType: 'documentary',
        installationRef: '',
        issuer: '',
        validFrom: '',
        validTo: '',
        remarks: '',
        required: false
      })
      setShowForm(false)
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Evidence</h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Add Evidence
        </Button>
      </div>

      {/* Existing evidences */}
      {evidences.length > 0 && (
        <div className="space-y-2">
          {evidences.map((evidence, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                {getFileIcon(evidence.fileUrl || '')}
                <div>
                  <p className="text-sm font-medium">{evidence.installation}</p>
                  <p className="text-xs text-muted-foreground">
                    {evidence.evidenceType} • {evidence.issuer}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(evidence.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload form */}
      {showForm && (
        <div className="bg-card p-4 rounded-lg border">
          <h4 className="font-semibold mb-4">Add New Evidence</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Installation *</label>
                <Input
                  value={evidenceData.installation}
                  onChange={(e) => setEvidenceData({...evidenceData, installation: e.target.value})}
                  placeholder="Enter installation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Evidence Type</label>
                <select
                  value={evidenceData.evidenceType}
                  onChange={(e) => setEvidenceData({...evidenceData, evidenceType: e.target.value as 'documentary' | 'observed'})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="documentary">Documentary</option>
                  <option value="observed">Observed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Installation Reference</label>
                <Input
                  value={evidenceData.installationRef}
                  onChange={(e) => setEvidenceData({...evidenceData, installationRef: e.target.value})}
                  placeholder="Enter reference"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Issuer</label>
                <Input
                  value={evidenceData.issuer}
                  onChange={(e) => setEvidenceData({...evidenceData, issuer: e.target.value})}
                  placeholder="Enter issuer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Valid From</label>
                <Input
                  type="date"
                  value={evidenceData.validFrom}
                  onChange={(e) => setEvidenceData({...evidenceData, validFrom: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Valid To</label>
                <Input
                  type="date"
                  value={evidenceData.validTo}
                  onChange={(e) => setEvidenceData({...evidenceData, validTo: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Remarks</label>
              <Input
                value={evidenceData.remarks}
                onChange={(e) => setEvidenceData({...evidenceData, remarks: e.target.value})}
                placeholder="Additional observations"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">File</label>
              <input
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx"
                className="w-full px-3 py-2 border rounded-md"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleUpload} disabled={!selectedFile || !evidenceData.installation}>
              Upload Evidence
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
