<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Power Project Management') }}</title>

        <link rel="shortcut icon" type="image/png" href="{{ asset('favicon.png') }}">
        <link href="{{ asset('vendor/bootstrap-select/css/bootstrap-select.min.css') }}" rel="stylesheet">
        <link href="{{ asset('vendor/owl-carousel/owl.carousel.css') }}" rel="stylesheet">
        <link rel="stylesheet" href="{{ asset('vendor/nouislider/nouislider.min.css') }}">
        <link href="{{ asset('vendor/fullcalendar/css/main.min.css') }}" rel="stylesheet">
        <link href="{{ asset('vendor/bootstrap-datepicker-master/css/bootstrap-datepicker.min.css') }}" rel="stylesheet">
        <link href="{{ asset('vendor/sweetalert2/sweetalert2.min.css') }}" rel="stylesheet">
        <link href="{{ asset('css/style.css') }}?v={{ @filemtime(public_path('css/style.css')) }}" rel="stylesheet">

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body>
        <div id="preloader">
            <div class="lds-ripple">
                <div></div>
                <div></div>
            </div>
        </div>

        @inertia

        <script src="{{ asset('vendor/global/global.min.js') }}"></script>
        <script src="{{ asset('vendor/bootstrap-select/js/bootstrap-select.min.js') }}"></script>
        <script src="{{ asset('vendor/counter/counter.min.js') }}"></script>
        <script src="{{ asset('vendor/counter/waypoint.min.js') }}"></script>
        <script src="{{ asset('vendor/apexchart/apexchart.js') }}"></script>
        <script src="{{ asset('vendor/chart-js/chart.bundle.min.js') }}"></script>
        <script src="{{ asset('vendor/peity/jquery.peity.min.js') }}"></script>
        <script src="{{ asset('vendor/owl-carousel/owl.carousel.js') }}"></script>
        <script src="{{ asset('vendor/draggable/draggable.js') }}"></script>
        <script src="{{ asset('vendor/fullcalendar/js/main.min.js') }}"></script>
        <script src="{{ asset('vendor/moment/moment.min.js') }}"></script>
        <script src="{{ asset('vendor/bootstrap-datepicker-master/js/bootstrap-datepicker.min.js') }}"></script>
        <script src="{{ asset('vendor/sweetalert2/sweetalert2.min.js') }}"></script>
        <script src="{{ asset('js/custom.js') }}?v={{ @filemtime(public_path('js/custom.js')) }}"></script>
        <script src="{{ asset('js/dlabnav-init.js') }}"></script>
        <script src="{{ asset('js/sidebar-right.js') }}"></script>
    </body>
</html>
