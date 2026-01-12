import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Plus, Trash2, CreditCard as Edit2, X, Check } from 'lucide-react';
import { DeleteConfirmationModal, shouldShowDeleteConfirmation } from './DeleteConfirmationModal';

interface HouseDetailsProps {
  houseId: string | null;
  onHouseCreated: (id: string) => void;
  onHasUnsavedChanges?: (hasChanges: boolean) => void;
}

interface House {
  id: string;
  year_built: number | null;
  year_bought: number | null;
  square_footage: number | null;
  realtor_name: string | null;
  price_paid: number | null;
  price_sold: number | null;
  year_sold: number | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  country_other: string | null;
}

interface Room {
  id: string;
  room_type: string;
  room_type_other: string | null;
  count: number;
  notes: string | null;
  basement_details: {
    unfinished?: boolean;
    partially_finished?: boolean;
    finished?: boolean;
    crawl_space?: boolean;
  } | null;
  garage_details: {
    one_car?: boolean;
    two_car?: boolean;
    other?: boolean;
  } | null;
}

interface PropertyDetails {
  id: string;
  acreage: number | null;
  sewage_type: string;
  sewage_type_other: string | null;
  story: string | null;
  story_other: string | null;
  build_style: string | null;
  build_style_other: string | null;
  color_type: string | null;
  color_type_other: string | null;
  house_color: string | null;
  lot_description: string | null;
}

