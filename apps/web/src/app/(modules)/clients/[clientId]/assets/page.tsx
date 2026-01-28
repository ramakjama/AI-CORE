'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Car,
  Home,
  Gem,
  TrendingUp,
  BarChart3,
  Brain,
  Download,
  Search,
  Filter,
  Calendar
} from 'lucide-react';
import PatrimonySummary from './_components/PatrimonySummary';
import VehicleCard from './_components/VehicleCard';
import VehicleForm from './_components/VehicleForm';
import VehicleDetailModal from './_components/VehicleDetailModal';
import PropertyCard from './_components/PropertyCard';
import PropertyForm from './_components/PropertyForm';
import PropertyDetailModal from './_components/PropertyDetailModal';
import ValuableCard from './_components/ValuableCard';
import ValuableForm from './_components/ValuableForm';
import InvestmentCard from './_components/InvestmentCard';
import InvestmentForm from './_components/InvestmentForm';
import PatrimonyAnalysis from './_components/PatrimonyAnalysis';
import { Vehicle, Property, Valuable, Investment, AssetSummary } from '@/types/assets';

type AssetType = 'vehicle' | 'property' | 'valuable' | 'investment';

interface SectionState {
  summary: boolean;
  vehicles: boolean;
  properties: boolean;
  valuables: boolean;
  investments: boolean;
  analysis: boolean;
}

