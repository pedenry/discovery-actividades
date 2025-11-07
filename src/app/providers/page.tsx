'use client'

import { useState } from 'react'
import { Search, Download, Plus, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// Datos de ejemplo basados en la imagen
const providers = [
  {
    id: 1,
    name: "COMSA Servicio Facility Management, S.A.U.",
    nif: "A04701274",
    email: "web.comservicefm@comsa.com",
    phone: "934809150",
    contracts: ["PORT2023/00001-L2", "PORT2023/00013", "PORT2023/00018-L2"]
  },
  {
    id: 2,
    name: "CONSTRUCCIONS 2S, S.L.",
    nif: "B98119536",
    email: "c2s@c2s.es",
    phone: "936830446",
    contracts: ["PORT2025/00007-L4"]
  },
  {
    id: 3,
    name: "CONSTRUCCIONS, OBRES I REFORMES XAV...",
    nif: "19775436B",
    email: "bcanicjpd@hotmail.com",
    phone: "-",
    contracts: ["PORT2025/00007-L3"]
  },
  {
    id: 4,
    name: "DISET CONTROL DE PLAGAS SL",
    nif: "B72235258",
    email: "marjpaz@disetcontroldeplagas.com",
    phone: "934230206",
    contracts: ["PORT2025/00008-L2"]
  },
  {
    id: 5,
    name: "ELIJEN SEGURIDAD",
    nif: "28369354A",
    email: "dcomercial@elijen.com",
    phone: "916310600",
    contracts: ["PORT2023/00014"]
  },
  {
    id: 6,
    name: "FOMENT DEL RECICLATGE S.A.",
    nif: "A18681474",
    email: "info@corporat.com",
    phone: "937451892",
    contracts: ["PORTS-2025-00052-L2"]
  },
  {
    id: 7,
    name: "FOMENTO VALENCIA MANTENIMIENTO Y LI...",
    nif: "96062948A",
    email: "vicente.vela@fovalsa.com",
    phone: "961172102",
    contracts: ["PORT2025/00021-L6"]
  },
  {
    id: 8,
    name: "GESTIÓN Y SERVICIOS FOTOGRAMÉTRICOS...",
    nif: "B11652708",
    email: "gestfoto@gestfoto.com",
    phone: "934443183",
    contracts: ["PORT2023/00032"]
  },
  {
    id: 9,
    name: "LA CYCA PROJECTS AND SERVICES, S.L.",
    nif: "B30764948",
    email: "lacyca@lacyca.com",
    phone: "934325919",
    contracts: ["PORTS-2024-00186-4"]
  },
  {
    id: 10,
    name: "MEDITERRÁNEO SEÑALES MARÍTIMAS, S.L.",
    nif: "B76661588",
    email: "msm@msemar.com",
    phone: "962761022",
    contracts: ["PORT2024/00002"]
  },
  {
    id: 11,
    name: "MITIE",
    nif: "35708209U",
    email: "-",
    phone: "-",
    contracts: ["PORT-2025-00015"]
  },
  {
    id: 12,
    name: "POINT FIRE, S.L.",
    nif: "B56636198",
    email: "info@pointfire.es",
    phone: "931875252",
    contracts: ["PORT2024/00246-L2"]
  }
]

export default function ProvidersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('Empreses')

  const filteredProviders = providers.filter(provider =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.nif.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Proveidors</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Pedro Pérez</span>
          <span className="text-sm text-gray-400">Supervisor (Apports)</span>
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          
          {/* Tabs */}
          <div className="flex">
            <button
              onClick={() => setActiveTab('Empreses')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'Empreses'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Empreses
            </button>
            <button
              onClick={() => setActiveTab('Contractes')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'Contractes'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Contractes
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova empresa
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nou contracte
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NIF
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telèfon
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contractes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProviders.map((provider) => (
              <tr key={provider.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                    {provider.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {provider.nif}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {provider.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {provider.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {provider.contracts.map((contract, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer"
                      >
                        {contract}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
