'use client';

import React from 'react';
import { Wallet, LogOut, RefreshCw, Layers } from 'lucide-react';

interface AccountConnectorProps {
  address: string;
  balance: number;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onRefreshBalance: () => void;
  onAddTokenToWallet: () => void;
  onMintTokens: () => void;
}

export const AccountConnector: React.FC<AccountConnectorProps> = ({
  address,
  balance,
  connecting,
  onConnect,
  onDisconnect,
  onRefreshBalance,
  onAddTokenToWallet,
  onMintTokens,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-zinc-200 bg-white p-5 md:px-8 gap-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-zinc-900 text-white rounded-lg">
          <Layers size={20} className="stroke-[2]" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            FlowVault
          </h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
            Stellar Soroban Linear Vesting
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {address ? (
          <>
            <div className="flex items-center gap-2 px-3.5 py-1.5 border border-zinc-200 bg-zinc-50 rounded-md font-mono text-xs text-zinc-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                {address.slice(0, 6)}...{address.slice(-6)}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 border border-zinc-200 bg-zinc-50 rounded-md font-mono text-xs text-zinc-700">
              <span className="text-zinc-400 text-[10px] uppercase font-semibold">Balance:</span>
              <span className="text-zinc-900 font-bold text-sm">{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
              <span className="text-indigo-600 font-bold text-[10px]">FVT</span>
              <button 
                onClick={onRefreshBalance} 
                className="ml-1 p-0.5 hover:bg-zinc-200 rounded transition-colors text-zinc-500"
                title="Refresh balance"
              >
                <RefreshCw size={12} className="stroke-[2]" />
              </button>
            </div>

            <button
              onClick={onAddTokenToWallet}
              className="px-3.5 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold rounded-md text-xs transition-colors shadow-sm"
            >
              Add FVT to Wallet
            </button>

            <button
              onClick={onMintTokens}
              className="px-3.5 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold rounded-md text-xs transition-colors shadow-sm"
            >
              Mint 1000 FVT (Faucet)
            </button>

            <button
              onClick={onDisconnect}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-md text-xs transition-colors shadow-sm"
            >
              <LogOut size={12} className="stroke-[2]" />
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={onConnect}
            disabled={connecting}
            className="flex items-center justify-center gap-2 w-full md:w-auto px-5 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold rounded-md text-sm transition-colors shadow-sm"
          >
            {connecting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Connecting Wallet...
              </>
            ) : (
              <>
                <Wallet size={14} className="stroke-[2]" />
                Connect Wallet
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
