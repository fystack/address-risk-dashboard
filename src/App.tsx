import React, { useState } from "react";
import { Search, AlertTriangle, Activity, ArrowRight } from "lucide-react";
import mockData from "./mockData";
import bs58 from 'bs58';

const apiKey = import.meta.env.VITE_WEBACY_API_KEY;

function RiskScore({ score }: { score: number }) {
  // Format the score to have at most 2 decimal places for display
  const displayScore = Number(score.toFixed(2));

  // Determine color based on risk score
  const colorClass =
    score <= 23
      ? "text-green-500"
      : score <= 50
      ? "text-yellow-500"
      : "text-red-600";
  const bgColorClass =
    score <= 23
      ? "text-green-500/20"
      : score <= 50
      ? "text-yellow-500/20"
      : "text-red-600/20";

  return (
    <div className="relative">
      <div className="bg-gray-800/50 rounded-lg p-4 text-center">
        <div className="relative w-32 h-32 mx-auto">
          {/* SVG Circle */}
          <svg className="transform -rotate-90 w-full h-full absolute top-0 left-0">
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="8"
              className={bgColorClass}
            />
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${(score / 100) * 377} 377`}
              className={colorClass}
            />
          </svg>

          {/* Text content using flexbox */}
          <div className="w-full h-full absolute top-0 left-0 flex flex-col items-center justify-center">
            <div id="risk-score" className="text-4xl font-bold">
              {displayScore}
            </div>
            <div className="text-sm text-gray-400">Overall</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskTag({
  text,
  type = "default",
}: {
  text: string;
  type?: "high" | "low" | "default";
}) {
  const baseClasses = "px-3 py-1 rounded-full text-sm font-medium";

  let colorClasses = "bg-gray-800/50 text-gray-300 border border-gray-700";
  if (type === "high") {
    colorClasses = "bg-red-900/30 text-red-400 border border-red-700/50";
  } else if (type === "low") {
    colorClasses = "bg-green-900/30 text-green-400 border border-green-700/50";
  }

  return <span className={`${baseClasses} ${colorClasses}`}>{text}</span>;
}

function RiskBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const width = (value / max) * 100;

  // Determine color based on risk value relative to max
  const ratio = value / max;
  const barColorClass =
    ratio <= 0.23
      ? "bg-green-500"
      : ratio <= 0.5
      ? "bg-yellow-500"
      : "bg-red-600";

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 bg-gray-800/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColorClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function RiskBadge({ score }: { score: number }) {
  let badgeText = "High Risk";
  let colorClasses = "bg-red-600/20 text-red-500 border-red-700/50";

  if (score <= 23) {
    badgeText = "Low Risk";
    colorClasses = "bg-green-600/20 text-green-500 border-green-700/50";
  } else if (score <= 50) {
    badgeText = "Medium Risk";
    colorClasses = "bg-yellow-600/20 text-yellow-500 border-yellow-700/50";
  }

  return (
    <div
      className={`px-3 py-1.5 rounded-md border ${colorClasses} font-medium text-center`}
    >
      {badgeText}
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

  // Validate the address format
  const isSolanaAddress = isValidSolanaAddress(address);
  const isEVMAddress = isValidEVMAddress(address);

  if (!isSolanaAddress && !isEVMAddress) {
    throw new Error("Invalid address format. Please provide a valid Solana or EVM address.");
  }

  // Build the correct URL with proper query parameter formatting
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
    console.log(`Fetching from: ${url}`); // Add logging to debug
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

function FundFlowGraph({ data }) {
  const accounts = data?.details?.fund_flows?.accounts || {};
  const flows = data?.details?.fund_flows?.flows || [];

  // Track all unique addresses and build connection graph
  const uniqueAddresses = new Set<string>();

  flows.forEach((flow) => {
    uniqueAddresses.add(flow.from);
    uniqueAddresses.add(flow.to);
  });

  // Convert to array for easier manipulation
  const addressArray = Array.from(uniqueAddresses);

  // Get node information for each address
  const nodes = addressArray.map((address) => {
    // Look for account directly using address as key first
    const account = accounts[address];

    // If not found directly, try finding by comparing addresses
    // This is a fallback for backward compatibility
    const accountByLookup = !account
      ? Object.values(accounts).find((acc) => acc.address === address)
      : null;

    return {
      address,
      label:
        account?.label ||
        accountByLookup?.label ||
        `Unknown (${address.slice(0, 6)}...)`,
      type: account?.type || accountByLookup?.type || "unknown",
    };
  });

  // Don't render if we don't have any nodes
  if (nodes.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No fund flow data available
      </div>
    );
  }

  return (
    <div className="relative h-64 mt-4 overflow-x-auto">
      <div className="absolute inset-0 min-w-full">
        <svg
          className="w-full h-full"
          viewBox="0 0 800 200"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background flow lines */}
          {nodes.length > 1 &&
            [...Array(nodes.length - 1)].map((_, index) => (
              <line
                key={`line-${index}`}
                x1={100 + (600 / (nodes.length - 1)) * index}
                y1={100}
                x2={100 + (600 / (nodes.length - 1)) * (index + 1)}
                y2={100}
                stroke="currentColor"
                strokeWidth="4"
                className="text-gray-800/30"
              />
            ))}

          {/* Red highlight lines */}
          {nodes.length > 1 &&
            [...Array(nodes.length - 1)].map((_, index) => (
              <line
                key={`highlight-${index}`}
                x1={100 + (600 / (nodes.length - 1)) * index}
                y1={100}
                x2={100 + (600 / (nodes.length - 1)) * (index + 1)}
                y2={100}
                stroke="currentColor"
                strokeWidth="2"
                className="text-red-600"
              />
            ))}
        </svg>
      </div>

      {/* Node boxes */}
      <div className="absolute inset-0 flex items-center px-8 min-w-full">
        <div className="w-full flex justify-between items-center">
          {nodes.map((node, index) => (
            <div
              key={node.address}
              className="bg-gray-800/80 rounded p-3 backdrop-blur-sm max-w-[120px] mx-1 shrink-0"
            >
              <div className="text-xs font-medium truncate">{node.label}</div>
              <div className="text-xs text-gray-400 font-mono truncate">
                {node.address.slice(0, 6)}...
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TransactionTable({ data }) {
  // Format a simple date - in a real app you might use a proper date formatting library
  const formatDate = () => "2025-02-21"; // Placeholder for now since data might not have dates

  const flows = data?.details?.fund_flows?.flows || [];

  return (
    <div className="mt-4 space-y-2">
      <div className="grid grid-cols-4 text-sm text-gray-400 p-2">
        <div>Date</div>
        <div>From</div>
        <div>To</div>
        <div>Risk</div>
      </div>
      {flows.slice(0, 3).map((flow, index) => (
        <div
          key={index}
          className="grid grid-cols-4 text-sm bg-gray-800/30 rounded p-2"
        >
          <div>{formatDate()}</div>
          <div className="font-mono">{flow.from?.slice(0, 8)}...</div>
          <div className="font-mono">{flow.to?.slice(0, 8)}...</div>
          <div>{flow.risk_score}</div>
        </div>
      ))}
    </div>
  );
}

function RiskFlagCard({ data, riskTags }) {
  const riskFlags = data?.details?.fund_flows?.risk || {};

  // Check if all risk flags are false
  const hasNoRiskFlags = Object.values(riskFlags).every(
    (flag) => flag === false
  );

  // Define risk flag descriptions
  const riskFlagDescriptions = {
    ofac: "Listed in OFAC-sanctions list",
    hacker: "Connected to known hacker activities",
    mixers: "Used crypto mixing services",
    drainer: "Associated with wallet drainer attacks",
    fbi_ic3: "Reported in FBI's Internet Crime Complaint Center",
    tornado: "Used Tornado Cash mixer",
  };

  // Get active risk flags
  const activeFlags = Object.entries(riskFlags)
    .filter(([_, value]) => value === true)
    .map(([key, _]) => key);

  return (
    <div className="bg-gray-800/50 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <AlertTriangle className="text-red-500" size={20} />
        Why is this address flagged?
      </h2>

      {hasNoRiskFlags ? (
        <div className="text-green-400 flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span>No risk flags detected for this address</span>
        </div>
      ) : (
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          {activeFlags.map((flag) => (
            <li key={flag}>{riskFlagDescriptions[flag] || flag}</li>
          ))}
          {riskTags &&
            riskTags.some((tag) => tag.key === "stealing_attack") && (
              <li>Connected to reported theft</li>
            )}
          {riskTags &&
            riskTags.some((tag) => tag.key === "is_closed_source") && (
              <li>Hosting an unverified smart contract</li>
            )}
        </ul>
      )}
    </div>
  );
}

function App() {
  const [address, setAddress] = useState("");
  const [data, setData] = useState(mockData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update the address type detection to use the validation functions
  const isSolanaAddress = address ? isValidSolanaAddress(address) : false;
  const isEVMAddress = address ? isValidEVMAddress(address) : false;
  const addressType = isSolanaAddress ? 'Solana' : isEVMAddress ? 'EVM' : '';

  // Extract risk tags from data with optional chaining
  const riskTags = data?.issues?.[0]?.tags || [];
  const overallRisk = data?.overallRisk || 0;
  const riskFlags = data?.details?.fund_flows?.risk || {};

  // Check if there are any active risk flags
  const hasActiveRiskFlags = Object.values(riskFlags).some(
    (flag) => flag === true
  );

  // Primary address from the data with a fallback
  const primaryAddress =
    address || "0x8576aCC5C05D6Ce88f4e49bf65BdF0C62F91353C";
  const addressLabel = data?.details?.fund_flows?.label || "Unknown";

  const transactionCount = data?.details?.address_info?.transaction_count || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      // Validate address before API call
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
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 relative pb-20">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Attribution header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 text-sm text-gray-400 gap-4">
          <div className="flex items-center gap-2">
            <span>API powered by</span>
            <a
              href="https://developers.webacy.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <img
                src="https://developers.webacy.co/webacyLogo.svg"
                alt="Webacy"
                className="h-6"
              />
            </a>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a
              href="https://github.com/fystack/address-risk-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-gray-800 hover:bg-gray-700 transition-colors px-3 py-1 rounded-md"
            >
              <img 
                src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" 
                alt="GitHub logo"
                className="h-5 w-5" 
              />
              <span>View on GitHub</span>
            </a>
            <div className="flex items-center gap-2">
              <span>Developed by</span>
              <a
                href="https://fystack.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 99 24"
                  aria-hidden="true"
                  className="h-10"
                >
                  <path
                    fill="#3b82f6"
                    d="M16 8a5 5 0 0 0-5-5H5a5 5 0 0 0-5 5v13.927a1 1 0 0 0 1.623.782l3.684-2.93a4 4 0 0 1 2.49-.87H11a5 5 0 0 0 5-5V8Z"
                  />
                  <text
                    x="26"
                    y="16"
                    fill="#ffffff"
                    style={{
                      fontFamily: "Arial, sans-serif",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    Fystack
                  </text>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center sm:text-left">
              Risk Intelligence Dashboard
            </h1>
            <div className="text-base sm:text-lg text-gray-400 mb-4 text-center sm:text-left">
              <span className="font-mono">
                {primaryAddress.slice(0, 10)}...
              </span>
              <span className="ml-2">{addressLabel}</span>
              {address && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-900/50 text-blue-400 border border-blue-700/30">
                  {addressType}
                </span>
              )}
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              {riskTags.map((tag, index) => (
                <RiskTag
                  key={index}
                  text={tag.name}
                  type={
                    tag.severity >= 7
                      ? "high"
                      : tag.severity <= 3
                      ? "low"
                      : "default"
                  }
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center sm:items-end">
            <div className="flex flex-col items-center">
              <RiskScore score={overallRisk} />
              <div className="mt-2">
                <RiskBadge score={overallRisk} />
              </div>
            </div>
            <div className="mt-4 bg-gray-800/50 rounded p-4">
              <div className="text-sm text-gray-400">Transactions</div>
              <div className="text-2xl font-bold">{transactionCount}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter wallet address"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:border-red-500"
                id="address-input"
              />
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={20}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !address}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              id="analyze-button"
            >
              {isLoading ? "Loading..." : "Analyze"}
            </button>
          </div>
          <div className="text-gray-400 text-xs mt-2">
            Supporting both EVM and Solana addresses.
          </div>
          {isLoading && (
            <div id="loading-indicator" className="text-gray-400 text-sm mt-2">
              Fetching risk data...
            </div>
          )}
        </form>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6">
            <h2 className="text-xl font-semibold mb-6">Risk Breakdown</h2>
            {riskTags.length > 0 ? (
              <div className="space-y-4">
                {riskTags.map((tag, index) => (
                  <RiskBar
                    key={index}
                    label={tag.name}
                    value={tag.severity}
                    max={10}
                  />
                ))}
                <div className="mt-6 space-y-2 text-sm text-gray-400">
                  {riskTags
                    .filter((tag) => tag.severity > 2)
                    .map((tag, index) => (
                      <p key={index}>• {tag.description}</p>
                    ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-green-400">
                <div className="w-16 h-16 rounded-full bg-green-900/30 flex items-center justify-center mb-4">
                  <span className="text-3xl">✓</span>
                </div>
                <p>No risk issues detected</p>
              </div>
            )}
          </div>

          <div className="space-y-6 md:space-y-8">
            <RiskFlagCard data={data} riskTags={riskTags} />

            <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6">
              <h2 className="text-xl font-semibold mb-4">
                Risk Recommendations
              </h2>
              {hasActiveRiskFlags || overallRisk > 23 ? (
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <ArrowRight size={16} className="text-red-500" />
                    Avoid sending assets
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight size={16} className="text-red-500" />
                    Use protocol risk scoring before transacting
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight size={16} className="text-red-500" />
                    Consider wallet isolation/quarantine if interaction occurred
                  </li>
                </ul>
              ) : (
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <ArrowRight size={16} className="text-green-500" />
                    Low risk address - safe for normal transactions
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight size={16} className="text-green-500" />
                    Continue to monitor for changes in risk profile
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 overflow-hidden">
            <h2 className="text-xl font-semibold mb-4">Fund Flow</h2>
            <div className="text-sm text-gray-400">
              Show money flows between addresses
            </div>
            <FundFlowGraph data={data} />
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="text-blue-500" size={20} />
              Transactions
            </h2>
            <TransactionTable data={data} />
          </div>
        </div>
      </div>
      
      {/* Feedback Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800/80 backdrop-blur-sm py-3 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <div className="text-sm text-gray-400 text-center sm:text-left">
            Have feedback? We'd love to hear from you!
          </div>
          <a 
            href="https://t.me/+IsRhPyWuOFxmNmM9" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-2 rounded-md text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.349 18.769c-.162.013-.313.02-.465.02-1.706 0-3.204-.827-4.142-2.103l-.013-.016c-.316-.433-.571-.91-.752-1.418C6.685 14.46 6.5 13.553 6.5 12c0-3.038 2.463-5.5 5.5-5.5 3.038 0 5.5 2.462 5.5 5.5 0 1.558-.648 2.964-1.688 3.968l.001.002-3.464 2.799zm3.728-10.208l-5.03 4.714-2.382-2.382c-.165-.165-.433-.165-.598 0s-.165.433 0 .598l2.715 2.715c.084.084.194.126.294.126.119 0 .231-.049.316-.137l5.236-4.908c.167-.157.175-.419.018-.587-.156-.167-.419-.175-.586-.018l.017-.121z" />
            </svg>
            Join our Telegram Community
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
