import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Plus, ArrowUpRight, History, X, Copy, Check, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import type { DepositRequestItem, WalletSummaryData } from '../types';

const WalletPage: React.FC = () => {
  const { fetchWalletSummary, fetchCopyFollowing, createDeposit, createWithdrawal, submitDepositProof } = useMarket();
  const [summary, setSummary] = useState<WalletSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveCopyTrader, setHasActiveCopyTrader] = useState(false);

  const [isDepositFormOpen, setIsDepositFormOpen] = useState(false);
  const [isWithdrawalFormOpen, setIsWithdrawalFormOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<'input' | 'payment' | 'processing' | 'success'>('input');
  const [amount, setAmount] = useState('0.00');
  const [crypto, setCrypto] = useState('USDT');
  const [network, setNetwork] = useState('ERC 20');
  const [timeLeft, setTimeLeft] = useState(900);
  const [isCopied, setIsCopied] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [activeDeposit, setActiveDeposit] = useState<DepositRequestItem | null>(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState('0.00');
  const [withdrawalCrypto, setWithdrawalCrypto] = useState('USDT');
  const [withdrawalDestination, setWithdrawalDestination] = useState('');
  const [withdrawalStatus, setWithdrawalStatus] = useState<'input' | 'processing' | 'success'>('input');

  const loadCopyStatus = async () => {
    try {
      const payload = await fetchCopyFollowing();
      setHasActiveCopyTrader(payload.items.some((item) => item.status === 'active'));
    } catch (exception) {
      setHasActiveCopyTrader(false);
    }
  };

  const loadSummary = async () => {
    setError(null);

    try {
      const payload = await fetchWalletSummary();
      setSummary(payload);
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Failed to load wallet summary.';
      setError(message);
    } finally {
      setIsLoading(false);
    }

    await loadCopyStatus();
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  useEffect(() => {
    if (modalStatus !== 'payment') {
      return;
    }

    if (!activeDeposit?.expiresAt) {
      setTimeLeft(900);
      return;
    }

    const tick = () => {
      const expires = new Date(activeDeposit.expiresAt as string).getTime();
      const secondsLeft = Math.max(0, Math.floor((expires - Date.now()) / 1000));
      setTimeLeft(secondsLeft);
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [activeDeposit?.expiresAt, modalStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = () => {
    const address = activeDeposit?.walletAddress ?? '0x906b2533218Df3581da06c697B51eF29f8c86381';
    navigator.clipboard.writeText(address);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShowPayment = async () => {
    if (parseFloat(amount) <= 0) {
      return;
    }

    setError(null);

    try {
      const deposit = await createDeposit({
        amount: parseFloat(amount),
        currency: crypto,
        network,
      });

      setActiveDeposit(deposit);
      setModalStatus('payment');
      setTimeLeft(900);
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Unable to create deposit request.';
      setError(message);
    }
  };

  const handleSubmitProof = async () => {
    if (!activeDeposit) {
      return;
    }

    if (!proofFile) {
      setError('A screenshot proof is required before you can submit this deposit.');
      return;
    }

    setError(null);
    setModalStatus('processing');

    try {
      await submitDepositProof(activeDeposit.id, {
        transactionHash: `0x${Math.random().toString(16).slice(2).padEnd(40, '0').slice(0, 40)}`,
        proofFile,
      });

      setModalStatus('success');
      await loadSummary();
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Deposit proof submission failed.';
      setError(message);
      setModalStatus('payment');
    }
  };

  const handleSubmitWithdrawal = async () => {
    const parsedAmount = parseFloat(withdrawalAmount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid withdrawal amount.');
      return;
    }

    if (hasActiveCopyTrader && parsedAmount > 500) {
      setError('Active copy trading accounts are limited to $500 per withdrawal request.');
      return;
    }

    if (!withdrawalDestination.trim()) {
      setError('Destination wallet address is required for withdrawals.');
      return;
    }

    setError(null);
    setWithdrawalStatus('processing');

    try {
      await createWithdrawal({
        amount: parsedAmount,
        currency: withdrawalCrypto,
        destination: withdrawalDestination.trim(),
      });

      setWithdrawalStatus('success');
      setWithdrawalAmount('0.00');
      setWithdrawalDestination('');
      await loadSummary();
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Unable to create withdrawal request.';
      setError(message);
      setWithdrawalStatus('input');
    }
  };

  const openDepositForm = () => {
    setError(null);
    setIsWithdrawalFormOpen(false);
    setIsDepositFormOpen(true);
  };

  const openWithdrawalForm = () => {
    setError(null);
    setIsDepositFormOpen(false);
    setWithdrawalStatus('input');
    setIsWithdrawalFormOpen(true);
  };

  const resetFlow = () => {
    setIsDepositFormOpen(false);
    setIsWithdrawalFormOpen(false);
    setModalStatus('input');
    setAmount('0.00');
    setTimeLeft(900);
    setProofFile(null);
    setActiveDeposit(null);
    setWithdrawalStatus('input');
  };

  const transactions = summary?.recentTransactions ?? [];

  const deposits = useMemo(() => (
    transactions.filter((transaction) => transaction.type === 'deposit')
  ), [transactions]);
  const pendingWithdrawals = useMemo(() => (
    transactions.filter((transaction) => transaction.type === 'withdrawal' && transaction.status === 'pending')
  ), [transactions]);
  const pendingDeposits = summary?.pendingDeposits ?? [];

  if (isLoading) {
    return (
      <div className="px-4 py-12 flex items-center justify-center">
        <Loader2 className="text-emerald-500 animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Wallet Center</p>
        <h2 className="text-3xl font-black text-white tracking-tight mb-2">Manage your funds</h2>
        <p className="text-sm text-zinc-500 font-medium">Deposit, withdraw, and monitor balances.</p>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex flex-wrap justify-center gap-4">
        <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400">
          <Shield size={14} className="text-emerald-500" />
          SEC Registered
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400">
          <Shield size={14} className="text-emerald-500" />
          Investment Adviser
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400">
          <Shield size={14} className="text-emerald-500" />
          Secure Connection
        </div>
      </div>

      {!isDepositFormOpen && !isWithdrawalFormOpen && (
        <>
          <div className="bg-[#121212] border border-white/5 rounded-[24px] p-6">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Wallet Balance</p>
            <h3 className="text-3xl font-black text-white mb-1 tabular-nums">
              ${(summary?.wallet.cashBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-zinc-500 font-bold">Available instantly</p>
          </div>

          <div className="bg-[#121212] border border-white/5 rounded-[24px] p-6">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Investing</p>
            <h3 className="text-3xl font-black text-white mb-1 tabular-nums">
              ${(summary?.wallet.investingBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-zinc-500 font-bold">Total amount invested</p>
          </div>

          <div className="bg-[#121212] border border-white/5 rounded-[24px] p-6">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Profit</p>
            <h3 className="text-3xl font-black text-white mb-1 tabular-nums">
              ${(summary?.wallet.profitLoss ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-emerald-500 font-black">Lifetime performance</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={openDepositForm}
              className="w-full bg-[#0c1a12] border border-emerald-500/20 rounded-[24px] p-6 flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="text-left">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Deposit</p>
                <h4 className="text-lg font-black text-white">Add funds quickly</h4>
                <p className="text-xs text-zinc-500 font-bold">Crypto and fiat methods</p>
              </div>
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                <Plus size={24} strokeWidth={3} />
              </div>
            </button>

            <button
              onClick={openWithdrawalForm}
              className="w-full bg-[#1a120c] border border-orange-500/20 rounded-[24px] p-6 flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="text-left">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Withdraw</p>
                <h4 className="text-lg font-black text-white">Cash out securely</h4>
                <p className="text-xs text-zinc-500 font-bold">Submit withdrawal for admin approval</p>
              </div>
              <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white">
                <ArrowUpRight size={24} strokeWidth={3} />
              </div>
            </button>
          </div>
        </>
      )}

      {isDepositFormOpen && (
        <div className="animate-in slide-in-from-right-4 duration-500 bg-[#0a0a0a] border border-white/5 rounded-[32px] p-6 space-y-6 relative overflow-hidden">
          <button
            onClick={() => setIsDepositFormOpen(false)}
            className="absolute top-6 right-6 p-2 text-zinc-600 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <header>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Instant Funding</p>
            <h3 className="text-xl font-black text-white mb-2 leading-snug">Submit your deposit proof for admin approval.</h3>
            <p className="text-sm text-zinc-600 font-bold">Select wallet, method, and upload a screenshot of your transfer.</p>
          </header>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Amount</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full bg-[#121212] border border-white/5 rounded-xl py-4 px-4 text-lg font-black text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Cryptocurrency</label>
                <div className="relative">
                  <select
                    value={crypto}
                    onChange={(event) => setCrypto(event.target.value)}
                    className="w-full bg-[#121212] border border-white/5 rounded-xl py-4 px-4 text-sm font-black text-white appearance-none focus:outline-none focus:border-emerald-500/50 transition-all"
                  >
                    <option>USDT</option>
                    <option>BTC</option>
                    <option>ETH</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Network</label>
                <div className="relative">
                  <select
                    value={network}
                    onChange={(event) => setNetwork(event.target.value)}
                    className="w-full bg-[#121212] border border-white/5 rounded-xl py-4 px-4 text-sm font-black text-white appearance-none focus:outline-none focus:border-emerald-500/50 transition-all"
                  >
                    <option>ERC 20</option>
                    <option>TRC 20</option>
                    <option>BEP 20</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <button
              onClick={() => void handleShowPayment()}
              className="w-full py-4 bg-emerald-500 text-black font-black rounded-xl uppercase tracking-widest text-sm hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98]"
            >
              Show Payment Window
            </button>
          </div>
        </div>
      )}

      {isWithdrawalFormOpen && (
        <div className="animate-in slide-in-from-right-4 duration-500 bg-[#0a0a0a] border border-white/5 rounded-[32px] p-6 space-y-6 relative overflow-hidden">
          <button
            onClick={() => setIsWithdrawalFormOpen(false)}
            className="absolute top-6 right-6 p-2 text-zinc-600 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          {withdrawalStatus === 'processing' && (
            <div className="py-10 flex flex-col items-center text-center gap-4">
              <Loader2 className="text-orange-400 animate-spin" size={40} />
              <div>
                <p className="text-sm font-black text-white">Submitting withdrawal</p>
                <p className="text-xs text-zinc-500 font-bold">We&apos;re sending your request for approval.</p>
              </div>
            </div>
          )}

          {withdrawalStatus === 'success' && (
            <div className="py-8 text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
                <Check size={28} className="text-orange-400" />
              </div>
              <div>
                <p className="text-lg font-black text-white">Withdrawal requested</p>
                <p className="text-xs text-zinc-500 font-bold mt-1">
                  Your request is pending admin approval.
                </p>
              </div>
              <button
                onClick={() => setIsWithdrawalFormOpen(false)}
                className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-black font-black rounded-xl uppercase tracking-widest text-sm transition-all shadow-xl shadow-orange-500/20 active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          )}

          {withdrawalStatus === 'input' && (
            <>
              <header>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Withdrawal Request</p>
                <h3 className="text-xl font-black text-white mb-2 leading-snug">Withdraw from your cash balance.</h3>
                <p className="text-sm text-zinc-600 font-bold">
                  Choose a payout coin and destination wallet address.
                </p>
              </header>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Amount</label>
                  <input
                    type="text"
                    value={withdrawalAmount}
                    onChange={(event) => {
                      const rawValue = event.target.value;

                      if (!hasActiveCopyTrader) {
                        setWithdrawalAmount(rawValue);
                        return;
                      }

                      if (rawValue.trim() === '') {
                        setWithdrawalAmount(rawValue);
                        return;
                      }

                      const numericValue = parseFloat(rawValue.replace(/[^0-9.]/g, ''));

                      if (Number.isFinite(numericValue) && numericValue > 500) {
                        setWithdrawalAmount('500');
                        return;
                      }

                      setWithdrawalAmount(rawValue);
                    }}
                    className="w-full bg-[#121212] border border-white/5 rounded-xl py-4 px-4 text-lg font-black text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-800"
                  />
                  {hasActiveCopyTrader && (
                    <p className="text-[11px] font-bold text-orange-300/80 ml-1">
                      Copy trading is active: withdrawals are capped at $500 per request (first two approvals only).
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Payout Coin</label>
                  <div className="relative">
                    <select
                      value={withdrawalCrypto}
                      onChange={(event) => setWithdrawalCrypto(event.target.value)}
                      className="w-full bg-[#121212] border border-white/5 rounded-xl py-4 px-4 text-sm font-black text-white appearance-none focus:outline-none focus:border-orange-500/50 transition-all"
                    >
                      <option>USDT</option>
                      <option>USDC</option>
                      <option>BTC</option>
                      <option>ETH</option>
                      <option>SOL</option>
                      <option>XRP</option>
                      <option>BNB</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Destination Address</label>
                  <input
                    type="text"
                    value={withdrawalDestination}
                    onChange={(event) => setWithdrawalDestination(event.target.value)}
                    placeholder="Paste destination wallet address"
                    className="w-full bg-[#121212] border border-white/5 rounded-xl py-4 px-4 text-sm font-black text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-700"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => void handleSubmitWithdrawal()}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-black font-black rounded-xl uppercase tracking-widest text-sm transition-all shadow-xl shadow-orange-500/20 active:scale-[0.98]"
                >
                  Submit Withdrawal Request
                </button>
                <button
                  onClick={() => setIsWithdrawalFormOpen(false)}
                  className="w-full py-4 border border-zinc-800 hover:border-zinc-700 text-zinc-400 font-black rounded-xl uppercase tracking-widest text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {modalStatus !== 'input' && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#121212] w-full max-w-md rounded-[32px] p-6 border border-white/5 animate-in slide-in-from-bottom-8 shadow-2xl relative overflow-hidden">
            {modalStatus === 'payment' && (
              <div className="space-y-8 animate-in zoom-in-95 duration-300">
                <button
                  onClick={() => setModalStatus('input')}
                  className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="text-center pt-2">
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Send {crypto}</h3>
                  <p className="text-zinc-500 text-sm font-bold">Complete payment and upload proof</p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Wallet Address</label>
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 break-all">
                    <p className="text-xs font-black text-white leading-relaxed font-mono">
                      {activeDeposit?.walletAddress ?? '0x906b2533218Df3581da06c697B51eF29f8c86381'}
                    </p>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="w-full py-3.5 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-black rounded-xl uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2"
                  >
                    {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    {isCopied ? 'Address Copied' : 'Copy Address'}
                  </button>
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 text-center">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Timer</p>
                  <div className="flex items-center justify-center gap-3 text-4xl font-black text-emerald-500 tabular-nums">
                    {formatTime(timeLeft)}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Upload Payment Proof</label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl text-[11px] font-black text-white hover:bg-zinc-800 transition-colors uppercase tracking-widest">
                      Choose File
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => setProofFile(event.target.files?.[0] || null)}
                      />
                    </label>
                    <span className="text-xs text-zinc-600 font-bold truncate flex-1">
                      {proofFile ? proofFile.name : 'No file selected'}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-zinc-600">Screenshot image required (PNG/JPG/WEBP), up to 10MB</p>
                </div>

                <button
                  onClick={() => void handleSubmitProof()}
                  disabled={!proofFile}
                  className="w-full py-4 bg-[#10b981]/90 hover:bg-[#10b981] disabled:bg-zinc-700 disabled:text-zinc-400 disabled:cursor-not-allowed text-black font-black rounded-xl uppercase tracking-widest text-sm transition-all shadow-xl active:scale-[0.98]"
                >
                  Confirm & Submit
                </button>
              </div>
            )}

            {modalStatus === 'processing' && (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="relative mb-8">
                  <Loader2 size={48} className="text-emerald-500 animate-spin" strokeWidth={3} />
                  <div className="absolute inset-0 bg-emerald-500/20 blur-2xl animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-widest">Processing Deposit</h3>
                <p className="text-zinc-500 text-sm font-bold">Verifying your payment proof...</p>
              </div>
            )}

            {modalStatus === 'success' && (
              <div className="animate-in zoom-in-95 duration-500 text-center pb-4">
                <div className="flex flex-col items-center mb-8 mt-6">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 relative">
                    <Check size={40} className="text-emerald-500" strokeWidth={3} />
                    <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20" />
                    <Sparkles className="absolute -top-1 -right-1 text-yellow-400 animate-bounce" size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Deposit Submitted</h3>
                  <p className="text-zinc-500 text-sm font-bold max-w-[280px]">
                    Your request for <span className="text-white">${amount} {crypto}</span> is being processed.
                  </p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 text-left mb-10">
                  <p className="text-[11px] font-bold text-zinc-500 leading-relaxed italic">
                    Funds will appear in your wallet balance once confirmed by our financial desk. This usually takes 5-15 minutes.
                  </p>
                </div>

                <button
                  onClick={resetFlow}
                  className="w-full py-4 bg-white text-black font-black rounded-full uppercase tracking-widest text-sm transition-all shadow-xl active:scale-[0.98]"
                >
                  Return to Wallet
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!isDepositFormOpen && !isWithdrawalFormOpen && (
        <>
          {pendingDeposits.length > 0 && (
            <div className="bg-[#121212] border border-amber-500/20 rounded-[24px] p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest">Pending Deposits</h4>
                <span className="text-xs font-black text-zinc-500">{pendingDeposits.length} in review</span>
              </div>

              <div className="space-y-4">
                {pendingDeposits.map((deposit) => (
                  <div key={deposit.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-black text-white tabular-nums">
                        ${deposit.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                        {deposit.currency}{deposit.network ? ` • ${deposit.network}` : ''}
                      </p>
                    </div>
                    <span className="bg-amber-500/10 text-amber-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/25">
                      {deposit.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingWithdrawals.length > 0 && (
            <div className="bg-[#121212] border border-orange-500/20 rounded-[24px] p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black text-orange-400 uppercase tracking-widest">Pending Withdrawals</h4>
                <span className="text-xs font-black text-zinc-500">{pendingWithdrawals.length} awaiting review</span>
              </div>

              <div className="space-y-4">
                {pendingWithdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-black text-white tabular-nums">
                        ${withdrawal.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                        {withdrawal.symbol ?? 'Asset'} • {withdrawal.type}
                      </p>
                    </div>
                    <span className="bg-orange-500/10 text-orange-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-500/25">
                      {withdrawal.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#121212] border border-white/5 rounded-[24px] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History size={16} className="text-zinc-500" />
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">History</p>
                  <h4 className="text-lg font-black text-white">Deposits timeline</h4>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {deposits.slice(0, 3).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-black text-white tabular-nums">
                      ${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                      {transaction.symbol ?? 'Asset'} • {transaction.type}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                    {transaction.status}
                  </div>
                </div>
              ))}
              {deposits.length === 0 && (
                <p className="text-zinc-500 text-sm">No deposit history yet.</p>
              )}
            </div>
          </div>

          <div className="bg-[#121212] border border-white/5 rounded-[24px] p-6 pb-2">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-sm font-black text-zinc-500 uppercase tracking-widest">Recent Movement</h4>
            </div>

            <div className="space-y-8">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between pb-6 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-base font-black text-white">{transaction.type}</p>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                      {transaction.occurredAt ? new Date(transaction.occurredAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-black tabular-nums ${transaction.direction === 'credit' ? 'text-white' : 'text-zinc-400'}`}>
                      {transaction.direction === 'credit' ? '+' : '-'}
                      ${Math.abs(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{transaction.status}</span>
                    </div>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-zinc-500 text-sm pb-6">No recent transactions yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WalletPage;
