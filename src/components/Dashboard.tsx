import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, Home, LayoutDashboard, Wrench, Building2, User } from 'lucide-react';
import { HouseDetails } from './HouseDetails';
import { InteriorAppliances } from './InteriorAppliances';
import { ExteriorManagement } from './ExteriorManagement';
import { CostDashboard } from './CostDashboard';
import { AccountManagement } from './AccountManagement';

type View = 'dashboard' | 'house' | 'interior' | 'exterior' | 'account';

export function Dashboard() {
  const { signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [houseId, setHouseId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [hasUnsavedHouse, setHasUnsavedHouse] = useState(false);
  const [hasUnsavedInterior, setHasUnsavedInterior] = useState(false);
  const [hasUnsavedExterior, setHasUnsavedExterior] = useState(false);
  const [hasUnsavedAccount, setHasUnsavedAccount] = useState(false);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }

      const { data, error } = await supabase
        .from('houses')
        .select('id')
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw error;
      setHouseId(data?.id || null);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHouseCreated = (id: string) => {
    setHouseId(id);
  };

  const handleNavigate = (view: View) => {
    let hasUnsaved = false;
    let pageName = '';

    if (currentView === 'house' && hasUnsavedHouse) {
      hasUnsaved = true;
      pageName = 'House Details';
    } else if (currentView === 'interior' && hasUnsavedInterior) {
      hasUnsaved = true;
      pageName = 'Interior & Appliances';
    } else if (currentView === 'exterior' && hasUnsavedExterior) {
      hasUnsaved = true;
      pageName = 'Exterior & Property';
    } else if (currentView === 'account' && hasUnsavedAccount) {
      hasUnsaved = true;
      pageName = 'Account Settings';
    }

    if (hasUnsaved) {
      const confirmLeave = window.confirm(
        `You have unsaved changes in ${pageName}. Please save your changes before navigating away.\n\nDo you want to leave without saving?`
      );
      if (!confirmLeave) {
        return;
      }
    }

    setCurrentView(view);
    if (view !== currentView) {
      setHasUnsavedHouse(false);
      setHasUnsavedInterior(false);
      setHasUnsavedExterior(false);
      setHasUnsavedAccount(false);

      // Refresh dashboard when navigating to it
      if (view === 'dashboard') {
        setDashboardRefreshKey(prev => prev + 1);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">Home Life Notes</span>
            </div>

            <button
              onClick={() => signOut()}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-4rem)]">
        <aside className="w-64 bg-white border-r border-slate-200 overflow-y-auto">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => handleNavigate('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                currentView === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => handleNavigate('house')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                currentView === 'house'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">House Details</span>
            </button>

            <button
              onClick={() => handleNavigate('interior')}
              disabled={!houseId}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                currentView === 'interior'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-50'
              } ${!houseId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Wrench className="w-5 h-5" />
              <span className="font-medium">Interior & Appliances</span>
            </button>

            <button
              onClick={() => handleNavigate('exterior')}
              disabled={!houseId}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                currentView === 'exterior'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-50'
              } ${!houseId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Building2 className="w-5 h-5" />
              <span className="font-medium">Exterior & Property</span>
            </button>

            <div className="pt-4 mt-4 border-t border-slate-200">
              <button
                onClick={() => handleNavigate('account')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  currentView === 'account'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Account Settings</span>
              </button>
            </div>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto">
          {currentView === 'dashboard' && <CostDashboard key={dashboardRefreshKey} houseId={houseId} />}
          {currentView === 'house' && (
            <HouseDetails
              houseId={houseId}
              onHouseCreated={handleHouseCreated}
              onHasUnsavedChanges={setHasUnsavedHouse}
            />
          )}
          {currentView === 'interior' && houseId && (
            <InteriorAppliances
              houseId={houseId}
              onHasUnsavedChanges={setHasUnsavedInterior}
            />
          )}
          {currentView === 'exterior' && houseId && (
            <ExteriorManagement
              houseId={houseId}
              onHasUnsavedChanges={setHasUnsavedExterior}
            />
          )}
          {currentView === 'account' && (
            <AccountManagement
              userEmail={userEmail}
              onAccountDeleted={signOut}
              onHasUnsavedChanges={setHasUnsavedAccount}
            />
          )}
        </main>
      </div>
    </div>
  );
}
