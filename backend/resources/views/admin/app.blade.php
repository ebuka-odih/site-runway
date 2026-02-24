@php
    $siteSettings = \App\Support\SiteSettings::get();
    $brandName = (string) ($siteSettings['brand_name'] ?? \App\Support\SiteSettings::defaults()['brand_name']);
@endphp
<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-brand="{{ $brandName }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title inertia>{{ $brandName }} Admin</title>
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body class="min-h-screen bg-slate-950 text-slate-100 antialiased">
        @inertia
    </body>
</html>
