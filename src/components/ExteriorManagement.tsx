import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency, type Country } from '../lib/currency';
import { Plus, Trash2, Edit2, Building2, X } from 'lucide-react';
import { DeleteConfirmationModal, shouldShowDeleteConfirmation } from './DeleteConfirmationModal';

interface ExteriorManagementProps {
  houseId: string;
  onHasUnsavedChanges?: (hasChanges: boolean) => void;
}

interface ExteriorFeature {
  id: string;
  feature_type: string;
  description: string;
  size: string | null;
  date_built: string | null;
  build_cost: number;
  builder_name: string | null;
}

interface ExteriorMaintenance {
  id: string;
  maintenance_type: string;
  maintenance_date: string;
  cost: number;
  contractor_name: string | null;
  description: string;
}

export function ExteriorManagement({ houseId, onHasUnsavedChanges }: ExteriorManagementProps) {
  const [features, setFeatures] = useState<ExteriorFeature[]>([]);
  const [maintenance, setMaintenance] = useState<ExteriorMaintenance[]>([]);
  const [showFeatureForm, setShowFeatureForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [editingFeature, setEditingFeature] = useState<string | null>(null);
  const [newFeature, setNewFeature] = useState<Partial<ExteriorFeature>>({ build_cost: 0 });
  const [newMaintenance, setNewMaintenance] = useState<Partial<ExteriorMaintenance>>({ cost: 0 });
  const [country, setCountry] = useState<Country | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'feature' | 'maintenance' | null;
    id: string | null;
    itemName: string;
  }>({ isOpen: false, type: null, id: null, itemName: '' });

  useEffect(() => {
    loadData();
    loadHouseCountry();
  }, [houseId]);

  useEffect(() => {
    const hasUnsavedFeature = showFeatureForm && (
      newFeature.feature_type ||
      newFeature.description ||
      newFeature.size
    );
    const hasUnsavedMaintenance = showMaintenanceForm && (
      newMaintenance.maintenance_type ||
      newMaintenance.description ||
      newMaintenance.maintenance_date
    );
    onHasUnsavedChanges?.(hasUnsavedFeature || hasUnsavedMaintenance);
  }, [showFeatureForm, newFeature, showMaintenanceForm, newMaintenance]);

  const loadHouseCountry = async () => {
    try {
      const { data, error } = await supabase
        .from('houses')
        .select('country')
        .eq('id', houseId)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setCountry(data.country);
      }
    } catch (error) {
      console.error('Error loading house country:', error);
    }
  };

  const loadData = async () => {
    try {
      const [featuresRes, maintenanceRes] = await Promise.all([
        supabase
          .from('exterior_features')
          .select('*')
          .eq('house_id', houseId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('exterior_maintenance')
          .select('*')
          .eq('house_id', houseId)
          .is('deleted_at', null)
          .order('maintenance_date', { ascending: false }),
      ]);

      if (featuresRes.data) setFeatures(featuresRes.data);
      if (maintenanceRes.data) setMaintenance(maintenanceRes.data);
    } catch (error) {
      console.error('Error loading exterior data:', error);
    }
  };

  const saveFeature = async () => {
    try {
      if (editingFeature) {
        const { error } = await supabase
          .from('exterior_features')
          .update(newFeature)
          .eq('id', editingFeature);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('exterior_features')
          .insert({ ...newFeature, house_id: houseId })
          .select()
          .single();

        if (error) throw error;
        if (data) setFeatures([data, ...features]);
      }

      setShowFeatureForm(false);
      setEditingFeature(null);
      setNewFeature({ build_cost: 0 });
      loadData();
    } catch (error) {
      console.error('Error saving feature:', error);
    }
  };

  const handleDeleteFeatureClick = (feature: ExteriorFeature) => {
    if (shouldShowDeleteConfirmation()) {
      const itemName = `${feature.feature_type}${feature.description ? ` - ${feature.description}` : ''}`;
      setDeleteConfirmation({
        isOpen: true,
        type: 'feature',
        id: feature.id,
        itemName
      });
    } else {
      deleteFeature(feature.id);
    }
  };

  const deleteFeature = async (id: string) => {
    try {
      const { error } = await supabase
        .from('exterior_features')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setFeatures(features.filter((f) => f.id !== id));
    } catch (error) {
      console.error('Error deleting feature:', error);
    }
  };

  const startEditFeature = (feature: ExteriorFeature) => {
    setNewFeature(feature);
    setEditingFeature(feature.id);
    setShowFeatureForm(true);
  };

  const saveMaintenance = async () => {
    try {
      const { data, error } = await supabase
        .from('exterior_maintenance')
        .insert({ ...newMaintenance, house_id: houseId })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMaintenance([data, ...maintenance]);
        setShowMaintenanceForm(false);
        setNewMaintenance({ cost: 0 });
      }
    } catch (error) {
      console.error('Error saving maintenance:', error);
    }
  };

  const handleDeleteMaintenanceClick = (record: ExteriorMaintenance) => {
    if (shouldShowDeleteConfirmation()) {
      const itemName = `${record.maintenance_type}${record.description ? ` - ${record.description}` : ''}`;
      setDeleteConfirmation({
        isOpen: true,
        type: 'maintenance',
        id: record.id,
        itemName
      });
    } else {
      deleteMaintenance(record.id);
    }
  };

  const deleteMaintenance = async (id: string) => {
    try {
      const { error } = await supabase
        .from('exterior_maintenance')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setMaintenance(maintenance.filter((m) => m.id !== id));
    } catch (error) {
      console.error('Error deleting maintenance:', error);
    }
  };

  const featureTypes = [
    'Barn',
    'Shed',
    'Garage',
    'Deck',
    'Patio',
    'Driveway',
    'Walkway',
    'Fence',
    'Pool',
    'Hot Tub',
    'Gazebo',
    'Pergola',
    'Other',
  ];

  const maintenanceTypes = [
    'Roofing',
    'Siding',
    'Painting',
    'Paving',
    'Deck Maintenance',
    'Fence Repair',
    'Gutter Cleaning',
    'Landscaping',
    'Tree Removal',
    'Power Washing',
    'Other',
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Exterior & Property</h1>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-slate-800">Exterior Features</h2>
          <button
            onClick={() => {
              setShowFeatureForm(true);
              setEditingFeature(null);
              setNewFeature({ build_cost: 0 });
            }}
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Feature</span>
          </button>
        </div>

        {showFeatureForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {editingFeature ? 'Edit Feature' : 'Add New Feature'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Feature Type</label>
                <select
                  value={newFeature.feature_type || ''}
                  onChange={(e) => setNewFeature({ ...newFeature, feature_type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select type...</option>
                  {featureTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Size/Dimensions</label>
                <input
                  type="text"
                  value={newFeature.size || ''}
                  onChange={(e) => setNewFeature({ ...newFeature, size: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., 20x10 ft, 500 sq ft"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Build Cost</label>
                <input
                  type="number"
                  value={newFeature.build_cost || ''}
                  onChange={(e) => setNewFeature({ ...newFeature, build_cost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date Built</label>
                <input
                  type="date"
                  value={newFeature.date_built || ''}
                  onChange={(e) => setNewFeature({ ...newFeature, date_built: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Builder Name</label>
                <input
                  type="text"
                  value={newFeature.builder_name || ''}
                  onChange={(e) => setNewFeature({ ...newFeature, builder_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Company or person name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <input
                  type="text"
                  value={newFeature.description || ''}
                  onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Brief description"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowFeatureForm(false);
                  setEditingFeature(null);
                  setNewFeature({ build_cost: 0 });
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveFeature}
                disabled={!newFeature.feature_type || !newFeature.description}
                className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{editingFeature ? 'Update' : 'Add'} Feature</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => (
            <div key={feature.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-slate-800">{feature.feature_type}</h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEditFeature(feature)}
                    className="p-1 text-slate-600 hover:text-emerald-600 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFeatureClick(feature)}
                    className="p-1 text-slate-600 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-slate-600 text-sm mb-3">{feature.description}</p>

              <div className="space-y-1 text-sm">
                {feature.size && (
                  <p className="text-slate-600">
                    <span className="font-medium">Size:</span> {feature.size}
                  </p>
                )}
                <p className="text-emerald-600 font-semibold">
                  Cost: {formatCurrency(feature.build_cost, country)}
                </p>
                {feature.date_built && (
                  <p className="text-slate-600">
                    <span className="font-medium">Built:</span>{' '}
                    {new Date(feature.date_built).toLocaleDateString()}
                  </p>
                )}
                {feature.builder_name && (
                  <p className="text-slate-600">
                    <span className="font-medium">Builder:</span> {feature.builder_name}
                  </p>
                )}
              </div>
            </div>
          ))}

          {features.length === 0 && !showFeatureForm && (
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <p className="text-slate-500">No exterior features added yet.</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-slate-800">Exterior Maintenance</h2>
          <button
            onClick={() => setShowMaintenanceForm(true)}
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Maintenance</span>
          </button>
        </div>

        {showMaintenanceForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Add Maintenance Record</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Maintenance Type</label>
                <select
                  value={newMaintenance.maintenance_type || ''}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, maintenance_type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select type...</option>
                  {maintenanceTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newMaintenance.maintenance_date || ''}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, maintenance_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cost</label>
                <input
                  type="number"
                  value={newMaintenance.cost || ''}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, cost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Contractor</label>
                <input
                  type="text"
                  value={newMaintenance.contractor_name || ''}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, contractor_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Company or person name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={newMaintenance.description || ''}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={2}
                  placeholder="Describe the work done..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowMaintenanceForm(false);
                  setNewMaintenance({ cost: 0 });
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveMaintenance}
                disabled={!newMaintenance.maintenance_type || !newMaintenance.maintenance_date || !newMaintenance.description}
                className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Add Maintenance</span>
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          {maintenance.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {maintenance.map((record) => (
                <div key={record.id} className="p-4 hover:bg-slate-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h4 className="font-semibold text-slate-800">{record.maintenance_type}</h4>
                        <span className="text-emerald-600 font-semibold">{formatCurrency(record.cost, country)}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{record.description}</p>
                      <div className="text-xs text-slate-500 space-x-3">
                        <span>{new Date(record.maintenance_date).toLocaleDateString()}</span>
                        {record.contractor_name && <span>• {record.contractor_name}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMaintenanceClick(record)}
                      className="text-red-500 hover:text-red-700 transition ml-4"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !showMaintenanceForm ? (
            <div className="p-8 text-center">
              <p className="text-slate-500">No maintenance records yet.</p>
            </div>
          ) : null}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, type: null, id: null, itemName: '' })}
        onConfirm={() => {
          if (deleteConfirmation.id && deleteConfirmation.type) {
            if (deleteConfirmation.type === 'feature') {
              deleteFeature(deleteConfirmation.id);
            } else if (deleteConfirmation.type === 'maintenance') {
              deleteMaintenance(deleteConfirmation.id);
            }
          }
        }}
        itemName={deleteConfirmation.itemName}
        itemType={deleteConfirmation.type || 'item'}
      />
    </div>
  );
}
