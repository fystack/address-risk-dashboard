import React, { useState } from "react";
import { Search, AlertTriangle, Activity, ArrowRight, ExternalLink, Copy, TrendingUp } from "lucide-react";
import mockData from "./mockData";
import bs58 from 'bs58';
import FystackLogo from './fystack-logo.svg';

const apiKey = import.meta.env.VITE_WEBACY_API_KEY;

function RiskScore({ score }: { score: number }) {
  const displayScore = Number(score.toFixed(1));
  
  const getScoreColor = (score: number) => {
    if (score <= 23) return "text-emerald-500";
    if (score <= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreBackground = (score: number) => {
    if (score <= 23) return "from-emerald-500/20 to-emerald-500/5";
    if (score <= 50) return "from-amber-500/20 to-amber-500/5";
    return "from-red-500/20 to-red-500/5";
  };

  return (
    <div className="relative group">
      <div className={`bg-gradient-to-br ${getScoreBackground(score)} border border-gray-800 rounded-2xl p-8 text-center transition-all duration-300 group-hover:border-gray-700`}>
        <div className="relative">
          <div className={`text-5xl font-bold ${getScoreColor(score)} mb-2`}>
            {displayScore}
          </div>
          <div className="text-sm text-gray-500 uppercase tracking-wider font-medium">
            Risk Score
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ score }: { score: number }) {
  let status = "High Risk";
  let colorClasses = "bg-red-500/10 text-red-400 border-red-500/20";

  if (score <= 23) {
    status = "Low Risk";
    colorClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  } else if (score <= 50) {
    status = "Medium Risk";
    colorClasses = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }

  return (
    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${colorClasses}`}>
      <div className="w-2 h-2 rounded-full bg-current mr-2" />
      {status}
    </div>
  );
}

/**
 * Returns true if `address` is a valid Solana address (i.e. Base58-decodes
 * to exactly 32 bytes), false otherwise.
 */
function isValidSolanaAddress(address: string): boolean {
  try {
    const decoded = bs58.decode(address);
    return decoded.length === 32;
  } catch (err) {
    return false;
  }
}

/**
 * Returns true if `address` is a valid EVM address (starts with 0x and is 42 chars),
 * false otherwise.
 */
function isValidEVMAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function fetchAddressData(address: string) {
  if (!apiKey) {
    console.error(
      "API key not found. Please set VITE_WEBACY_API_KEY in your environment variables."
    );
    throw new Error("API key not configured");
  }

  const isSolanaAddress = isValidSolanaAddress(address);
  const isEVMAddress = isValidEVMAddress(address);

  if (!isSolanaAddress && !isEVMAddress) {
    throw new Error("Invalid address format. Please provide a valid Solana or EVM address.");
  }

  let url = `https://api.webacy.com/addresses/${address}`;
  if (isSolanaAddress) {
    url += `?chain=sol`;
  }

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-api-key": apiKey,
    },
  };

  try {
    console.log(`Fetching from: ${url}`);
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status}`, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching address data:", error);
    throw error;
  }
}

function DataCard({ title, children, icon: Icon, className = "" }: { 
  title: string; 
  children: React.ReactNode; 
  icon?: any; 
  className?: string;
}) {
  return (
    <div className={`bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        {Icon && <Icon className="text-gray-400" size={20} />}
        <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function MetricCard({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) {
  return (
    <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-4">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-100">{value}</div>
      {subtext && <div className="text-xs text-gray-600 mt-1">{subtext}</div>}
    </div>
  );
}

function RiskFactors({ data, riskTags }) {
  const riskFlags = data?.details?.fund_flows?.risk || {};
  const activeFlags = Object.entries(riskFlags)
    .filter(([_, value]) => value === true)
    .map(([key, _]) => key);

  const riskFlagDescriptions = {
    ofac: "OFAC Sanctions List",
    hacker: "Known Hacker Activity", 
    mixers: "Crypto Mixing Services",
    drainer: "Wallet Drainer Attacks",
    fbi_ic3: "FBI IC3 Reports",
    tornado: "Tornado Cash Usage",
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return "bg-red-500/10 border-red-500/20";
    if (severity >= 4) return "bg-amber-500/10 border-amber-500/20";
    return "bg-yellow-500/10 border-yellow-500/20";
  };

  const getSeverityDot = (severity: number) => {
    if (severity >= 8) return "bg-red-500";
    if (severity >= 4) return "bg-amber-500";
    return "bg-yellow-500";
  };

  const getSeverityText = (severity: number) => {
    if (severity >= 8) return "text-red-400";
    if (severity >= 4) return "text-amber-400";
    return "text-yellow-400";
  };

  const hasRiskFactors = activeFlags.length > 0 || riskTags.length > 0;

  return (
    <DataCard title="Risk Factors" icon={AlertTriangle}>
      {hasRiskFactors ? (
        <div className="space-y-3">
          {/* Fund Flow Risk Flags */}
          {activeFlags.map((flag) => (
            <div key={flag} className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm text-gray-300">{riskFlagDescriptions[flag] || flag}</span>
            </div>
          ))}
          
          {/* Risk Tags - Show ALL tags with descriptions and severity */}
          {riskTags.map((tag, index) => (
            <div key={index} className={`flex flex-col gap-2 p-3 rounded-lg border ${getSeverityColor(tag.severity)}`}>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${getSeverityDot(tag.severity)}`} />
                <span className={`text-sm font-medium ${getSeverityText(tag.severity)}`}>{tag.name}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                  Severity: {tag.severity}
                </span>
              </div>
              <p className="text-xs text-gray-400 ml-5 leading-relaxed">{tag.description}</p>
              <div className="text-xs text-gray-500 ml-5">
                Type: {tag.type} • Key: {tag.key}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-500 text-sm">✓</span>
          </div>
          <span className="text-emerald-400 font-medium">No risk factors detected</span>
        </div>
      )}
    </DataCard>
  );
}

function AddressOverview({ address, data }) {
  const [copied, setCopied] = useState(false);
  
  const copyAddress = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSolanaAddress = isValidSolanaAddress(address);
  const addressType = isSolanaAddress ? 'Solana' : 'Ethereum';
  const addressLabel = data?.details?.fund_flows?.label || "Unknown";
  
  // Chain logo URLs from Trust Wallet
  const chainLogo = isSolanaAddress 
    ? 'https://assets.trustwalletapp.com/blockchains/solana/info/logo.png'
    : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIa3GDAlj9jCzDOu-MBV7_NRhZ4VlzN-i8pg&s';
  
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl font-bold text-gray-100">
            {address.slice(0, 8)}...{address.slice(-6)}
          </div>
          <button 
            onClick={copyAddress}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Copy address"
          >
            <Copy size={16} className="text-gray-400" />
          </button>
          {copied && <span className="text-sm text-emerald-400">Copied!</span>}
        </div>
        
        <div className="flex items-center gap-3 mb-6">
          <StatusBadge score={data?.overallRisk || 0} />
          <div className="flex items-center gap-2 text-sm text-gray-500 px-3 py-1 bg-gray-800/50 rounded-full">
            <img 
              src={chainLogo} 
              alt={addressType} 
              className="w-4 h-4 rounded-full"
            />
            {addressType}
          </div>
          {addressLabel !== "Unknown" && (
            <div className="text-sm text-gray-400">{addressLabel}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard 
          label="Transactions" 
          value={data?.details?.address_info?.transaction_count || 0}
        />
        <MetricCard 
          label="Last Activity" 
          value="Recent"
          subtext="Within 24h"
        />
      </div>
    </div>
  );
}

function App() {
  const [address, setAddress] = useState("");
  const [data, setData] = useState(mockData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const riskTags = data?.issues?.[0]?.tags || [];
  const overallRisk = data?.overallRisk || 0;
  const primaryAddress = address || "0x8576aCC5C05D6Ce88f4e49bf65BdF0C62F91353C";

  const fundFlows = data?.details?.fund_flows;
  const addressInfo = data?.details?.address_info;
  const categories = data?.issues?.[0]?.categories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!isValidSolanaAddress(address) && !isValidEVMAddress(address)) {
        throw new Error("Invalid address format. Please provide a valid Solana or EVM address.");
      }
      
      const apiData = await fetchAddressData(address);
      setData(apiData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch address data. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-900 bg-gray-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <a 
                href="https://fystack.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="relative flex items-center hover:opacity-80 transition-opacity"
              >
                <img 
                  src={FystackLogo} 
                  alt="Fystack" 
                  className="h-8 w-auto"
                />
                <div className="absolute -bottom-2 -right-2 text-xs text-gray-400 font-medium mt-1">
                  Risk Intelligence
                </div>
              </a>
              <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400 ml-8">
                <span className="text-gray-100">Dashboard</span>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://developers.webacy.co/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-100 transition-colors">
                <span>API by</span>
                <img 
                  src="https://cdn.prod.website-files.com/62ab904eb25ad28e366d83a1/62aba9dc79b3d5153b73284c_Logo.svg" 
                  alt="Webacy" 
                  className="h-5 w-auto"
                />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Search */}
        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-gray-500" size={20} />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter wallet address (e.g., 0x742d35Cc5556C7079)"
                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-12 py-3 pr-4 md:pr-32 text-lg focus:outline-none focus:border-gray-600 transition-colors placeholder:text-gray-600"
              />
              <button
                type="submit"
                disabled={isLoading || !address}
                className="hidden md:block absolute right-2 top-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading || !address}
              className="block md:hidden w-full bg-white text-black px-4 py-3 rounded-xl text-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? "Analyzing..." : "Analyze"}
            </button>
          </form>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
            <span>Supporting</span>
            <div className="flex items-center gap-1">
              <img 
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIa3GDAlj9jCzDOu-MBV7_NRhZ4VlzN-i8pg&s" 
                alt="Ethereum" 
                className="w-4 h-4 rounded-full"
              />
              <span>Ethereum</span>
            </div>
            <span>and</span>
            <div className="flex items-center gap-1">
              <img 
                src="https://assets.trustwalletapp.com/blockchains/solana/info/logo.png" 
                alt="Solana" 
                className="w-4 h-4 rounded-full"
              />
              <span>Solana</span>
            </div>
            <span>addresses</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-8">
          {/* Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <AddressOverview address={primaryAddress} data={data} />
            </div>
            <div>
              <RiskScore score={overallRisk} />
            </div>
          </div>

          {/* Analysis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RiskFactors data={data} riskTags={riskTags} />
            
            <DataCard title="Recommendations" icon={ArrowRight}>
              {overallRisk > 23 ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-300">
                      <div className="font-medium mb-1">High Risk Detected</div>
                      <div className="text-gray-400">Avoid sending assets to this address</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                    <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-300">
                      <div className="font-medium mb-1">Use Caution</div>
                      <div className="text-gray-400">Consider wallet isolation if interaction occurred</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-emerald-500 text-sm">✓</span>
                    </div>
                    <div className="font-medium text-emerald-400">Low Risk Address</div>
                  </div>
                  <p className="text-sm text-gray-400">
                    This address appears safe for normal transactions. Continue monitoring for changes.
                  </p>
                </div>
              )}
            </DataCard>
          </div>

          {/* Fund Flow Analysis Section */}
          {fundFlows && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Fund Flow Analysis
              </h2>
              
              {/* Risk Indicators Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <div className={`p-4 rounded-lg border ${
                  fundFlows.risk.ofac 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                    : 'bg-green-500/10 border-green-500/30 text-green-400'
                }`}>
                  <div className="text-xs font-medium mb-1">OFAC Sanctioned</div>
                  <div className="text-lg font-bold">{fundFlows.risk.ofac ? 'Yes' : 'No'}</div>
                </div>
                <div className={`p-4 rounded-lg border ${
                  fundFlows.risk.hacker 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                    : 'bg-green-500/10 border-green-500/30 text-green-400'
                }`}>
                  <div className="text-xs font-medium mb-1">Hacker</div>
                  <div className="text-lg font-bold">{fundFlows.risk.hacker ? 'Yes' : 'No'}</div>
                </div>
                <div className={`p-4 rounded-lg border ${
                  fundFlows.risk.mixers 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                    : 'bg-green-500/10 border-green-500/30 text-green-400'
                }`}>
                  <div className="text-xs font-medium mb-1">Mixers</div>
                  <div className="text-lg font-bold">{fundFlows.risk.mixers ? 'Yes' : 'No'}</div>
                </div>
                <div className={`p-4 rounded-lg border ${
                  fundFlows.risk.drainer 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                    : 'bg-green-500/10 border-green-500/30 text-green-400'
                }`}>
                  <div className="text-xs font-medium mb-1">Drainer</div>
                  <div className="text-lg font-bold">{fundFlows.risk.drainer ? 'Yes' : 'No'}</div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-200">Recent Transactions</h3>
                <div className="space-y-3">
                  {fundFlows.flows.map((flow, index) => (
                    <div key={index} className="bg-gray-900/30 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-gray-400 text-sm font-mono">
                              {flow.from.slice(0, 6)}...{flow.from.slice(-4)}
                            </span>
                            <span className="text-gray-500">→</span>
                            <span className="text-gray-400 text-sm font-mono">
                              {flow.to.slice(0, 6)}...{flow.to.slice(-4)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-white font-medium">
                              {flow.amount} {flow.token === '@native' ? 'ETH' : flow.token}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                              {flow.txhash.slice(0, 10)}...
                            </span>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          flow.risk_score > 15 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : flow.risk_score > 5 
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          Risk: {flow.risk_score}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fund Flow Label */}
              {fundFlows.label && (
                <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <div className="text-sm text-orange-400 font-medium">
                    Associated Entity: {fundFlows.label}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Address Information Section */}
          {addressInfo && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6">Address Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-6 bg-gray-900/30 border border-gray-800 rounded-xl">
                  <div className="text-3xl font-bold text-white mb-1">{addressInfo.balance}</div>
                  <div className="text-sm text-gray-400 font-medium">
                    Balance ({isValidSolanaAddress(primaryAddress) ? 'SOL' : 'ETH'})
                  </div>
                </div>
                <div className="text-center p-6 bg-gray-900/30 border border-gray-800 rounded-xl">
                  <div className="text-3xl font-bold text-white mb-1">{addressInfo.transaction_count}</div>
                  <div className="text-sm text-gray-400 font-medium">Total Transactions</div>
                </div>
                <div className="text-center p-6 bg-gray-900/30 border border-gray-800 rounded-xl">
                  <div className="text-3xl font-bold text-white mb-1">
                    {addressInfo.has_no_transactions ? 'No' : 'Yes'}
                  </div>
                  <div className="text-sm text-gray-400 font-medium">Has Transactions</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="relative overflow-hidden bg-gray-950 border border-white/20 rounded-xl p-6 mb-8">
          {/* Green blur gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(34,197,94,0.15),transparent_70%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(34,197,94,0.1),transparent_50%)]"></div>
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-xl font-bold text-white mb-2">
                Protect Your Assets with Hack-Resistant Infrastructure
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                Discover Fystack's cutting-edge wallet security solutions designed to prevent hacks and protect your digital assets.
              </p>
            </div>
            <div className="flex-shrink-0">
              <a
                href="https://fystack.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <span>Explore Fystack</span>
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      </main>
       {/* Fystack Promotion Banner */}
     
      {/* Footer */}
      <footer className="border-t border-gray-900 bg-gray-950/50 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-sm text-gray-400">
                Built with Webacy API
              </div>
              <a 
                href="https://github.com/fystack/address-risk-dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-gray-100 flex items-center gap-2"
              >
                <ExternalLink size={14} />
                View Source
              </a>
            </div>
            <a 
              href="https://t.me/+IsRhPyWuOFxmNmM9" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Join Community
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
