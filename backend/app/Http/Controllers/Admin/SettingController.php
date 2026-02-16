<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use DateTimeInterface;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SettingController extends Controller
{
    private const SETTINGS_CACHE_KEY = 'admin_panel_settings';

    public function index(Request $request): Response
    {
        $settings = [
            ...$this->defaultSettings(),
            ...Cache::get(self::SETTINGS_CACHE_KEY, []),
        ];

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
        ]);
    }

    public function exportSiteDatabaseDetails(): StreamedResponse
    {
        $connectionName = (string) config('database.default');
        $connection = DB::connection($connectionName);
        $driver = $connection->getDriverName();
        $databaseName = (string) $connection->getDatabaseName();
        $tables = $this->tableNames($connectionName, $connection);
        $filename = sprintf('site-database-export-%s.ndjson', now()->format('Ymd-His'));

        return response()->streamDownload(function () use (
            $connectionName,
            $connection,
            $driver,
            $databaseName,
            $tables
        ): void {
            @set_time_limit(0);

            $this->streamExportLine([
                'type' => 'meta',
                'format' => 'runwayalgo.db.export.v1',
                'exported_at' => now()->toIso8601String(),
                'application' => config('app.name'),
                'connection' => [
                    'name' => $connectionName,
                    'driver' => $driver,
                    'database' => $databaseName,
                ],
                'tables_count' => count($tables),
            ]);

            foreach ($tables as $table) {
                $columns = Schema::connection($connectionName)->getColumnListing($table);

                $this->streamExportLine([
                    'type' => 'table',
                    'name' => $table,
                    'columns' => array_values($columns),
                ]);

                foreach ($connection->table($table)->cursor() as $row) {
                    $record = [];

                    foreach ((array) $row as $column => $value) {
                        $record[$column] = $this->normalizeExportValue($value);
                    }

                    $this->streamExportLine([
                        'type' => 'row',
                        'table' => $table,
                        'data' => $record,
                    ]);
                }
            }

            $this->streamExportLine([
                'type' => 'end',
                'tables_count' => count($tables),
            ]);
        }, $filename, [
            'Content-Type' => 'application/x-ndjson',
        ]);
    }

    public function exportUserDatabaseDetails(): StreamedResponse
    {
        return $this->exportSiteDatabaseDetails();
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'site_mode' => ['required', 'string', 'in:live,maintenance'],
            'deposits_enabled' => ['required', 'boolean'],
            'withdrawals_enabled' => ['required', 'boolean'],
            'require_kyc_for_withdrawals' => ['required', 'boolean'],
            'session_timeout_minutes' => ['required', 'integer', 'min:5', 'max:240'],
            'support_email' => ['required', 'email'],
            'livechat_enabled' => ['required', 'boolean'],
            'livechat_provider' => ['nullable', 'string', 'max:60'],
            'livechat_embed_code' => ['nullable', 'string', 'max:20000'],
        ]);

        Cache::forever(self::SETTINGS_CACHE_KEY, $validated);

        return redirect()
            ->route('admin.settings.index')
            ->with('success', 'Admin settings were updated.');
    }

    /**
     * @return array<string, mixed>
     */
    private function defaultSettings(): array
    {
        return [
            'site_mode' => 'live',
            'deposits_enabled' => true,
            'withdrawals_enabled' => true,
            'require_kyc_for_withdrawals' => true,
            'session_timeout_minutes' => 60,
            'support_email' => 'support@runwayalgo.test',
            'livechat_enabled' => false,
            'livechat_provider' => null,
            'livechat_embed_code' => null,
        ];
    }

    /**
     * @return array<int, string>
     */
    private function tableNames(string $connectionName, ConnectionInterface $connection): array
    {
        return match ($connection->getDriverName()) {
            'sqlite' => collect($connection->select(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
            ))
                ->pluck('name')
                ->map(fn ($name) => (string) $name)
                ->values()
                ->all(),
            'mysql' => collect($connection->select(
                'SELECT table_name FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name',
                [$connection->getDatabaseName()]
            ))
                ->pluck('table_name')
                ->map(fn ($name) => (string) $name)
                ->values()
                ->all(),
            'pgsql' => collect($connection->select(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
            ))
                ->pluck('tablename')
                ->map(fn ($name) => (string) $name)
                ->values()
                ->all(),
            'sqlsrv' => collect($connection->select(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
            ))
                ->pluck('TABLE_NAME')
                ->map(fn ($name) => (string) $name)
                ->values()
                ->all(),
            default => array_values(array_map(
                static fn ($name) => (string) $name,
                Schema::connection($connectionName)->getTableListing()
            )),
        };
    }

    private function normalizeExportValue(mixed $value): mixed
    {
        if ($value instanceof DateTimeInterface) {
            return $value->format(DateTimeInterface::ATOM);
        }

        if (is_resource($value)) {
            return '[resource]';
        }

        if (is_array($value)) {
            return array_map(fn ($item) => $this->normalizeExportValue($item), $value);
        }

        if (is_object($value)) {
            return array_map(fn ($item) => $this->normalizeExportValue($item), (array) $value);
        }

        return $value;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function streamExportLine(array $payload): void
    {
        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE).PHP_EOL;

        if (function_exists('ob_flush') && ob_get_level() > 0) {
            @ob_flush();
        }

        flush();
    }
}
