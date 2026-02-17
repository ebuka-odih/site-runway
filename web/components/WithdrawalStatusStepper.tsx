import React from 'react';
import { Check } from 'lucide-react';
import { WalletTransactionItem } from '../types';

interface WithdrawalStatusStepperProps {
    transaction: Partial<WalletTransactionItem> & {
        initialAmount?: number;
        amount?: number;
        status?: string;
        occurredAt?: string;
    };
}

const WithdrawalStatusStepper: React.FC<WithdrawalStatusStepperProps> = ({ transaction }) => {
    const amount = transaction.amount ?? transaction.initialAmount ?? 0;
    const status = (transaction.status || 'pending').toLowerCase();
    const date = transaction.occurredAt ? new Date(transaction.occurredAt) : new Date();

    const steps = [
        {
            id: 'submitted',
            label: 'Submitted',
            description: 'Request received',
        },
        {
            id: 'processing',
            label: 'Processing',
            description: 'Under review',
        },
        {
            id: 'reviewed',
            label: 'Reviewed',
            description: 'Admin verification',
        },
        {
            id: 'completed',
            label: 'Completed',
            description: 'Funds transferred',
        },
    ];

    /*
     * Logic:
     * 0 (Submitted) is completed as soon as transaction exists.
     * 1 (Processing) is active for 'pending'.
     * 2 (Reviewed) is active for 'processing'.
     * 3 (Completed) is active for 'reviewed'.
     * 4 (All Done) is for 'completed'/'approved'.
     */
    let currentStepIndex = 1; // Default for 'pending' -> Processing is active

    if (['approved', 'completed', 'success'].includes(status)) {
        currentStepIndex = 4;
    } else if (status === 'reviewed') {
        currentStepIndex = 3;
    } else if (status === 'processing') {
        currentStepIndex = 2;
    } else if (['rejected', 'declined', 'failed'].includes(status)) {
        currentStepIndex = 1; // Stuck at processing
    }

    return (
        <div className="w-full text-left">
            <div className="mb-6">
                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Withdrawal Details</h4>
                <h2 className="text-3xl font-black text-white tracking-tight mb-1">
                    -${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <p className="text-xs font-bold text-zinc-500">
                    {date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </p>
            </div>

            <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 relative">
                <div className="space-y-0 relative">
                    {/* Vertical Line Connector */}
                    <div className="absolute left-[23px] top-[24px] bottom-[24px] w-[2px] bg-zinc-800 z-0" />
                    {/* Active Progress Line */}
                    <div
                        className="absolute left-[23px] top-[24px] w-[2px] bg-emerald-500 z-0 transition-all duration-1000"
                        style={{
                            height: currentStepIndex === 0 ? '0%' :
                                currentStepIndex === 4 ? '100%' :
                                    `${((currentStepIndex - 1) / (steps.length - 1)) * 100}%`
                        }}
                    />

                    {steps.map((step, index) => {
                        let stepState = 'pending';
                        if (index < currentStepIndex) stepState = 'completed';
                        else if (index === currentStepIndex && currentStepIndex !== 4) stepState = 'current';

                        const isCompleted = stepState === 'completed';
                        const isCurrent = stepState === 'current';
                        const isLast = index === steps.length - 1;

                        return (
                            <div key={step.id} className="flex gap-6 relative group pb-10 last:pb-0">
                                <div className="relative z-10">
                                    <div
                                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500
                      ${isCompleted
                                                ? 'bg-emerald-500 border-emerald-500 text-black'
                                                : isCurrent
                                                    ? 'bg-black border-emerald-500 text-emerald-500'
                                                    : 'bg-black border-zinc-800 text-zinc-700'}
                    `}
                                    >
                                        {isCompleted ? (
                                            <Check size={20} strokeWidth={3} />
                                        ) : isCurrent ? (
                                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                                        ) : (
                                            <div className="w-2.5 h-2.5 bg-zinc-800 rounded-full" />
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <h4 className={`text-base font-black transition-colors ${isCompleted || isCurrent ? 'text-white' : 'text-zinc-500'}`}>
                                        {step.label}
                                    </h4>
                                    <p className="text-xs font-bold text-zinc-600 mt-0.5">
                                        {step.description}
                                    </p>

                                    {isCompleted && step.id === 'completed' && (
                                        <div className="flex items-center gap-1.5 mt-2 text-emerald-500 animate-in fade-in slide-in-from-left-2">
                                            <Check size={12} strokeWidth={3} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Successfully completed</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WithdrawalStatusStepper;
