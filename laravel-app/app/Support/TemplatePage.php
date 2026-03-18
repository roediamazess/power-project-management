<?php

namespace App\Support;

class TemplatePage
{
    public static function fragment(string $templateFile): string
    {
        $path = resource_path('template-pages/' . $templateFile);
        if (! is_file($path)) {
            return '';
        }

        $html = file_get_contents($path);
        if ($html === false) {
            return '';
        }

        $bodyStart = strpos($html, '<div class="content-body');
        if ($bodyStart === false) {
            return '';
        }

        $bodyEndMarker = strpos($html, 'Content body end', $bodyStart);
        if ($bodyEndMarker === false) {
            return '';
        }

        $bodyEndCommentStart = strrpos(substr($html, 0, $bodyEndMarker), '<!--**********************************');
        if ($bodyEndCommentStart === false) {
            return '';
        }

        $containerStart = strpos($html, '<div class="container-fluid">', $bodyStart);
        if ($containerStart === false) {
            return '';
        }

        $containerAndContentClose = substr($html, $containerStart, $bodyEndCommentStart - $containerStart);
        $containerAndContentClose = preg_replace('/<\/div>\s*$/', '', $containerAndContentClose, 1);

        $footerMarker = strpos($html, 'Footer start', $bodyEndMarker);
        $modalHtml = '';
        if ($footerMarker !== false) {
            $afterBody = substr($html, $bodyEndCommentStart, $footerMarker - $bodyEndCommentStart);
            $modalStart = strpos($afterBody, '<div class="modal');
            if ($modalStart !== false) {
                $modalHtml = substr($afterBody, $modalStart);
            }
        }

        $fragment = $containerAndContentClose . $modalHtml;

        $fragment = preg_replace('/\b(src|href|data-src|data-original)=([\'"])(?:\.\/|\.\.\/)?images\//i', '$1=$2/images/', $fragment);
        $fragment = preg_replace('/\b(src|href|data-src|data-original)=([\'"])(?:\.\/|\.\.\/)?vendor\//i', '$1=$2/vendor/', $fragment);
        $fragment = preg_replace('/\b(src|href|data-src|data-original)=([\'"])(?:\.\/|\.\.\/)?css\//i', '$1=$2/css/', $fragment);
        $fragment = preg_replace('/\b(src|href|data-src|data-original)=([\'"])(?:\.\/|\.\.\/)?js\//i', '$1=$2/js/', $fragment);

        $fragment = preg_replace('/\b(src|href|data-src|data-original)=(?:\.\/|\.\.\/)?images\//i', '$1=/images/', $fragment);
        $fragment = preg_replace('/\b(src|href|data-src|data-original)=(?:\.\/|\.\.\/)?vendor\//i', '$1=/vendor/', $fragment);
        $fragment = preg_replace('/\b(src|href|data-src|data-original)=(?:\.\/|\.\.\/)?css\//i', '$1=/css/', $fragment);
        $fragment = preg_replace('/\b(src|href|data-src|data-original)=(?:\.\/|\.\.\/)?js\//i', '$1=/js/', $fragment);

        $fragment = preg_replace('/url\((["\']?)(?:\.\/|\.\.\/)?images\//i', 'url($1/images/', $fragment);
        $fragment = preg_replace('/url\((["\']?)(?:\.\/|\.\.\/)?vendor\//i', 'url($1/vendor/', $fragment);

        $fragment = preg_replace('/href=\"javascript:void\\(0\\);?\"/', 'href="#"', $fragment);
        $fragment = preg_replace('/href=\"javascript:void\\(0\\)\"/', 'href="#"', $fragment);

        return $fragment;
    }

    public static function assets(string $templateFile): array
    {
        $path = resource_path('template-pages/' . $templateFile);
        if (! is_file($path)) {
            return ['scripts' => [], 'styles' => []];
        }

        $html = file_get_contents($path);
        if ($html === false) {
            return ['scripts' => [], 'styles' => []];
        }

        preg_match_all('/<script[^>]+src=(["\'])([^"\']+)\1/i', $html, $scriptMatches);
        preg_match_all('/<link[^>]+href=(["\'])([^"\']+)\1/i', $html, $styleMatches);

        $scripts = [];
        foreach ($scriptMatches[2] ?? [] as $src) {
            $src = trim($src);
            if ($src === '' || str_starts_with($src, 'http://') || str_starts_with($src, 'https://')) {
                continue;
            }
            $src = preg_replace('/^(?:\.\/|\.\.\/)+/', '', $src);
            if (! str_starts_with($src, 'vendor/') && ! str_starts_with($src, 'js/')) {
                continue;
            }
            $scripts[] = '/' . $src;
        }

        $styles = [];
        foreach ($styleMatches[2] ?? [] as $href) {
            $href = trim($href);
            if ($href === '' || str_starts_with($href, 'http://') || str_starts_with($href, 'https://')) {
                continue;
            }
            $href = preg_replace('/^(?:\.\/|\.\.\/)+/', '', $href);
            if (! str_starts_with($href, 'vendor/') && ! str_starts_with($href, 'css/')) {
                continue;
            }
            $styles[] = '/' . $href;
        }

        $ignoreScripts = [
            '/vendor/global/global.min.js',
            '/vendor/bootstrap-select/js/bootstrap-select.min.js',
            '/js/custom.min.js',
            '/js/dlabnav-init.js',
            '/js/sidebar-right.js',
        ];

        $scripts = array_values(array_unique(array_values(array_filter($scripts, function ($s) use ($ignoreScripts) {
            return ! in_array($s, $ignoreScripts, true);
        }))));

        $styles = array_values(array_unique($styles));

        return ['scripts' => $scripts, 'styles' => $styles];
    }
}
