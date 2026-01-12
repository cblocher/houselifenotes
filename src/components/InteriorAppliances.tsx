import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency, type Country } from '../lib/currency';
import { Plus, Trash2, Edit2, Wrench, X, ExternalLink, Paperclip } from 'lucide-react';
import { FileUpload, UploadedFile } from './FileUpload';
import { DeleteConfirmationModal, shouldShowDeleteConfirmation } from './DeleteConfirmationModal';

interface InteriorAppliancesProps {
  houseId: string;
  onHasUnsavedChanges?: (hasChanges: boolean) => void;
}

interface Appliance {
  id: string;
  appliance_type: string;
  brand: string | null;
  model: string | null;
  date_purchased: string | null;
  date_installed: string | null;
  installer_name: string | null;
  purchase_cost: number;
  installation_cost: number;
  notes: string | null;
  purchase_location: string | null;
  support_link: string | null;
}

interface Attachment {
  id: string;
  appliance_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  description: string | null;
}

interface Repair {
  id: string;
  appliance_id: string;
  repair_date: string;
  repair_cost: number;
  technician_name: string | null;
  description: string;
}

export function InteriorAppliances({ houseId, onHasUnsavedChanges }: InteriorAppliancesProps) {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [repairs, setRepairs] = useState<Record<string, Repair[]>>({});
  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState<string | null>(null);
  const [showRepairForm, setShowRepairForm] = useState<string | null>(null);
  const [newAppliance, setNewAppliance] = useState<Partial<Appliance>>({
    purchase_cost: 0,
    installation_cost: 0,
  });
  const [newRepair, setNewRepair] = useState<Partial<Repair>>({
    repair_cost: 0,
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [country, setCountry] = useState<Country | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'appliance' | 'attachment' | 'repair' | null;
    id: string | null;
    applianceId?: string;
    itemName: string;
  }>({ isOpen: false, type: null, id: null, itemName: '' });

  useEffect(() => {
    loadAppliances();
    loadHouseCountry();
  }, [houseId]);

  useEffect(() => {
    const hasUnsavedAppliance = showAddForm && (
      newAppliance.appliance_type ||
      newAppliance.brand ||
      newAppliance.model ||
      uploadedFiles.length > 0
    );
    const hasUnsavedRepair = showRepairForm !== null && (
      newRepair.repair_date ||
      newRepair.description ||
      (newRepair.repair_cost && newRepair.repair_cost > 0)
    );
    onHasUnsavedChanges?.(hasUnsavedAppliance || hasUnsavedRepair);
  }, [showAddForm, newAppliance, uploadedFiles, showRepairForm, newRepair]);

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

  const loadAppliances = async () => {
    try {
      const { data, error } = await supabase
        .from('interior_appliances')
        .select('*')
        .eq('house_id', houseId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setAppliances(data);
        data.forEach((appliance) => {
          loadRepairs(appliance.id);
          loadAttachments(appliance.id);
        });
      }
    } catch (error) {
      console.error('Error loading appliances:', error);
    }
  };

  const loadRepairs = async (applianceId: string) => {
    try {
      const { data, error } = await supabase
        .from('appliance_repairs')
        .select('*')
        .eq('appliance_id', applianceId)
        .is('deleted_at', null)
        .order('repair_date', { ascending: false });

      if (error) throw error;
      if (data) {
        setRepairs((prev) => ({ ...prev, [applianceId]: data }));
      }
    } catch (error) {
      console.error('Error loading repairs:', error);
    }
  };

  const loadAttachments = async (applianceId: string) => {
    try {
      const { data, error } = await supabase
        .from('appliance_attachments')
        .select('*')
        .eq('appliance_id', applianceId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setAttachments((prev) => ({ ...prev, [applianceId]: data }));
      }
    } catch (error) {
      console.error('Error loading attachments:', error);
    }
  };

  const saveAppliance = async () => {
    try {
      let applianceId: string;

      if (editingAppliance) {
        const { error } = await supabase
          .from('interior_appliances')
          .update(newAppliance)
          .eq('id', editingAppliance);

        if (error) throw error;
        applianceId = editingAppliance;
      } else {
        const { data, error } = await supabase
          .from('interior_appliances')
          .insert({ ...newAppliance, house_id: houseId })
          .select()
          .single();

        if (error) throw error;
        if (!data) throw new Error('No data returned');

        applianceId = data.id;
        setAppliances([data, ...appliances]);
      }

      if (uploadedFiles.length > 0) {
        const attachmentsToInsert = uploadedFiles.map(file => ({
          appliance_id: applianceId,
          file_name: file.file_name,
          file_url: file.file_url,
          file_type: file.file_type,
          file_size: file.file_size,
          description: file.description || null,
        }));

        const { error: attachmentError } = await supabase
          .from('appliance_attachments')
          .insert(attachmentsToInsert);

        if (attachmentError) throw attachmentError;
      }

      setShowAddForm(false);
      setEditingAppliance(null);
      setNewAppliance({ purchase_cost: 0, installation_cost: 0 });
      setUploadedFiles([]);
      loadAppliances();
    } catch (error) {
      console.error('Error saving appliance:', error);
    }
  };

  const handleDeleteApplianceClick = (appliance: Appliance) => {
    if (shouldShowDeleteConfirmation()) {
      const itemName = `${appliance.appliance_type}${appliance.brand ? ` (${appliance.brand})` : ''}`;
      setDeleteConfirmation({
        isOpen: true,
        type: 'appliance',
        id: appliance.id,
        itemName
      });
    } else {
      deleteAppliance(appliance.id);
    }
  };

  const deleteAppliance = async (id: string) => {
    try {
      const { error } = await supabase.rpc('permanent_delete_appliance', { appliance_id: id });
      if (error) throw error;
      setAppliances(appliances.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Error deleting appliance:', error);
    }
  };

  const startEdit = (appliance: Appliance) => {
    setNewAppliance(appliance);
    setEditingAppliance(appliance.id);
    setShowAddForm(true);
    setUploadedFiles([]);
  };

  const handleDeleteAttachmentClick = (attachment: Attachment, applianceId: string) => {
    if (shouldShowDeleteConfirmation()) {
      setDeleteConfirmation({
        isOpen: true,
        type: 'attachment',
        id: attachment.id,
        applianceId,
        itemName: attachment.file_name
      });
    } else {
      deleteAttachment(attachment.id, applianceId);
    }
  };

  const deleteAttachment = async (attachmentId: string, applianceId: string) => {
    try {
      const { error } = await supabase
        .from('appliance_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;
      setAttachments((prev) => ({
        ...prev,
        [applianceId]: prev[applianceId].filter((a) => a.id !== attachmentId),
      }));
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  const addRepair = async (applianceId: string) => {
    try {
      const { data, error } = await supabase
        .from('appliance_repairs')
        .insert({ ...newRepair, appliance_id: applianceId })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setRepairs((prev) => ({
          ...prev,
          [applianceId]: [data, ...(prev[applianceId] || [])],
        }));
        setShowRepairForm(null);
        setNewRepair({ repair_cost: 0 });
      }
    } catch (error) {
      console.error('Error adding repair:', error);
    }
  };

  const handleDeleteRepairClick = (repair: Repair, applianceId: string) => {
    if (shouldShowDeleteConfirmation()) {
      const itemName = `${repair.repair_type || 'Repair'}${repair.repairman_name ? ` by ${repair.repairman_name}` : ''}`;
      setDeleteConfirmation({
        isOpen: true,
        type: 'repair',
        id: repair.id,
        applianceId,
        itemName
      });
    } else {
      deleteRepair(repair.id, applianceId);
    }
  };

  const deleteRepair = async (repairId: string, applianceId: string) => {
    try {
      const { error } = await supabase
        .from('appliance_repairs')
        .delete()
        .eq('id', repairId);

      if (error) throw error;
      setRepairs((prev) => ({
        ...prev,
        [applianceId]: prev[applianceId].filter((r) => r.id !== repairId),
      }));
    } catch (error) {
      console.error('Error deleting repair:', error);
    }
  };

  const applianceTypes = [
    'Refrigerator',
    'Stove/Oven',
    'Dishwasher',
    'Microwave',
    'Washing Machine',
    'Dryer',
    'Water Heater',
    'HVAC System',
    'Furnace',
    'Air Conditioner',
    'Garbage Disposal',
    'Other',
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Interior Appliances</h1>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingAppliance(null);
            setNewAppliance({ purchase_cost: 0, installation_cost: 0 });
            setUploadedFiles([]);
          }}
          className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Appliance</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            {editingAppliance ? 'Edit Appliance' : 'Add New Appliance'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Appliance Type</label>
              <select
                value={newAppliance.appliance_type || ''}
                onChange={(e) => setNewAppliance({ ...newAppliance, appliance_type: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select type...</option>
                {applianceTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Brand</label>
              <input
                type="text"
                value={newAppliance.brand || ''}
                onChange={(e) => setNewAppliance({ ...newAppliance, brand: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="GE, Whirlpool, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Model</label>
              <input
                type="text"
                value={newAppliance.model || ''}
                onChange={(e) => setNewAppliance({ ...newAppliance, model: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Model number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Price Paid</label>
              <input
                type="number"
                value={newAppliance.purchase_cost || ''}
                onChange={(e) => setNewAppliance({ ...newAppliance, purchase_cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Installation Cost</label>
              <input
                type="number"
                value={newAppliance.installation_cost || ''}
                onChange={(e) => setNewAppliance({ ...newAppliance, installation_cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date Purchased</label>
              <input
                type="date"
                value={newAppliance.date_purchased || ''}
                onChange={(e) => setNewAppliance({ ...newAppliance, date_purchased: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date Installed</label>
              <input
                type="date"
                value={newAppliance.date_installed || ''}
                onChange={(e) => setNewAppliance({ ...newAppliance, date_installed: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Installer Name</label>
              <input
                type="text"
                value={newAppliance.installer_name || ''}
                onChange={(e) => setNewAppliance({ ...newAppliance, installer_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Company or person name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Purchase Location</label>
              <input
                type="text"
                value={newAppliance.purchase_location || ''}
                onChange={(e) => setNewAppliance({ ...newAppliance, purchase_location: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Store name or online retailer"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Support Link</label>
              <input
                type="url"
                value={newAppliance.support_link || ''}
                onChange={(e) => setNewAppliance({ ...newAppliance, support_link: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="https://support.manufacturer.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
              <textarea
                value={newAppliance.notes || ''}
                onChange={(e) => setNewAppliance({ ...newAppliance, notes: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={2}
                placeholder="Additional notes..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Attachments</label>
              <FileUpload
                onFilesSelected={(files) => setUploadedFiles([...uploadedFiles, ...files])}
                existingFiles={uploadedFiles}
                onRemoveFile={(index) => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                maxFiles={10}
                maxSizeMB={5}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingAppliance(null);
                setNewAppliance({ purchase_cost: 0, installation_cost: 0 });
                setUploadedFiles([]);
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={saveAppliance}
              disabled={!newAppliance.appliance_type}
              className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{editingAppliance ? 'Update' : 'Add'} Appliance</span>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {appliances.map((appliance) => (
          <div key={appliance.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">{appliance.appliance_type}</h3>
                {appliance.brand && (
                  <p className="text-slate-600">
                    {appliance.brand} {appliance.model && `- ${appliance.model}`}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => startEdit(appliance)}
                  className="p-2 text-slate-600 hover:text-emerald-600 transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteApplianceClick(appliance)}
                  className="p-2 text-slate-600 hover:text-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <span className="text-slate-500">Price Paid:</span>
                <p className="font-medium text-slate-800">{formatCurrency(appliance.purchase_cost, country)}</p>
              </div>
              <div>
                <span className="text-slate-500">Installation Cost:</span>
                <p className="font-medium text-slate-800">{formatCurrency(appliance.installation_cost, country)}</p>
              </div>
              {appliance.date_purchased && (
                <div>
                  <span className="text-slate-500">Purchased:</span>
                  <p className="font-medium text-slate-800">{new Date(appliance.date_purchased).toLocaleDateString()}</p>
                </div>
              )}
              {appliance.installer_name && (
                <div>
                  <span className="text-slate-500">Installer:</span>
                  <p className="font-medium text-slate-800">{appliance.installer_name}</p>
                </div>
              )}
              {appliance.purchase_location && (
                <div>
                  <span className="text-slate-500">Purchase Location:</span>
                  <p className="font-medium text-slate-800">{appliance.purchase_location}</p>
                </div>
              )}
              {appliance.support_link && (
                <div className="md:col-span-2">
                  <span className="text-slate-500">Support:</span>
                  <a
                    href={appliance.support_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1"
                  >
                    <span className="truncate">{appliance.support_link}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              )}
            </div>

            {appliance.notes && (
              <p className="text-sm text-slate-600 mb-4 p-3 bg-slate-50 rounded-lg">{appliance.notes}</p>
            )}

            {attachments[appliance.id] && attachments[appliance.id].length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-slate-800 flex items-center space-x-2 mb-3 text-sm">
                  <Paperclip className="w-4 h-4" />
                  <span>Attachments</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachments[appliance.id].map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3"
                    >
                      <a
                        href={attachment.file_url}
                        download={attachment.file_name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 flex-1 min-w-0 text-blue-600 hover:text-blue-700"
                      >
                        <Paperclip className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{attachment.file_name}</span>
                      </a>
                      <button
                        onClick={() => handleDeleteAttachmentClick(attachment, appliance.id)}
                        className="flex-shrink-0 text-slate-400 hover:text-red-600 transition ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-slate-200 pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-slate-800 flex items-center space-x-2">
                  <Wrench className="w-4 h-4" />
                  <span>Repair History</span>
                </h4>
                <button
                  onClick={() => setShowRepairForm(appliance.id)}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  + Add Repair
                </button>
              </div>

              {showRepairForm === appliance.id && (
                <div className="bg-slate-50 rounded-lg p-4 mb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Repair Date</label>
                      <input
                        type="date"
                        value={newRepair.repair_date || ''}
                        onChange={(e) => setNewRepair({ ...newRepair, repair_date: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Cost</label>
                      <input
                        type="number"
                        value={newRepair.repair_cost || ''}
                        onChange={(e) => setNewRepair({ ...newRepair, repair_cost: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Technician</label>
                      <input
                        type="text"
                        value={newRepair.technician_name || ''}
                        onChange={(e) => setNewRepair({ ...newRepair, technician_name: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Who did the work"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={newRepair.description || ''}
                        onChange={(e) => setNewRepair({ ...newRepair, description: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="What was repaired"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setShowRepairForm(null);
                        setNewRepair({ repair_cost: 0 });
                      }}
                      className="text-sm px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => addRepair(appliance.id)}
                      disabled={!newRepair.repair_date || !newRepair.description}
                      className="text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-3 rounded-lg transition disabled:opacity-50"
                    >
                      Add Repair
                    </button>
                  </div>
                </div>
              )}

              {repairs[appliance.id] && repairs[appliance.id].length > 0 ? (
                <div className="space-y-2">
                  {repairs[appliance.id].map((repair) => (
                    <div key={repair.id} className="flex justify-between items-start p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="font-medium text-slate-800">{repair.description}</span>
                          <span className="text-sm text-emerald-600 font-semibold">{formatCurrency(repair.repair_cost, country)}</span>
                        </div>
                        <div className="text-xs text-slate-600 space-x-3">
                          <span>{new Date(repair.repair_date).toLocaleDateString()}</span>
                          {repair.technician_name && <span>• {repair.technician_name}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRepairClick(repair, appliance.id)}
                        className="text-red-500 hover:text-red-700 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-3">No repairs recorded</p>
              )}
            </div>
          </div>
        ))}

        {appliances.length === 0 && !showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-500">No appliances added yet. Click "Add Appliance" to get started.</p>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, type: null, id: null, itemName: '' })}
        onConfirm={() => {
          if (deleteConfirmation.id && deleteConfirmation.type) {
            if (deleteConfirmation.type === 'appliance') {
              deleteAppliance(deleteConfirmation.id);
            } else if (deleteConfirmation.type === 'attachment' && deleteConfirmation.applianceId) {
              deleteAttachment(deleteConfirmation.id, deleteConfirmation.applianceId);
            } else if (deleteConfirmation.type === 'repair' && deleteConfirmation.applianceId) {
              deleteRepair(deleteConfirmation.id, deleteConfirmation.applianceId);
            }
          }
        }}
        itemName={deleteConfirmation.itemName}
        itemType={deleteConfirmation.type || 'item'}
      />
    </div>
  );
}
