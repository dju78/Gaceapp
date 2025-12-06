import React, { useState, useEffect } from "react";
import { Search, Filter, Globe, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { assetAPI, type Asset as APIAsset } from "../utils/api/client";

interface Asset {
  id: string;
  name: string;
  type: string;
  jurisdiction: string;
  value: number;
  currency: string;
  acquisitionDate: string;
  currentGain: number;
  status: "verified" | "pending" | "flagged";
  taxRate: number;
}

// Transform API asset to display format
function transformAsset(apiAsset: APIAsset): Asset {
  return {
    id: apiAsset.id,
    name: apiAsset.description,
    type: apiAsset.asset_type,
    jurisdiction: apiAsset.country,
    value: apiAsset.value_gbp,
    currency: "GBP",
    acquisitionDate: apiAsset.acquisition_date || new Date().toISOString().split('T')[0],
    currentGain: 0, // TODO: Calculate from historical data
    status: "verified",
    taxRate: apiAsset.tax_paid_locally,
  };
}

export const GlobalAssetScanner: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>("all");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch assets from API
  useEffect(() => {
    async function fetchAssets() {
      setLoading(true);
      setError(null);
      
      const { data, error: apiError } = await assetAPI.getAll();
      
      if (apiError) {
        console.error("Error fetching assets:", apiError);
        setError("Failed to load assets. Please try again.");
        setAssets([]);
      } else if (data?.assets) {
        const transformedAssets = data.assets.map(transformAsset);
        setAssets(transformedAssets);
      } else {
        setAssets([]);
      }
      
      setLoading(false);
    }

    fetchAssets();
  }, []);

  const jurisdictions = [
    "all",
    ...Array.from(new Set(assets.map((a) => a.jurisdiction))),
  ];

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesJurisdiction =
      selectedJurisdiction === "all" ||
      asset.jurisdiction === selectedJurisdiction;
    return matchesSearch && matchesJurisdiction;
  });

  const totalValue = filteredAssets.reduce((sum, a) => sum + a.value, 0);
  const totalGains = filteredAssets.reduce((sum, a) => sum + a.currentGain, 0);
  const flaggedCount = filteredAssets.filter((a) => a.status === "flagged").length;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Total Assets Tracked
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-50">
            {filteredAssets.length}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Across {jurisdictions.length - 1} jurisdictions
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Combined Value
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-50">
            £{totalValue.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-400">Current market value</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Total Unrealised Gains
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="text-2xl font-semibold text-emerald-400">
              £{totalGains.toLocaleString()}
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="mt-1 text-xs text-slate-400">Subject to CGT on disposal</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Assets Requiring Action
          </div>
          <div className="mt-2 text-2xl font-semibold text-amber-400">
            {flaggedCount}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Flagged for verification
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search assets by name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedJurisdiction}
            onChange={(e) => setSelectedJurisdiction(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
          >
            {jurisdictions.map((jurisdiction) => (
              <option key={jurisdiction} value={jurisdiction}>
                {jurisdiction === "all"
                  ? "All Jurisdictions"
                  : jurisdiction}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Asset List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Asset Portfolio</h2>
            <p className="text-xs text-slate-400">
              Showing {filteredAssets.length} asset
              {filteredAssets.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-indigo-500 hover:bg-slate-800">
            Export CSV
          </button>
        </div>

        <div className="space-y-2">
          {filteredAssets.map((asset) => (
            <button
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className="group w-full rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-left transition-all hover:border-indigo-500/50 hover:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-100">
                      {asset.name}
                    </h3>
                    {asset.status === "verified" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    )}
                    {asset.status === "flagged" && (
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                    )}
                    {asset.status === "pending" && (
                      <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {asset.jurisdiction}
                    </div>
                    <div>Type: {asset.type}</div>
                    <div>Acquired: {asset.acquisitionDate}</div>
                    <div>CGT Rate: {asset.taxRate}%</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold text-slate-100">
                    £{asset.value.toLocaleString()}
                  </div>
                  <div
                    className={`mt-1 text-xs font-medium ${
                      asset.currentGain >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {asset.currentGain >= 0 ? "+" : ""}
                    £{asset.currentGain.toLocaleString()} gain
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    Est. CGT: £
                    {Math.round(
                      Math.max(0, asset.currentGain) * (asset.taxRate / 100)
                    ).toLocaleString()}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  {selectedAsset.name}
                </h3>
                <p className="text-sm text-slate-400">
                  {selectedAsset.type} · {selectedAsset.jurisdiction}
                </p>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="rounded-lg p-2 hover:bg-slate-800"
              >
                <span className="text-slate-400">✕</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Value Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-slate-400">Current Value</div>
                    <div className="mt-1 text-lg font-semibold text-slate-100">
                      £{selectedAsset.value.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Unrealised Gain</div>
                    <div
                      className={`mt-1 text-lg font-semibold ${
                        selectedAsset.currentGain >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {selectedAsset.currentGain >= 0 ? "+" : ""}£
                      {selectedAsset.currentGain.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax Information */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-100">
                  Tax Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Acquisition Date</span>
                    <span className="text-slate-100">
                      {selectedAsset.acquisitionDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CGT Rate ({selectedAsset.jurisdiction})</span>
                    <span className="text-slate-100">{selectedAsset.taxRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated CGT on Disposal</span>
                    <span className="font-semibold text-indigo-400">
                      £
                      {Math.round(
                        Math.max(0, selectedAsset.currentGain) *
                          (selectedAsset.taxRate / 100)
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status</span>
                    <span
                      className={`font-medium ${
                        selectedAsset.status === "verified"
                          ? "text-emerald-400"
                          : selectedAsset.status === "flagged"
                          ? "text-amber-400"
                          : "text-sky-400"
                      }`}
                    >
                      {selectedAsset.status.charAt(0).toUpperCase() +
                        selectedAsset.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:border-indigo-500 hover:bg-slate-700">
                  Edit Details
                </button>
                <button className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                  Record Disposal
                </button>
              </div>

              {selectedAsset.status === "flagged" && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-100">
                  <div className="font-semibold">⚠ Action Required</div>
                  <div className="mt-1 text-amber-100/80">
                    This asset has been flagged for verification. Please upload
                    supporting documentation or confirm the transaction details.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};