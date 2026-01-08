'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface ConcesionActividad {
  id: string
  nombre: string
  pvaAsociado: string
  pvaAsociadoNombre?: string
  createdAt?: Date
}

interface ActividadesConcesionDialogProps {
  isOpen: boolean
  onClose: () => void
  actividades: ConcesionActividad[]
  concesionTitulo: string
  onAddActividad: () => void
}

export default function ActividadesConcesionDialog({
  isOpen,
  onClose,
  actividades,
  concesionTitulo,
  onAddActividad
}: ActividadesConcesionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Actividades de: {concesionTitulo}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {actividades.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No hay actividades asociadas</p>
            </div>
          ) : (
            actividades.map((actividad) => (
              <div
                key={actividad.id}
                className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {actividad.nombre}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {actividad.pvaAsociadoNombre || 'PVA Asociado'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          <Button
            onClick={onAddActividad}
            variant="outline"
            className="w-full border-dashed border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Asociar nueva actividad
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
