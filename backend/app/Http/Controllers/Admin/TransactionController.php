<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DepositRequest;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransactionController extends Controller
{
    public function index(Request $request): Response
    {
        $tab = (string) $request->string('tab', 'deposit');

        if (! in_array($tab, ['deposit', 'withdrawal'], true)) {
            $tab = 'deposit';
        }

        $transactions = $tab === 'withdrawal'
            ? WalletTransaction::query()
                ->with(['wallet.user:id,name,email', 'asset:id,symbol'])
                ->where('type', 'withdrawal')
                ->latest('occurred_at')
                ->paginate(15)
                ->withQueryString()
                ->through(fn (WalletTransaction $walletTransaction) => $this->withdrawalTransactionPayload($walletTransaction))
            : DepositRequest::query()
                ->with(['wallet.user:id,name,email', 'asset:id,symbol'])
                ->latest('created_at')
                ->paginate(15)
                ->withQueryString()
                ->through(fn (DepositRequest $depositRequest) => $this->depositRequestPayload($depositRequest));

        $stats = $tab === 'withdrawal'
            ? [
                'total' => WalletTransaction::query()->where('type', 'withdrawal')->count(),
                'pending' => WalletTransaction::query()->where('type', 'withdrawal')->where('status', 'pending')->count(),
                'approved' => WalletTransaction::query()->where('type', 'withdrawal')->where('status', 'approved')->count(),
                'rejected' => WalletTransaction::query()->where('type', 'withdrawal')->where('status', 'rejected')->count(),
            ]
            : [
                'total' => DepositRequest::query()->count(),
                'pending' => DepositRequest::query()->whereIn('status', ['input', 'payment', 'processing'])->count(),
                'approved' => DepositRequest::query()->where('status', 'approved')->count(),
                'rejected' => DepositRequest::query()->where('status', 'rejected')->count(),
            ];

        return Inertia::render('Admin/Transactions/Index', [
            'activeTab' => $tab,
            'transactions' => $transactions,
            'stats' => $stats,
        ]);
    }

    public function showDepositReceipt(DepositRequest $depositRequest): StreamedResponse|RedirectResponse|HttpResponse
    {
        $proofPath = trim((string) $depositRequest->proof_path);

        if ($proofPath === '') {
            return $this->missingReceiptPage($depositRequest, 'No receipt path was saved for this transaction.');
        }

        if (filter_var($proofPath, FILTER_VALIDATE_URL)) {
            return redirect()->away($proofPath);
        }

        $normalizedPath = ltrim($proofPath, '/');

        foreach ($this->receiptDisks() as $disk) {
            $storage = Storage::disk($disk);

            foreach ($this->storageProofPathCandidates($normalizedPath) as $candidate) {
                if (! $storage->exists($candidate)) {
                    continue;
                }

                return $storage->response($candidate);
            }
        }

        foreach ($this->publicProofPathCandidates($normalizedPath) as $absolutePath) {
            if (is_file($absolutePath)) {
                return response()->file($absolutePath);
            }
        }

        return $this->missingReceiptPage(
            $depositRequest,
            'Receipt file was not found in storage. Please upload a new proof image for this transaction.',
        );
    }

    public function approveDepositRequest(DepositRequest $depositRequest): RedirectResponse
    {
        if ($depositRequest->status === 'approved') {
            return back()->with('error', 'Deposit request has already been approved.');
        }

        if ($depositRequest->status === 'rejected') {
            return back()->with('error', 'Rejected deposit requests cannot be approved.');
        }

        DB::transaction(function () use ($depositRequest) {
            $lockedRequest = DepositRequest::query()
                ->whereKey($depositRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (in_array($lockedRequest->status, ['approved', 'rejected'], true)) {
                return;
            }

            $wallet = Wallet::query()->whereKey($lockedRequest->wallet_id)->lockForUpdate()->firstOrFail();

            $lockedRequest->update([
                'status' => 'approved',
                'submitted_at' => $lockedRequest->submitted_at ?? now(),
                'processed_at' => now(),
            ]);

            $wallet->cash_balance = (float) $wallet->cash_balance + (float) $lockedRequest->amount;
            $wallet->save();

            WalletTransaction::query()->create([
                'wallet_id' => $wallet->id,
                'asset_id' => $lockedRequest->asset_id,
                'type' => 'deposit',
                'status' => 'approved',
                'direction' => 'credit',
                'amount' => $lockedRequest->amount,
                'network' => $lockedRequest->network,
                'notes' => 'Deposit approved by admin panel',
                'occurred_at' => now(),
                'metadata' => [
                    'deposit_request_id' => $lockedRequest->id,
                    'transaction_hash' => $lockedRequest->transaction_hash,
                    'proof_path' => $lockedRequest->proof_path,
                ],
            ]);
        });

        return back()->with('success', 'Deposit request approved.');
    }

    public function declineDepositRequest(DepositRequest $depositRequest): RedirectResponse
    {
        if ($depositRequest->status === 'approved') {
            return back()->with('error', 'Approved deposit requests cannot be declined.');
        }

        if ($depositRequest->status === 'rejected') {
            return back()->with('error', 'Deposit request has already been declined.');
        }

        $depositRequest->update([
            'status' => 'rejected',
            'submitted_at' => $depositRequest->submitted_at ?? now(),
            'processed_at' => now(),
        ]);

        return back()->with('success', 'Deposit request declined.');
    }

    public function destroyDepositRequest(DepositRequest $depositRequest): RedirectResponse
    {
        if ($depositRequest->status === 'approved') {
            return back()->with('error', 'Approved deposit requests cannot be deleted.');
        }

        $proofPath = trim((string) $depositRequest->proof_path);

        $depositRequest->delete();

        if ($proofPath !== '' && ! filter_var($proofPath, FILTER_VALIDATE_URL)) {
            foreach ($this->receiptDisks() as $disk) {
                $storage = Storage::disk($disk);

                if ($storage->exists($proofPath)) {
                    $storage->delete($proofPath);
                }
            }
        }

        return back()->with('success', 'Deposit request deleted.');
    }

    public function approveWithdrawalTransaction(WalletTransaction $walletTransaction): RedirectResponse
    {
        if ($walletTransaction->type !== 'withdrawal') {
            return back()->with('error', 'Invalid withdrawal transaction.');
        }

        if ($walletTransaction->status === 'approved') {
            return back()->with('error', 'Withdrawal transaction is already approved.');
        }

        if ($walletTransaction->status === 'rejected') {
            return back()->with('error', 'Rejected withdrawal transaction cannot be approved.');
        }

        $walletTransaction->update([
            'status' => 'approved',
        ]);

        return back()->with('success', 'Withdrawal transaction approved.');
    }

    public function declineWithdrawalTransaction(WalletTransaction $walletTransaction): RedirectResponse
    {
        if ($walletTransaction->type !== 'withdrawal') {
            return back()->with('error', 'Invalid withdrawal transaction.');
        }

        if ($walletTransaction->status === 'approved') {
            return back()->with('error', 'Approved withdrawal transaction cannot be declined.');
        }

        if ($walletTransaction->status === 'rejected') {
            return back()->with('error', 'Withdrawal transaction is already rejected.');
        }

        $walletTransaction->update([
            'status' => 'rejected',
        ]);

        return back()->with('success', 'Withdrawal transaction declined.');
    }

    public function destroyWithdrawalTransaction(WalletTransaction $walletTransaction): RedirectResponse
    {
        if ($walletTransaction->type !== 'withdrawal') {
            return back()->with('error', 'Invalid withdrawal transaction.');
        }

        if ($walletTransaction->status === 'approved') {
            return back()->with('error', 'Approved withdrawal transaction cannot be deleted.');
        }

        $walletTransaction->delete();

        return back()->with('success', 'Withdrawal transaction deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function depositRequestPayload(DepositRequest $depositRequest): array
    {
        $receiptUrl = $this->receiptUrl($depositRequest);
        $canAct = in_array($depositRequest->status, ['input', 'payment', 'processing'], true);

        return [
            'id' => $depositRequest->id,
            'type' => 'deposit',
            'status' => $depositRequest->status,
            'amount' => (float) $depositRequest->amount,
            'currency' => $depositRequest->currency,
            'network' => $depositRequest->network,
            'asset_symbol' => $depositRequest->asset?->symbol,
            'user_name' => $depositRequest->wallet?->user?->name,
            'user_email' => $depositRequest->wallet?->user?->email,
            'transaction_hash' => $depositRequest->transaction_hash,
            'receipt_url' => $receiptUrl,
            'has_receipt' => $receiptUrl !== null,
            'submitted_at' => $depositRequest->submitted_at?->toIso8601String(),
            'processed_at' => $depositRequest->processed_at?->toIso8601String(),
            'created_at' => $depositRequest->created_at?->toIso8601String(),
            'can_approve' => $canAct,
            'can_decline' => $canAct,
            'can_delete' => $depositRequest->status !== 'approved',
            'approve_url' => $this->namedRouteOrPath(
                name: 'admin.transactions.deposits.approve',
                fallbackPath: "/admin/transactions/deposits/{$depositRequest->getKey()}/approve",
                parameters: $depositRequest,
            ),
            'decline_url' => $this->namedRouteOrPath(
                name: 'admin.transactions.deposits.decline',
                fallbackPath: "/admin/transactions/deposits/{$depositRequest->getKey()}/decline",
                parameters: $depositRequest,
            ),
            'delete_url' => $this->namedRouteOrPath(
                name: 'admin.transactions.deposits.destroy',
                fallbackPath: "/admin/transactions/deposits/{$depositRequest->getKey()}",
                parameters: $depositRequest,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function withdrawalTransactionPayload(WalletTransaction $walletTransaction): array
    {
        $canAct = $walletTransaction->status === 'pending';

        return [
            'id' => $walletTransaction->id,
            'type' => $walletTransaction->type,
            'status' => $walletTransaction->status,
            'amount' => (float) $walletTransaction->amount,
            'currency' => $walletTransaction->asset?->symbol ?? 'USD',
            'network' => $walletTransaction->network,
            'asset_symbol' => $walletTransaction->asset?->symbol,
            'user_name' => $walletTransaction->wallet?->user?->name,
            'user_email' => $walletTransaction->wallet?->user?->email,
            'transaction_hash' => data_get($walletTransaction->metadata, 'transaction_hash'),
            'receipt_url' => null,
            'has_receipt' => false,
            'submitted_at' => $walletTransaction->occurred_at?->toIso8601String(),
            'processed_at' => $walletTransaction->status !== 'pending'
                ? $walletTransaction->updated_at?->toIso8601String()
                : null,
            'created_at' => $walletTransaction->created_at?->toIso8601String(),
            'can_approve' => $canAct,
            'can_decline' => $canAct,
            'can_delete' => $walletTransaction->status !== 'approved',
            'approve_url' => $this->namedRouteOrPath(
                name: 'admin.transactions.withdrawals.approve',
                fallbackPath: "/admin/transactions/withdrawals/{$walletTransaction->getKey()}/approve",
                parameters: $walletTransaction,
            ),
            'decline_url' => $this->namedRouteOrPath(
                name: 'admin.transactions.withdrawals.decline',
                fallbackPath: "/admin/transactions/withdrawals/{$walletTransaction->getKey()}/decline",
                parameters: $walletTransaction,
            ),
            'delete_url' => $this->namedRouteOrPath(
                name: 'admin.transactions.withdrawals.destroy',
                fallbackPath: "/admin/transactions/withdrawals/{$walletTransaction->getKey()}",
                parameters: $walletTransaction,
            ),
        ];
    }

    private function receiptUrl(DepositRequest $depositRequest): ?string
    {
        $proofPath = trim((string) $depositRequest->proof_path);

        if ($proofPath === '') {
            return null;
        }

        if (filter_var($proofPath, FILTER_VALIDATE_URL)) {
            return $proofPath;
        }

        return $this->namedRouteOrPath(
            name: 'admin.transactions.deposits.receipt',
            fallbackPath: "/admin/transactions/deposits/{$depositRequest->getKey()}/receipt",
            parameters: $depositRequest,
        );
    }

    /**
     * @return array<int, string>
     */
    private function receiptDisks(): array
    {
        return ['local', 'public'];
    }

    private function namedRouteOrPath(string $name, string $fallbackPath, mixed $parameters = null): string
    {
        if (Route::has($name)) {
            return $parameters !== null
                ? route($name, $parameters, false)
                : route($name, absolute: false);
        }

        return $fallbackPath;
    }

    /**
     * @return array<int, string>
     */
    private function storageProofPathCandidates(string $normalizedPath): array
    {
        return array_values(array_unique([
            $normalizedPath,
            preg_replace('/^storage\//', '', $normalizedPath),
            preg_replace('/^public\//', '', $normalizedPath),
        ]));
    }

    /**
     * @return array<int, string>
     */
    private function publicProofPathCandidates(string $normalizedPath): array
    {
        $withoutStoragePrefix = preg_replace('/^storage\//', '', $normalizedPath);
        $withoutPublicPrefix = preg_replace('/^public\//', '', $normalizedPath);

        return array_values(array_unique([
            public_path($normalizedPath),
            public_path("storage/{$withoutStoragePrefix}"),
            public_path($withoutPublicPrefix),
        ]));
    }

    private function missingReceiptPage(DepositRequest $depositRequest, string $message): HttpResponse
    {
        return response()->view('admin.receipt-missing', [
            'depositRequest' => $depositRequest,
            'message' => $message,
        ], 200);
    }
}