export default function AssetsPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [valuables, setValuables] = useState<Valuable[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<AssetSummary | null>(null);

  const [expandedSections, setExpandedSections] = useState<SectionState>({
    summary: true,
    vehicles: true,
    properties: true,
    valuables: true,
    investments: true,
    analysis: false
  });

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [activeForm, setActiveForm] = useState<AssetType | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingValuable, setEditingValuable] = useState<Valuable | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadAllAssets();
  }, [clientId]);

  const loadAllAssets = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, propertiesRes, valuablesRes, investmentsRes, summaryRes] = await Promise.all([
        fetch(`/api/clients/${clientId}/assets/vehicles`),
        fetch(`/api/clients/${clientId}/assets/properties`),
        fetch(`/api/clients/${clientId}/assets/valuables`),
        fetch(`/api/clients/${clientId}/assets/investments`),
        fetch(`/api/clients/${clientId}/assets/summary`)
      ]);

      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
      if (propertiesRes.ok) setProperties(await propertiesRes.json());
      if (valuablesRes.ok) setValuables(await valuablesRes.json());
      if (investmentsRes.ok) setInvestments(await investmentsRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof SectionState) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAddAsset = (type: AssetType) => {
    setActiveForm(type);
    setShowAddMenu(false);
  };

  const handleVehicleSaved = async () => {
    setActiveForm(null);
    setEditingVehicle(null);
    await loadAllAssets();
  };

  const handlePropertySaved = async () => {
    setActiveForm(null);
    setEditingProperty(null);
    await loadAllAssets();
  };

  const handleValuableSaved = async () => {
    setActiveForm(null);
    setEditingValuable(null);
    await loadAllAssets();
  };

  const handleInvestmentSaved = async () => {
    setActiveForm(null);
    setEditingInvestment(null);
    await loadAllAssets();
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este vehículo?')) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/assets/vehicles/${vehicleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadAllAssets();
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/assets/properties/${propertyId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadAllAssets();
      }
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };

  const handleDeleteValuable = async (valuableId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este objeto de valor?')) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/assets/valuables/${valuableId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadAllAssets();
      }
    } catch (error) {
      console.error('Error deleting valuable:', error);
    }
  };

  const handleDeleteInvestment = async (investmentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta inversión?')) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/assets/investments/${investmentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadAllAssets();
      }
    } catch (error) {
      console.error('Error deleting investment:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/assets/export-pdf`, {
        method: 'POST'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patrimonio-cliente-${clientId}.pdf`;
        a.click();
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Patrimonio</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión completa de activos del cliente
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>

          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Añadir Activo
              <ChevronDown className="w-4 h-4" />
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <button
                  onClick={() => handleAddAsset('vehicle')}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Car className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700 dark:text-gray-300">Vehículo</span>
                </button>
                <button
                  onClick={() => handleAddAsset('property')}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Home className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700 dark:text-gray-300">Vivienda</span>
                </button>
                <button
                  onClick={() => handleAddAsset('valuable')}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Gem className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700 dark:text-gray-300">Objeto de Valor</span>
                </button>
                <button
                  onClick={() => handleAddAsset('investment')}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <span className="text-gray-700 dark:text-gray-300">Inversión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resumen de Patrimonio */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('summary')}
          className="flex items-center justify-between w-full px-6 py-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Resumen de Patrimonio
            </h2>
          </div>
          {expandedSections.summary ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {expandedSections.summary && summary && (
          <div className="mt-4">
            <PatrimonySummary summary={summary} />
          </div>
        )}
      </div>

      {/* Vehículos Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('vehicles')}
          className="flex items-center justify-between w-full px-6 py-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <Car className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Vehículos ({vehicles.length})
            </h2>
          </div>
          {expandedSections.vehicles ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {expandedSections.vehicles && (
          <div className="mt-4">
            {vehicles.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
                <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay vehículos registrados
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Añade el primer vehículo del cliente
                </p>
                <button
                  onClick={() => handleAddAsset('vehicle')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Añadir Vehículo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map(vehicle => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onView={() => setSelectedVehicle(vehicle)}
                    onEdit={() => {
                      setEditingVehicle(vehicle);
                      setActiveForm('vehicle');
                    }}
                    onDelete={() => handleDeleteVehicle(vehicle.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Viviendas Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('properties')}
          className="flex items-center justify-between w-full px-6 py-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <Home className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Viviendas ({properties.length})
            </h2>
          </div>
          {expandedSections.properties ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {expandedSections.properties && (
          <div className="mt-4">
            {properties.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
                <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay propiedades registradas
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Añade la primera propiedad del cliente
                </p>
                <button
                  onClick={() => handleAddAsset('property')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Añadir Propiedad
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map(property => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onView={() => setSelectedProperty(property)}
                    onEdit={() => {
                      setEditingProperty(property);
                      setActiveForm('property');
                    }}
                    onDelete={() => handleDeleteProperty(property.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Objetos de Valor Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('valuables')}
          className="flex items-center justify-between w-full px-6 py-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <Gem className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Objetos de Valor ({valuables.length})
            </h2>
          </div>
          {expandedSections.valuables ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {expandedSections.valuables && (
          <div className="mt-4">
            {valuables.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
                <Gem className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay objetos de valor registrados
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Añade el primer objeto de valor del cliente
                </p>
                <button
                  onClick={() => handleAddAsset('valuable')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Añadir Objeto de Valor
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {valuables.map(valuable => (
                  <ValuableCard
                    key={valuable.id}
                    valuable={valuable}
                    onEdit={() => {
                      setEditingValuable(valuable);
                      setActiveForm('valuable');
                    }}
                    onDelete={() => handleDeleteValuable(valuable.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inversiones Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('investments')}
          className="flex items-center justify-between w-full px-6 py-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Inversiones ({investments.length})
            </h2>
          </div>
          {expandedSections.investments ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {expandedSections.investments && (
          <div className="mt-4">
            {investments.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay inversiones registradas
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Añade la primera inversión del cliente
                </p>
                <button
                  onClick={() => handleAddAsset('investment')}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Añadir Inversión
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {investments.map(investment => (
                  <InvestmentCard
                    key={investment.id}
                    investment={investment}
                    onEdit={() => {
                      setEditingInvestment(investment);
                      setActiveForm('investment');
                    }}
                    onDelete={() => handleDeleteInvestment(investment.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Análisis IA del Patrimonio */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('analysis')}
          className="flex items-center justify-between w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-white" />
            <h2 className="text-xl font-semibold text-white">
              Análisis IA del Patrimonio
            </h2>
          </div>
          {expandedSections.analysis ? (
            <ChevronUp className="w-5 h-5 text-white" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white" />
          )}
        </button>

        {expandedSections.analysis && (
          <div className="mt-4">
            <PatrimonyAnalysis clientId={clientId} />
          </div>
        )}
      </div>

      {/* Modals */}
      {activeForm === 'vehicle' && (
        <VehicleForm
          clientId={clientId}
          vehicle={editingVehicle}
          onClose={() => {
            setActiveForm(null);
            setEditingVehicle(null);
          }}
          onSaved={handleVehicleSaved}
        />
      )}

      {activeForm === 'property' && (
        <PropertyForm
          clientId={clientId}
          property={editingProperty}
          onClose={() => {
            setActiveForm(null);
            setEditingProperty(null);
          }}
          onSaved={handlePropertySaved}
        />
      )}

      {activeForm === 'valuable' && (
        <ValuableForm
          clientId={clientId}
          valuable={editingValuable}
          onClose={() => {
            setActiveForm(null);
            setEditingValuable(null);
          }}
          onSaved={handleValuableSaved}
        />
      )}

      {activeForm === 'investment' && (
        <InvestmentForm
          clientId={clientId}
          investment={editingInvestment}
          onClose={() => {
            setActiveForm(null);
            setEditingInvestment(null);
          }}
          onSaved={handleInvestmentSaved}
        />
      )}

      {selectedVehicle && (
        <VehicleDetailModal
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onEdit={() => {
            setEditingVehicle(selectedVehicle);
            setSelectedVehicle(null);
            setActiveForm('vehicle');
          }}
        />
      )}

      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onEdit={() => {
            setEditingProperty(selectedProperty);
            setSelectedProperty(null);
            setActiveForm('property');
          }}
        />
      )}
    </div>
  );
}
