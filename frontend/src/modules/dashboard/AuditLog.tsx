'use client';

import React from 'react';
import { ListTodo, CheckCircle, Flame, Gift } from 'lucide-react';

export interface AuditEvent {
  id: string;
  type: 'initiated' | 'claimed' | 'revoked';
  flowId: number;
  amount: number;
  timestamp: number;
  txHash: string;
}

interface AuditLogProps {
  events: AuditEvent[];
}

export const AuditLog: React.FC<AuditLogProps> = ({ events }) => {
  return (
    <div className="border border-zinc-200 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-zinc-100">
        <ListTodo size={18} className="text-zinc-700" />
        <h2 className="text-md font-bold text-zinc-950 uppercase tracking-tight">
          Audit Log
        </h2>
      </div>

      {events.length === 0 ? (
        <div className="py-8 text-center text-zinc-400 font-mono text-xs uppercase tracking-wider">
          No recent events logged
        </div>
      ) : (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
          {events.map((event) => {
            const dateStr = new Date(event.timestamp * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div 
                key={event.id} 
                className="flex items-start gap-3 p-3 border border-zinc-100 bg-zinc-50 hover:bg-white rounded-md transition-colors"
              >
                <div className="mt-0.5">
                  {event.type === 'initiated' && (
                    <div className="p-1 bg-zinc-900 text-white rounded">
                      <Gift size={12} className="stroke-[2]" />
                    </div>
                  )}
                  {event.type === 'claimed' && (
                    <div className="p-1 bg-emerald-100 text-emerald-700 rounded">
                      <CheckCircle size={12} className="stroke-[2]" />
                    </div>
                  )}
                  {event.type === 'revoked' && (
                    <div className="p-1 bg-red-100 text-red-600 rounded">
                      <Flame size={12} className="stroke-[2]" />
                    </div>
                  )}
                </div>

                <div className="flex-grow space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="font-mono text-[9px] font-bold text-zinc-400 uppercase">
                      Flow #{event.flowId}
                    </span>
                    <span className="font-mono text-[9px] text-zinc-400">
                      {dateStr}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-900 font-semibold font-mono">
                    {event.type === 'initiated' && `Vesting flow created with ${event.amount} FVT`}
                    {event.type === 'claimed' && `Claimed ${event.amount.toFixed(2)} FVT`}
                    {event.type === 'revoked' && `Flow revoked (${event.amount.toFixed(2)} FVT returned)`}
                  </p>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${event.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block font-mono text-[9px] text-indigo-600 hover:underline font-bold"
                  >
                    View on Stellar Expert ({event.txHash.slice(0, 8)}...)
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
