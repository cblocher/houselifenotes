import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency, type Country } from '../lib/currency';
import { DollarSign, Home, Wrench, Building2, TrendingUp, Calendar } from 'lucide-react';

interface CostDashboardProps {
  houseId: string | null;
}

interface CostBreakdown {
  housePurchase: number;
  appliances: number;
  applianceInstallation: number;
  applianceRepairs: number;
  exteriorFeatures: number;
  exteriorMaintenance: number;
  totalCost: number;
}

interface HouseInfo {
  year_bought: number | null;
  year_sold: number | null;
  price_paid: number;
  price_sold: number | null;
  square_footage: number | null;
  country: Country | null;
}

export function CostDashboard({ houseId }: CostDashboardProps) {
  const [costs, setCosts] = useState<CostBreakdown>({
    housePurchase: 0,
    appliances: 0,
    applianceInstallation: 0,
    applianceRepairs: 0,
    exteriorFeatures: 0,
    exteriorMaintenance: 0,
    totalCost: 0,
  });
  const [houseInfo, setHouseInfo] = useState<HouseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (houseId) {
      loadCosts();
    } else {
      setLoading(false);
    }
  }, [houseId]);

  const loadCosts = async () => {
    if (!houseId) return;

    try {
      const [houseRes, appliancesRes, featuresRes, maintenanceRes] = await Promise.all([
        supabase.from('houses').select('year_bought, year_sold, price_paid, price_sold, square_footage, country').eq('id', houseId).is('deleted_at', null).maybeSingle(),
        supabase.from('interior_appliances').select('purchase_cost, installation_cost, id').eq('house_id', houseId).is('deleted_at', null),
        supabase.from('exterior_features').select('build_cost').eq('house_id', houseId).is('deleted_at', null),
        supabase.from('exterior_maintenance').select('cost').eq('house_id', houseId).is('deleted_at', null),
      ]);

      const housePurchase = houseRes.data?.price_paid || 0;

      const appliances = appliancesRes.data?.reduce((sum, a) => sum + (Number(a.purchase_cost) || 0), 0) || 0;
      const applianceInstallation = appliancesRes.data?.reduce((sum, a) => sum + (Number(a.installation_cost) || 0), 0) || 0;

      let applianceRepairs = 0;
      if (appliancesRes.data && appliancesRes.data.length > 0) {
        const applianceIds = appliancesRes.data.map(a => a.id);
        const repairsRes = await supabase
          .from('appliance_repairs')
          .select('repair_cost')
          .in('appliance_id', applianceIds)
          .is('deleted_at', null);

        applianceRepairs = repairsRes.data?.reduce((sum, r) => sum + (Number(r.repair_cost) || 0), 0) || 0;
      }

      const exteriorFeatures = featuresRes.data?.reduce((sum, f) => sum + (Number(f.build_cost) || 0), 0) || 0;
      const exteriorMaintenance = maintenanceRes.data?.reduce((sum, m) => sum + (Number(m.cost) || 0), 0) || 0;

      const totalCost = housePurchase + appliances + applianceInstallation + applianceRepairs + exteriorFeatures + exteriorMaintenance;

      setCosts({
        housePurchase,
        appliances,
        applianceInstallation,
        applianceRepairs,
        exteriorFeatures,
        exteriorMaintenance,
        totalCost,
      });

      if (houseRes.data) {
        setHouseInfo(houseRes.data);
      }
    } catch (error) {
      console.error('Error loading costs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  if (!houseId) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Home className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to House Life Notes</h2>
          <p className="text-slate-600 mb-6">
            Start by adding your house details to begin tracking your home maintenance and costs.
          </p>
          <p className="text-sm text-slate-500">
            Click "House Details" in the sidebar to get started.
          </p>
        </div>
      </div>
    );
  }

  const profit = houseInfo?.price_sold ? houseInfo.price_sold - costs.totalCost : null;
  const yearsOwned = houseInfo?.year_bought && houseInfo?.year_sold
    ? houseInfo.year_sold - houseInfo.year_bought
    : houseInfo?.year_bought
    ? new Date().getFullYear() - houseInfo.year_bought
    : null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Investment</h3>
            <DollarSign className="w-5 h-5 opacity-90" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(costs.totalCost, houseInfo?.country)}</p>
        </div>

        {houseInfo?.price_sold && profit !== null && (
          <div className={`rounded-xl shadow-lg p-6 text-white ${profit >= 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">{profit >= 0 ? 'Profit' : 'Loss'}</h3>
              <TrendingUp className="w-5 h-5 opacity-90" />
            </div>
            <p className="text-3xl font-bold">{formatCurrency(Math.abs(profit), houseInfo?.country)}</p>
          </div>
        )}

        {yearsOwned && (
          <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Years Owned</h3>
              <Calendar className="w-5 h-5 opacity-90" />
            </div>
            <p className="text-3xl font-bold">{yearsOwned}</p>
            {yearsOwned > 0 && (
              <p className="text-sm opacity-75 mt-1">
                {formatCurrency(costs.totalCost / yearsOwned, houseInfo?.country, { maximumFractionDigits: 0 })}/year
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Cost Breakdown</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Home className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="font-medium text-slate-700">Price Paid</span>
            </div>
            <span className="text-lg font-semibold text-slate-800">
              {formatCurrency(costs.housePurchase, houseInfo?.country)}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-700">Interior Appliances</p>
                <p className="text-xs text-slate-500">Purchase costs</p>
              </div>
            </div>
            <span className="text-lg font-semibold text-slate-800">
              {formatCurrency(costs.appliances, houseInfo?.country)}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-700">Appliance Installation</p>
                <p className="text-xs text-slate-500">Installation costs</p>
              </div>
            </div>
            <span className="text-lg font-semibold text-slate-800">
              {formatCurrency(costs.applianceInstallation, houseInfo?.country)}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="bg-amber-100 p-2 rounded-lg">
                <Wrench className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-slate-700">Appliance Repairs</p>
                <p className="text-xs text-slate-500">All repair costs</p>
              </div>
            </div>
            <span className="text-lg font-semibold text-slate-800">
              {formatCurrency(costs.applianceRepairs, houseInfo?.country)}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-700">Exterior Features</p>
                <p className="text-xs text-slate-500">Sheds, decks, etc.</p>
              </div>
            </div>
            <span className="text-lg font-semibold text-slate-800">
              {formatCurrency(costs.exteriorFeatures, houseInfo?.country)}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-slate-100 p-2 rounded-lg">
                <Building2 className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-700">Exterior Maintenance</p>
                <p className="text-xs text-slate-500">Roofing, painting, etc.</p>
              </div>
            </div>
            <span className="text-lg font-semibold text-slate-800">
              {formatCurrency(costs.exteriorMaintenance, houseInfo?.country)}
            </span>
          </div>
        </div>
      </div>

      {houseInfo && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">House Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {houseInfo.year_bought && (
              <div>
                <p className="text-sm text-slate-500">Year Purchased</p>
                <p className="text-lg font-semibold text-slate-800">{houseInfo.year_bought}</p>
              </div>
            )}

            {houseInfo.square_footage && (
              <div>
                <p className="text-sm text-slate-500">Square Footage</p>
                <p className="text-lg font-semibold text-slate-800">{houseInfo.square_footage.toLocaleString()} sq ft</p>
              </div>
            )}

            {houseInfo.price_sold && (
              <div>
                <p className="text-sm text-slate-500">Sale Price</p>
                <p className="text-lg font-semibold text-slate-800">
                  {formatCurrency(houseInfo.price_sold, houseInfo.country)}
                </p>
              </div>
            )}

            {houseInfo.year_sold && (
              <div>
                <p className="text-sm text-slate-500">Year Sold</p>
                <p className="text-lg font-semibold text-slate-800">{houseInfo.year_sold}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
