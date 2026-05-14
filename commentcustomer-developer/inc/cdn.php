<?php
/**
 * Centralized media URL helper — supports CDN-backed delivery with local fallback.
 *
 * Usage in templates:
 *   <source src="<?php echo cc_media_url('videos/demo.mp4'); ?>" type="video/mp4">
 *   <img src="<?php echo cc_media_url('images/hero.webp'); ?>">
 *
 * Behavior:
 *   - If CC_MEDIA_BASE_URL env var is set (e.g. https://cdn.example.com or
 *     https://r2.commentcustomer.ai), assets are served from there.
 *   - Otherwise falls back to local theme assets (no behavior change).
 *
 * In production:
 *   1. Upload commentcustomer-developer/assets/{videos,images} to your bucket
 *      (Cloudflare R2, Bunny CDN, S3, etc.) preserving the directory layout
 *   2. Set env var:  CC_MEDIA_BASE_URL=https://your-cdn.example.com
 *   3. Reload — the same paths now resolve to CDN URLs.
 *
 * No code changes needed to flip CDN on/off.
 */

if (!defined('ABSPATH') && !defined('CC_THEME_URI')) {
    // Allow standalone use in the Node preview server (server.cjs templating)
    if (!defined('CC_THEME_URI')) define('CC_THEME_URI', '/wp-content/themes/commentcustomer-developer');
}

if (!function_exists('cc_media_url')) {
    /**
     * Resolve a media path to either a CDN URL or local theme asset URL.
     *
     * @param string $relative_path  e.g. 'videos/demo.mp4' or 'images/hero.webp'
     * @return string Absolute URL
     */
    function cc_media_url($relative_path) {
        $relative_path = ltrim((string) $relative_path, '/');
        // Defense-in-depth: reject path traversal, backslashes, and absolute schemes
        if (
            $relative_path === '' ||
            strpos($relative_path, '..') !== false ||
            strpos($relative_path, '\\') !== false ||
            strpos($relative_path, "\0") !== false ||
            preg_match('#^[a-z][a-z0-9+.-]*://#i', $relative_path)
        ) {
            return CC_THEME_URI . '/assets/';
        }
        $cdn_base = getenv('CC_MEDIA_BASE_URL');
        if ($cdn_base && filter_var($cdn_base, FILTER_VALIDATE_URL)) {
            return rtrim($cdn_base, '/') . '/' . $relative_path;
        }
        return CC_THEME_URI . '/assets/' . $relative_path;
    }
}

if (!function_exists('cc_picture')) {
    /**
     * Render a <picture> element with WebP source + original fallback + lazy loading.
     *
     * @param string $base    e.g. 'images/hero' (no extension)
     * @param string $ext     fallback extension, e.g. 'png' or 'jpg'
     * @param string $alt     alt text
     * @param array  $attrs   extra attrs: ['class'=>'…', 'width'=>1280, 'height'=>720, 'loading'=>'eager']
     */
    function cc_picture($base, $ext, $alt, $attrs = []) {
        $attrs = array_merge(['loading' => 'lazy', 'decoding' => 'async'], $attrs);
        $attr_str = '';
        foreach ($attrs as $k => $v) {
            $attr_str .= ' ' . htmlspecialchars($k) . '="' . htmlspecialchars($v) . '"';
        }
        $webp = cc_media_url($base . '.webp');
        $orig = cc_media_url($base . '.' . $ext);
        echo '<picture>';
        echo '<source type="image/webp" srcset="' . $webp . '">';
        echo '<img src="' . $orig . '" alt="' . htmlspecialchars($alt) . '"' . $attr_str . '>';
        echo '</picture>';
    }
}
