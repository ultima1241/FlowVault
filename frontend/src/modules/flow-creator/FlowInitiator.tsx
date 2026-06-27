'use client';

import React, { useState } from 'react';
import { Send, Clock, DollarSign, User, RefreshCw } from 'lucide-react';
import { StrKey } from '@stellar/stellar-sdk';

interface FlowInitiatorProps {
  balance: number;
  onSubmit: (recipient: string, amount: number, duration: number) => Promise<void>;
  loading: boolean;
}

export const FlowInitiator: React.FC<FlowInitiatorProps> = ({
  balance,
  onSubmit,
  loading,
}) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('120'); // Default 120 seconds for fast demo
  const [error, setError] = useState('');

  const ratePerSecond = 
    amount && duration && Number(duration) > 0 
      ? (Number(amount) / Number(duration)).toFixed(4)
      : '0.0000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!recipient) {
      setError('Beneficiary address is required.');
      return;
    }
    
    // Validate Stellar public key format
    if (!StrKey.isValidEd25519PublicKey(recipient) && !recipient.startsWith('C')) {
      setError('Invalid beneficiary Stellar address (must start with G or C).');
      return;
    }

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Principal amount must be a positive number.');
      return;
    }

    if (numAmount > balance) {
      setError(`Insufficient FVT balance. You have ${balance} FVT.`);
      return;
    }

    const numDuration = Number(duration);
    if (!duration || isNaN(numDuration) || numDuration <= 0) {
      setError('Vesting period must be greater than 0.');
      return;
    }

    try {
      await onSubmit(recipient, numAmount, numDuration);
      setRecipient('');
      setAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit transaction.');
    }
  };

  return (
    <div className="border border-zinc-200 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-zinc-100">
        <Send size={18} className="text-zinc-700" />
        <h2 className="text-md font-bold text-zinc-950 uppercase tracking-tight">
          Create Vesting Flow
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 border border-red-200 bg-red-50 text-red-700 font-mono text-xs rounded-md">
            ⚠️ {error}
          </div>
        )}

        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Beneficiary Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <User size={14} />
            </div>
            <input
              type="text"
              placeholder="G... or C..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={loading}
              className="block w-full pl-9 pr-3 py-2 border border-zinc-200 bg-zinc-50 rounded-md focus:bg-white text-zinc-950 font-mono text-xs outline-none focus:border-zinc-500 focus:ring-0 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Principal Amount (FVT)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <DollarSign size={14} />
              </div>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
                className="block w-full pl-9 pr-3 py-2 border border-zinc-200 bg-zinc-50 rounded-md focus:bg-white text-zinc-950 font-mono text-xs outline-none focus:border-zinc-500 focus:ring-0 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Vesting Period (Seconds)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Clock size={14} />
              </div>
              <input
                type="number"
                placeholder="120"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                disabled={loading}
                className="block w-full pl-9 pr-3 py-2 border border-zinc-200 bg-zinc-50 rounded-md focus:bg-white text-zinc-950 font-mono text-xs outline-none focus:border-zinc-500 focus:ring-0 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border border-zinc-100 bg-zinc-50 rounded-lg font-mono text-xs space-y-1.5 text-zinc-600">
          <div className="flex justify-between">
            <span className="text-zinc-400 uppercase font-semibold">Flow Rate:</span>
            <span className="font-bold text-zinc-900">{ratePerSecond} FVT / sec</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400 uppercase font-semibold">Vesting Type:</span>
            <span className="font-bold uppercase text-indigo-600">Continuous Linear</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold rounded-md text-sm transition-colors shadow-sm disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Initializing Vesting...
            </>
          ) : (
            <>
              <Send size={14} className="stroke-[2]" />
              Start Vesting Flow
            </>
          )}
        </button>
      </form>
    </div>
  );
};
