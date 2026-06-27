'use client';

import React, { useState } from 'react';
import { VestingFlowInfo } from '../../core/stellar';
import { VestingCard } from './VestingCard';
import { Columns, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface FlowConsoleProps {
  flows: VestingFlowInfo[];
  currentUserAddress: string;
  onClaim: (flowId: number) => Promise<void>;
  onRevoke: (flowId: number) => Promise<void>;
  loadingClaimId: number | null;
  loadingRevokeId: number | null;
  refreshing: boolean;
}

export const FlowConsole: React.FC<FlowConsoleProps> = ({
  flows,
  currentUserAddress,
  onClaim,
  onRevoke,
  loadingClaimId,
  loadingRevokeId,
  refreshing,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'received'>('all');

  const sentFlows = flows.filter(f => f.depositor.toLowerCase() === currentUserAddress.toLowerCase());
  const receivedFlows = flows.filter(f => f.beneficiary.toLowerCase() === currentUserAddress.toLowerCase());

  const filteredFlows = 
    activeTab === 'sent' 
      ? sentFlows 
      : activeTab === 'received' 
        ? receivedFlows 
        : flows;

  return (
    <div className="space-y-6">
      {/* Tabs / Filtering */}
      <div className="flex border border-zinc-200 bg-white p-1 rounded-lg max-w-sm shadow-sm">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-grow flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md font-mono text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'all' ? 'bg-zinc-900 text-white shadow-sm' : 'hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Columns size={12} />
          All ({flows.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-grow flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md font-mono text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'sent' ? 'bg-zinc-900 text-white shadow-sm' : 'hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <ArrowUpRight size={12} />
          Sent ({sentFlows.length})
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-grow flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md font-mono text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'received' ? 'bg-zinc-900 text-white shadow-sm' : 'hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <ArrowDownLeft size={12} />
          Recv ({receivedFlows.length})
        </button>
      </div>

      {/* Grid of Flows */}
      {refreshing && flows.length === 0 ? (
        <div className="flex items-center justify-center py-12 border border-dashed border-zinc-200 bg-white rounded-lg">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400 animate-pulse">
            Syncing ledger state...
          </p>
        </div>
      ) : filteredFlows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-zinc-200 bg-white rounded-lg shadow-sm">
          <p className="font-mono text-sm uppercase tracking-wider text-zinc-900 font-bold mb-2">
            No flows found
          </p>
          <p className="font-mono text-xs text-zinc-400 max-w-xs text-center">
            {activeTab === 'all' 
              ? "You don't have any active vesting flows. Create one to begin vesting tokens."
              : activeTab === 'sent'
                ? "You haven't initiated any vesting flows yet."
                : "You aren't the beneficiary of any vesting flows yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFlows.map((flow) => (
            <VestingCard
              key={flow.id}
              flow={flow}
              currentUserAddress={currentUserAddress}
              onClaim={onClaim}
              onRevoke={onRevoke}
              loadingClaim={loadingClaimId === flow.id}
              loadingRevoke={loadingRevokeId === flow.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