export function HouseDetails({ houseId, onHouseCreated, onHasUnsavedChanges }: HouseDetailsProps) {
  const [house, setHouse] = useState<Partial<House>>({ country: 'United States' });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [propertyDetails, setPropertyDetails] = useState<Partial<PropertyDetails>>({ sewage_type: 'municipal' });
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [propertyDetailsLoading, setPropertyDetailsLoading] = useState(false);
  const [propertyDetailsSaveMessage, setPropertyDetailsSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [newRoom, setNewRoom] = useState({ room_type: '', room_type_other: '', count: 1, notes: '', basement_details: null as Room['basement_details'], garage_details: null as Room['garage_details'] });
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editedRoom, setEditedRoom] = useState<Partial<Room>>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; roomId: string | null; roomName: string }>({ isOpen: false, roomId: null, roomName: '' });

  const initialHouse = useRef<Partial<House>>({ country: 'United States' });
  const initialPropertyDetails = useRef<Partial<PropertyDetails>>({ sewage_type: 'municipal' });

  const pluralizeRoomType = (roomType: string, count: number): string => {
    if (count <= 1) return roomType;

    // Handle compound words (e.g., "Living Room" -> "Living Rooms")
    if (roomType.includes(' ')) {
      const words = roomType.split(' ');
      const lastWord = words[words.length - 1];
      words[words.length - 1] = pluralizeWord(lastWord);
      return words.join(' ');
    }

    return pluralizeWord(roomType);
  };

  const pluralizeWord = (word: string): string => {
    // Special cases
    if (word.toLowerCase().endsWith('y')) {
      return word.slice(0, -1) + 'ies';
    }
    if (word.toLowerCase().endsWith('ch') || word.toLowerCase().endsWith('sh') ||
        word.toLowerCase().endsWith('s') || word.toLowerCase().endsWith('x') ||
        word.toLowerCase().endsWith('z')) {
      return word + 'es';
    }
    return word + 's';
  };

  useEffect(() => {
    if (houseId) {
      loadHouseData();
    } else {
      initialHouse.current = { country: 'United States' };
      initialPropertyDetails.current = { sewage_type: 'municipal' };
    }
  }, [houseId]);

  useEffect(() => {
    const hasChanges = checkForUnsavedChanges();
    onHasUnsavedChanges?.(hasChanges);
  }, [house, propertyDetails]);

  const checkForUnsavedChanges = (): boolean => {
    return JSON.stringify(house) !== JSON.stringify(initialHouse.current) ||
           JSON.stringify(propertyDetails) !== JSON.stringify(initialPropertyDetails.current);
  };

  const loadHouseData = async () => {
    if (!houseId) return;

    try {
      const [houseRes, roomsRes, propertyRes] = await Promise.all([
        supabase.from('houses').select('*').eq('id', houseId).is('deleted_at', null).maybeSingle(),
        supabase.from('rooms').select('*').eq('house_id', houseId).is('deleted_at', null),
        supabase.from('property_details').select('*').eq('house_id', houseId).is('deleted_at', null).maybeSingle(),
      ]);

      if (houseRes.data) {
        setHouse(houseRes.data);
        initialHouse.current = { ...houseRes.data };
      }
      if (roomsRes.data) setRooms(roomsRes.data);
      if (propertyRes.data) {
        setPropertyDetails(propertyRes.data);
        initialPropertyDetails.current = { ...propertyRes.data };
      }
    } catch (error) {
      console.error('Error loading house data:', error);
    }
  };

  const saveHouse = async () => {
    setLoading(true);
    setSaveMessage(null);
    try {
      let currentHouseId = houseId;

      if (houseId) {
        const { error } = await supabase
          .from('houses')
          .update(house)
          .eq('id', houseId);

        if (error) throw error;
        initialHouse.current = { ...house };
      } else {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Not authenticated');

        const { data, error } = await supabase
          .from('houses')
          .insert({ ...house, user_id: userData.user.id })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          initialHouse.current = { ...data };
          currentHouseId = data.id;
          onHouseCreated(data.id);
        }
      }

      if (currentHouseId && (propertyDetails.acreage || propertyDetails.sewage_type || propertyDetails.lot_description)) {
        const { data: savedPropertyDetails, error } = await supabase
          .from('property_details')
          .upsert({ ...propertyDetails, house_id: currentHouseId }, { onConflict: 'house_id' })
          .select()
          .single();

        if (error) throw error;
        if (savedPropertyDetails) {
          setPropertyDetails(savedPropertyDetails);
          initialPropertyDetails.current = { ...savedPropertyDetails };
        }
      }

      onHasUnsavedChanges?.(false);
      setSaveMessage({ type: 'success', text: 'Changes saved' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving house:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save changes. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const savePropertyDetails = async () => {
    if (!houseId) return;

    setPropertyDetailsLoading(true);
    setPropertyDetailsSaveMessage(null);
    try {
      const { data: savedPropertyDetails, error } = await supabase
        .from('property_details')
        .upsert({ ...propertyDetails, house_id: houseId }, { onConflict: 'house_id' })
        .select()
        .single();

      if (error) throw error;
      if (savedPropertyDetails) {
        setPropertyDetails(savedPropertyDetails);
        initialPropertyDetails.current = { ...savedPropertyDetails };
      }

      setPropertyDetailsSaveMessage({ type: 'success', text: 'Changes saved' });
      setTimeout(() => setPropertyDetailsSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving property details:', error);
      setPropertyDetailsSaveMessage({ type: 'error', text: 'Failed to save property details. Please try again.' });
    } finally {
      setPropertyDetailsLoading(false);
    }
  };

  const addRoom = async () => {
    if (!houseId || !newRoom.room_type) return;

    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert({ ...newRoom, house_id: houseId })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setRooms([...rooms, data]);
        setNewRoom({ room_type: '', room_type_other: '', count: 1, notes: '', basement_details: null, garage_details: null });
      }
    } catch (error) {
      console.error('Error adding room:', error);
    }
  };

  const handleDeleteRoomClick = (room: Room) => {
    if (shouldShowDeleteConfirmation()) {
      const roomName = room.room_type === 'Other' && room.room_type_other
        ? room.room_type_other
        : room.room_type;
      setDeleteConfirmation({ isOpen: true, roomId: room.id, roomName });
    } else {
      deleteRoom(room.id);
    }
  };

  const deleteRoom = async (roomId: string) => {
    try {
      const { error } = await supabase.rpc('permanent_delete_room', { room_id: roomId });

      if (error) throw error;
      setRooms(rooms.filter(r => r.id !== roomId));
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const startEditRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setEditedRoom({ ...room });
  };

  const cancelEditRoom = () => {
    setEditingRoomId(null);
    setEditedRoom({});
  };

  const saveEditedRoom = async () => {
    if (!editingRoomId || !editedRoom.room_type) return;

    try {
      const { error } = await supabase
        .from('rooms')
        .update({
          room_type: editedRoom.room_type,
          count: editedRoom.count,
          notes: editedRoom.notes,
          basement_details: editedRoom.basement_details,
        })
        .eq('id', editingRoomId);

      if (error) throw error;

      setRooms(rooms.map(r => r.id === editingRoomId ? { ...r, ...editedRoom } as Room : r));
      setEditingRoomId(null);
      setEditedRoom({});
    } catch (error) {
      console.error('Error updating room:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">House Details</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Basic Information</h2>

        <div className="mb-6 pb-6 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Street Address</label>
              <input
                type="text"
                value={house.address_line1 || ''}
                onChange={(e) => setHouse({ ...house, address_line1: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
              <input
                type="text"
                value={house.city || ''}
                onChange={(e) => setHouse({ ...house, city: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Springfield"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
              <select
                value={house.state_province || ''}
                onChange={(e) => setHouse({ ...house, state_province: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select state...</option>
                <option value="AL">Alabama</option>
                <option value="AK">Alaska</option>
                <option value="AZ">Arizona</option>
                <option value="AR">Arkansas</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="DE">Delaware</option>
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="HI">Hawaii</option>
                <option value="ID">Idaho</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="IA">Iowa</option>
                <option value="KS">Kansas</option>
                <option value="KY">Kentucky</option>
                <option value="LA">Louisiana</option>
                <option value="ME">Maine</option>
                <option value="MD">Maryland</option>
                <option value="MA">Massachusetts</option>
                <option value="MI">Michigan</option>
                <option value="MN">Minnesota</option>
                <option value="MS">Mississippi</option>
                <option value="MO">Missouri</option>
                <option value="MT">Montana</option>
                <option value="NE">Nebraska</option>
                <option value="NV">Nevada</option>
                <option value="NH">New Hampshire</option>
                <option value="NJ">New Jersey</option>
                <option value="NM">New Mexico</option>
                <option value="NY">New York</option>
                <option value="NC">North Carolina</option>
                <option value="ND">North Dakota</option>
                <option value="OH">Ohio</option>
                <option value="OK">Oklahoma</option>
                <option value="OR">Oregon</option>
                <option value="PA">Pennsylvania</option>
                <option value="RI">Rhode Island</option>
                <option value="SC">South Carolina</option>
                <option value="SD">South Dakota</option>
                <option value="TN">Tennessee</option>
                <option value="TX">Texas</option>
                <option value="UT">Utah</option>
                <option value="VT">Vermont</option>
                <option value="VA">Virginia</option>
                <option value="WA">Washington</option>
                <option value="WV">West Virginia</option>
                <option value="WI">Wisconsin</option>
                <option value="WY">Wyoming</option>
                <option value="DC">District of Columbia</option>
                <option value="AS">American Samoa</option>
                <option value="GU">Guam</option>
                <option value="MP">Northern Mariana Islands</option>
                <option value="PR">Puerto Rico</option>
                <option value="VI">U.S. Virgin Islands</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">ZIP Code</label>
              <input
                type="text"
                value={house.postal_code || ''}
                onChange={(e) => setHouse({ ...house, postal_code: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="12345"
                maxLength={10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
              <select
                value={house.country || 'United States'}
                onChange={(e) => setHouse({ ...house, country: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="Mexico">Mexico</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Other">Other</option>
              </select>
              {house.country === 'Other' && (
                <input
                  type="text"
                  value={house.country_other || ''}
                  onChange={(e) => setHouse({ ...house, country_other: e.target.value })}
                  placeholder="Please specify..."
                  className="mt-2 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Property Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Year Built</label>
              <input
                type="number"
                value={house.year_built ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseInt(e.target.value);
                  setHouse({ ...house, year_built: isNaN(value as number) ? null : value });
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="2020"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Year Bought</label>
              <input
                type="number"
                value={house.year_bought ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseInt(e.target.value);
                  setHouse({ ...house, year_bought: isNaN(value as number) ? null : value });
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="2021"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Square Footage</label>
              <input
                type="number"
                value={house.square_footage ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseInt(e.target.value);
                  setHouse({ ...house, square_footage: isNaN(value as number) ? null : value });
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="2500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Realtor Name</label>
              <input
                type="text"
                value={house.realtor_name || ''}
                onChange={(e) => setHouse({ ...house, realtor_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Price Paid</label>
              <input
                type="number"
                value={house.price_paid ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseFloat(e.target.value);
                  setHouse({ ...house, price_paid: isNaN(value as number) ? null : value });
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="350000"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Year Sold (optional)</label>
              <input
                type="number"
                value={house.year_sold ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseInt(e.target.value);
                  setHouse({ ...house, year_sold: isNaN(value as number) ? null : value });
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="2030"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Price Sold (optional)</label>
              <input
                type="number"
                value={house.price_sold ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseFloat(e.target.value);
                  setHouse({ ...house, price_sold: isNaN(value as number) ? null : value });
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="450000"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 mt-6">
          {saveMessage && (
            <span className={`text-sm font-medium ${saveMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
              {saveMessage.text}
            </span>
          )}
          <button
            onClick={saveHouse}
            disabled={loading}
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save House Details'}</span>
          </button>
        </div>
      </div>

      {houseId && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Property Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Acreage</label>
                <input
                  type="number"
                  step="0.01"
                  value={propertyDetails.acreage ?? ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : parseFloat(e.target.value);
                    setPropertyDetails({ ...propertyDetails, acreage: isNaN(value as number) ? null : value });
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="0.25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sewage Type</label>
                <select
                  value={propertyDetails.sewage_type || 'municipal'}
                  onChange={(e) => setPropertyDetails({ ...propertyDetails, sewage_type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="municipal">Municipal</option>
                  <option value="septic">Septic</option>
                  <option value="gray_water">Gray Water</option>
                  <option value="Other">Other</option>
                </select>
                {propertyDetails.sewage_type === 'Other' && (
                  <input
                    type="text"
                    value={propertyDetails.sewage_type_other || ''}
                    onChange={(e) => setPropertyDetails({ ...propertyDetails, sewage_type_other: e.target.value })}
                    placeholder="Please specify..."
                    className="mt-2 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {propertyDetails.story === '2' || propertyDetails.story === 'Other' ? 'Stories' : 'Story'}
                </label>
                <select
                  value={propertyDetails.story || ''}
                  onChange={(e) => setPropertyDetails({ ...propertyDetails, story: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="Other">Other</option>
                </select>
                {propertyDetails.story === 'Other' && (
                  <input
                    type="text"
                    value={propertyDetails.story_other || ''}
                    onChange={(e) => setPropertyDetails({ ...propertyDetails, story_other: e.target.value })}
                    placeholder="Please specify..."
                    className="mt-2 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Build Style</label>
                <select
                  value={propertyDetails.build_style || ''}
                  onChange={(e) => setPropertyDetails({ ...propertyDetails, build_style: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="Colonial">Colonial</option>
                  <option value="Contemporary">Contemporary</option>
                  <option value="Craftsman">Craftsman</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="Modern">Modern</option>
                  <option value="Ranch">Ranch</option>
                  <option value="Traditional">Traditional</option>
                  <option value="Tudor">Tudor</option>
                  <option value="Victorian">Victorian</option>
                  <option value="Other">Other</option>
                </select>
                {propertyDetails.build_style === 'Other' && (
                  <input
                    type="text"
                    value={propertyDetails.build_style_other || ''}
                    onChange={(e) => setPropertyDetails({ ...propertyDetails, build_style_other: e.target.value })}
                    placeholder="Please specify..."
                    className="mt-2 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Exterior Finish</label>
                <select
                  value={propertyDetails.color_type || ''}
                  onChange={(e) => setPropertyDetails({ ...propertyDetails, color_type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="Siding">Siding</option>
                  <option value="Paint">Paint</option>
                  <option value="Brick">Brick</option>
                  <option value="Shingle">Shingle</option>
                  <option value="Other">Other</option>
                </select>
                {propertyDetails.color_type === 'Other' && (
                  <input
                    type="text"
                    value={propertyDetails.color_type_other || ''}
                    onChange={(e) => setPropertyDetails({ ...propertyDetails, color_type_other: e.target.value })}
                    placeholder="Please specify..."
                    className="mt-2 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">House Color</label>
                <input
                  type="color"
                  value={propertyDetails.house_color || '#ffffff'}
                  onChange={(e) => setPropertyDetails({ ...propertyDetails, house_color: e.target.value })}
                  className="w-full h-12 px-2 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Lot Description</label>
                <textarea
                  value={propertyDetails.lot_description || ''}
                  onChange={(e) => setPropertyDetails({ ...propertyDetails, lot_description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your property..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              {propertyDetailsSaveMessage && (
                <span className={`text-sm font-medium ${propertyDetailsSaveMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {propertyDetailsSaveMessage.text}
                </span>
              )}
              <button
                onClick={savePropertyDetails}
                disabled={propertyDetailsLoading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {propertyDetailsLoading ? 'Saving...' : 'Save Property Details'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Rooms</h2>

            <div className="space-y-3 mb-4">
              {rooms.map((room) => (
                <div key={room.id} className="p-3 bg-slate-50 rounded-lg">
                  {editingRoomId === room.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Room Type</label>
                          <select
                            value={editedRoom.room_type || ''}
                            onChange={(e) => setEditedRoom({ ...editedRoom, room_type: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          >
                            <option value="">Select room type...</option>
                            <option value="Bedroom">Bedroom</option>
                            <option value="Bathroom">Bathroom</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Living Room">Living Room</option>
                            <option value="Dining Room">Dining Room</option>
                            <option value="Family Room">Family Room</option>
                            <option value="Office">Office</option>
                            <option value="Den">Den</option>
                            <option value="Laundry Room">Laundry Room</option>
                            <option value="Garage">Garage</option>
                            <option value="Basement">Basement</option>
                            <option value="Attic">Attic</option>
                            <option value="Sunroom">Sunroom</option>
                            <option value="Bonus Room">Bonus Room</option>
                            <option value="Mudroom">Mudroom</option>
                            <option value="Walk-in Closet">Walk-in Closet</option>
                            <option value="Pantry">Pantry</option>
                            <option value="Utility Room">Utility Room</option>
                            <option value="Other">Other</option>
                          </select>
                          {editedRoom.room_type === 'Other' && (
                            <input
                              type="text"
                              value={editedRoom.room_type_other || ''}
                              onChange={(e) => setEditedRoom({ ...editedRoom, room_type_other: e.target.value })}
                              placeholder="Please specify..."
                              className="mt-2 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Count</label>
                          <input
                            type="number"
                            value={editedRoom.count || 1}
                            onChange={(e) => {
                              const value = editedRoom.room_type === 'Bathroom'
                                ? parseFloat(e.target.value) || 1
                                : parseInt(e.target.value) || 1;
                              setEditedRoom({ ...editedRoom, count: value });
                            }}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            min={editedRoom.room_type === 'Bathroom' ? '0.5' : '1'}
                            step={editedRoom.room_type === 'Bathroom' ? '0.5' : '1'}
                          />
                        </div>
                        {editedRoom.room_type === 'Basement' && (
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-700 mb-2">Basement Type</label>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editedRoom.basement_details?.unfinished || false}
                                  onChange={(e) => setEditedRoom({
                                    ...editedRoom,
                                    basement_details: {
                                      ...editedRoom.basement_details,
                                      unfinished: e.target.checked
                                    }
                                  })}
                                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                />
                                <span className="text-sm text-slate-700">Unfinished</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editedRoom.basement_details?.partially_finished || false}
                                  onChange={(e) => setEditedRoom({
                                    ...editedRoom,
                                    basement_details: {
                                      ...editedRoom.basement_details,
                                      partially_finished: e.target.checked
                                    }
                                  })}
                                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                />
                                <span className="text-sm text-slate-700">Partially Finished</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editedRoom.basement_details?.finished || false}
                                  onChange={(e) => setEditedRoom({
                                    ...editedRoom,
                                    basement_details: {
                                      ...editedRoom.basement_details,
                                      finished: e.target.checked
                                    }
                                  })}
                                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                />
                                <span className="text-sm text-slate-700">Finished</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editedRoom.basement_details?.crawl_space || false}
                                  onChange={(e) => setEditedRoom({
                                    ...editedRoom,
                                    basement_details: {
                                      ...editedRoom.basement_details,
                                      crawl_space: e.target.checked
                                    }
                                  })}
                                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                />
                                <span className="text-sm text-slate-700">Crawl Space</span>
                              </label>
                            </div>
                          </div>
                        )}
                        {editedRoom.room_type === 'Garage' && (
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-700 mb-2">Garage Capacity</label>
                            <div className="grid grid-cols-3 gap-2">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editedRoom.garage_details?.one_car || false}
                                  onChange={(e) => setEditedRoom({
                                    ...editedRoom,
                                    garage_details: {
                                      ...editedRoom.garage_details,
                                      one_car: e.target.checked
                                    }
                                  })}
                                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                />
                                <span className="text-sm text-slate-700">1 Car</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editedRoom.garage_details?.two_car || false}
                                  onChange={(e) => setEditedRoom({
                                    ...editedRoom,
                                    garage_details: {
                                      ...editedRoom.garage_details,
                                      two_car: e.target.checked
                                    }
                                  })}
                                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                />
                                <span className="text-sm text-slate-700">2 Cars</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editedRoom.garage_details?.other || false}
                                  onChange={(e) => setEditedRoom({
                                    ...editedRoom,
                                    garage_details: {
                                      ...editedRoom.garage_details,
                                      other: e.target.checked
                                    }
                                  })}
                                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                />
                                <span className="text-sm text-slate-700">Other</span>
                              </label>
                            </div>
                          </div>
                        )}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                          <input
                            type="text"
                            value={editedRoom.notes || ''}
                            onChange={(e) => setEditedRoom({ ...editedRoom, notes: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="Optional notes..."
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={cancelEditRoom}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                        <button
                          onClick={saveEditedRoom}
                          disabled={!editedRoom.room_type}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-medium text-slate-800">{pluralizeRoomType(room.room_type, room.count)}</span>
                          <span className="text-slate-600 ml-2">({room.count})</span>
                        </div>
                        {room.basement_details && room.room_type === 'Basement' && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {room.basement_details.unfinished && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                                Unfinished
                              </span>
                            )}
                            {room.basement_details.partially_finished && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                                Partially Finished
                              </span>
                            )}
                            {room.basement_details.finished && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">
                                Finished
                              </span>
                            )}
                            {room.basement_details.crawl_space && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700">
                                Crawl Space
                              </span>
                            )}
                          </div>
                        )}
                        {room.garage_details && room.room_type === 'Garage' && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {room.garage_details.one_car && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                                1 Car
                              </span>
                            )}
                            {room.garage_details.two_car && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">
                                2 Cars
                              </span>
                            )}
                            {room.garage_details.other && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700">
                                Other
                              </span>
                            )}
                          </div>
                        )}
                        {room.notes && <p className="text-sm text-slate-500 mt-1">{room.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => startEditRoom(room)}
                          className="text-slate-600 hover:text-emerald-600 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoomClick(room)}
                          className="text-slate-600 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <select
                    value={newRoom.room_type}
                    onChange={(e) => setNewRoom({ ...newRoom, room_type: e.target.value, basement_details: null, garage_details: null })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select room type...</option>
                    <option value="Bedroom">Bedroom</option>
                    <option value="Bathroom">Bathroom</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Living Room">Living Room</option>
                    <option value="Dining Room">Dining Room</option>
                    <option value="Family Room">Family Room</option>
                    <option value="Office">Office</option>
                    <option value="Den">Den</option>
                    <option value="Laundry Room">Laundry Room</option>
                    <option value="Garage">Garage</option>
                    <option value="Basement">Basement</option>
                    <option value="Attic">Attic</option>
                    <option value="Sunroom">Sunroom</option>
                    <option value="Bonus Room">Bonus Room</option>
                    <option value="Mudroom">Mudroom</option>
                    <option value="Walk-in Closet">Walk-in Closet</option>
                    <option value="Pantry">Pantry</option>
                    <option value="Utility Room">Utility Room</option>
                    <option value="Other">Other</option>
                  </select>
                  {newRoom.room_type === 'Other' && (
                    <input
                      type="text"
                      value={newRoom.room_type_other || ''}
                      onChange={(e) => setNewRoom({ ...newRoom, room_type_other: e.target.value })}
                      placeholder="Please specify..."
                      className="mt-2 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  )}
                </div>
                <input
                  type="number"
                  value={newRoom.count}
                  onChange={(e) => {
                    const value = newRoom.room_type === 'Bathroom'
                      ? parseFloat(e.target.value) || 1
                      : parseInt(e.target.value) || 1;
                    setNewRoom({ ...newRoom, count: value });
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Count"
                  min={newRoom.room_type === 'Bathroom' ? '0.5' : '1'}
                  step={newRoom.room_type === 'Bathroom' ? '0.5' : '1'}
                />
                <div className="flex justify-end">
                  <button
                    onClick={addRoom}
                    disabled={!newRoom.room_type}
                    className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{newRoom.count > 1 ? 'Add Rooms' : 'Add Room'}</span>
                  </button>
                </div>
              </div>

              {newRoom.room_type === 'Basement' && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-3">Basement Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRoom.basement_details?.unfinished || false}
                        onChange={(e) => setNewRoom({
                          ...newRoom,
                          basement_details: {
                            ...newRoom.basement_details,
                            unfinished: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700">Unfinished</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRoom.basement_details?.partially_finished || false}
                        onChange={(e) => setNewRoom({
                          ...newRoom,
                          basement_details: {
                            ...newRoom.basement_details,
                            partially_finished: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700">Partially Finished</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRoom.basement_details?.finished || false}
                        onChange={(e) => setNewRoom({
                          ...newRoom,
                          basement_details: {
                            ...newRoom.basement_details,
                            finished: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700">Finished</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRoom.basement_details?.crawl_space || false}
                        onChange={(e) => setNewRoom({
                          ...newRoom,
                          basement_details: {
                            ...newRoom.basement_details,
                            crawl_space: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700">Crawl Space</span>
                    </label>
                  </div>
                </div>
              )}

              {newRoom.room_type === 'Garage' && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-3">Garage Capacity</label>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRoom.garage_details?.one_car || false}
                        onChange={(e) => setNewRoom({
                          ...newRoom,
                          garage_details: {
                            ...newRoom.garage_details,
                            one_car: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700">1 Car</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRoom.garage_details?.two_car || false}
                        onChange={(e) => setNewRoom({
                          ...newRoom,
                          garage_details: {
                            ...newRoom.garage_details,
                            two_car: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700">2 Cars</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRoom.garage_details?.other || false}
                        onChange={(e) => setNewRoom({
                          ...newRoom,
                          garage_details: {
                            ...newRoom.garage_details,
                            other: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700">Other</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, roomId: null, roomName: '' })}
        onConfirm={() => {
          if (deleteConfirmation.roomId) {
            deleteRoom(deleteConfirmation.roomId);
          }
        }}
        itemName={deleteConfirmation.roomName}
        itemType="room"
      />
    </div>
  );
}
