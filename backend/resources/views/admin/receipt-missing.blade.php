<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Receipt Not Available</title>
    <style>
        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #020617;
            color: #e2e8f0;
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        }
        .card {
            width: min(720px, 92vw);
            border: 1px solid #334155;
            border-radius: 16px;
            background: rgba(15, 23, 42, 0.92);
            padding: 24px;
            box-shadow: 0 20px 40px rgba(2, 6, 23, 0.5);
        }
        .title {
            margin: 0;
            font-size: 1.25rem;
        }
        .message {
            margin-top: 10px;
            color: #94a3b8;
            line-height: 1.5;
        }
        .meta {
            margin-top: 16px;
            padding: 12px;
            border: 1px solid #334155;
            border-radius: 10px;
            background: rgba(2, 6, 23, 0.5);
            font-size: 0.9rem;
            color: #cbd5e1;
            word-break: break-all;
        }
        .actions {
            margin-top: 16px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .btn {
            display: inline-block;
            border: 1px solid #06b6d4;
            color: #a5f3fc;
            text-decoration: none;
            border-radius: 10px;
            padding: 9px 12px;
            font-size: 0.85rem;
        }
        .btn.secondary {
            border-color: #475569;
            color: #cbd5e1;
        }
    </style>
</head>
<body>
<section class="card">
    <h1 class="title">Receipt Not Available</h1>
    <p class="message">{{ $message }}</p>

    <div class="meta">
        <div><strong>Deposit ID:</strong> {{ $depositRequest->id }}</div>
        <div><strong>Stored Path:</strong> {{ $depositRequest->proof_path ?: 'n/a' }}</div>
    </div>

    <div class="actions">
        <a class="btn" href="{{ route('admin.transactions.index', ['tab' => 'deposit']) }}">Back To Transactions</a>
        <a class="btn secondary" href="javascript:window.close();">Close</a>
    </div>
</section>
</body>
</html>
