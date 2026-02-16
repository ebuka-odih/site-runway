<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Page Expired</title>
    <style>
        :root {
            color-scheme: light;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
            color: #111827;
        }

        main {
            width: min(100%, 560px);
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 28px;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
        }

        .status {
            margin: 0 0 8px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #4f46e5;
        }

        h1 {
            margin: 0 0 12px;
            font-size: clamp(28px, 4vw, 36px);
            line-height: 1.1;
        }

        p {
            margin: 0;
            font-size: 16px;
            line-height: 1.6;
            color: #374151;
        }

        .hint {
            margin-top: 8px;
            color: #4b5563;
        }

        .actions {
            margin-top: 24px;
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }

        .button {
            appearance: none;
            border: 0;
            border-radius: 10px;
            padding: 10px 16px;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: transform 0.12s ease, box-shadow 0.12s ease, background-color 0.12s ease;
        }

        .button:focus-visible {
            outline: 3px solid #93c5fd;
            outline-offset: 2px;
        }

        .button.primary {
            background: #111827;
            color: #ffffff;
        }

        .button.primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 20px rgba(17, 24, 39, 0.25);
        }

        .button.secondary {
            background: #e5e7eb;
            color: #111827;
        }

        .button.secondary:hover {
            background: #d1d5db;
        }
    </style>
</head>
<body>
    <main>
        <p class="status">Error 419</p>
        <h1>Page Expired</h1>
        <p>Your session expired or the form token is no longer valid.</p>
        <p class="hint">Refresh this page and try again, or go back and resubmit your form.</p>

        <div class="actions">
            <button type="button" class="button primary" onclick="window.location.reload();">Refresh Page</button>
            <button
                type="button"
                class="button secondary"
                onclick="if (window.history.length > 1) { window.history.back(); } else { window.location.assign('{{ url('/') }}'); }"
            >
                Go Back
            </button>
        </div>

        <noscript>
            <p class="hint">JavaScript is disabled. <a href="{{ url('/') }}">Go to home page</a>.</p>
        </noscript>
    </main>
</body>
</html>
