#!/usr/bin/env bash
###############################################################################
# CommentCustomer.ai — Image Optimization Pipeline
###############################################################################
# Converts all PNG/JPG assets in the theme to WebP (and AVIF if avifenc is
# installed). Original files are preserved as fallbacks for older browsers.
#
# Usage:    bash scripts/optimize-images.sh
# Re-run:   safe — skips files already converted unless --force is passed
###############################################################################
set -euo pipefail

IMGDIR="commentcustomer-developer/assets/images"
QUALITY=85
FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

[ -d "$IMGDIR" ] || { echo "Error: $IMGDIR not found (run from project root)"; exit 1; }

command -v magick >/dev/null 2>&1 || {
    echo "Error: ImageMagick not installed."
    echo "  Ubuntu/Debian:  sudo apt install imagemagick"
    echo "  macOS:          brew install imagemagick"
    exit 1
}

HAS_AVIF=0
command -v avifenc >/dev/null 2>&1 && HAS_AVIF=1

echo "=== Image Optimization ==="
echo "Source:  $IMGDIR"
echo "Quality: $QUALITY"
echo "AVIF:    $([ $HAS_AVIF -eq 1 ] && echo yes || echo no - install libavif-bin for AVIF)"
echo ""

BEFORE=$(du -sk "$IMGDIR" | awk '{print $1}')
CONVERTED=0
SKIPPED=0

while IFS= read -r -d '' SRC; do
    BASE="${SRC%.*}"
    WEBP="${BASE}.webp"
    AVIF="${BASE}.avif"

    # Skip favicons and platform icons (they need to stay as PNG/ICO)
    case "$(basename "$SRC")" in
        favicon*|apple-touch-icon*|android-chrome*) SKIPPED=$((SKIPPED+1)); continue ;;
    esac

    if [ -f "$WEBP" ] && [ "$FORCE" -eq 0 ] && [ "$WEBP" -nt "$SRC" ]; then
        SKIPPED=$((SKIPPED+1))
        continue
    fi

    magick "$SRC" -quality "$QUALITY" -define webp:method=6 "$WEBP"
    CONVERTED=$((CONVERTED+1))

    if [ $HAS_AVIF -eq 1 ]; then
        avifenc --min 30 --max 50 -j all "$SRC" "$AVIF" >/dev/null 2>&1 || true
    fi
done < <(find "$IMGDIR" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) -print0)

AFTER=$(du -sk "$IMGDIR" | awk '{print $1}')
WEBP_SIZE=$(find "$IMGDIR" -name "*.webp" -exec du -k {} + 2>/dev/null | awk '{sum+=$1} END {print sum+0}')
ORIG_SIZE=$(find "$IMGDIR" -type f \( -name "*.png" -o -name "*.jpg" \) ! -name "favicon*" ! -name "apple-touch*" ! -name "android-chrome*" -exec du -k {} + 2>/dev/null | awk '{sum+=$1} END {print sum+0}')

echo ""
echo "=== Results ==="
echo "Converted: $CONVERTED files"
echo "Skipped:   $SKIPPED files (already up-to-date or excluded)"
echo "Originals: $((ORIG_SIZE/1024)) MB"
echo "WebP:      $((WEBP_SIZE/1024)) MB"
[ $ORIG_SIZE -gt 0 ] && echo "Savings:   $((100 - WEBP_SIZE*100/ORIG_SIZE))% reduction"
echo ""
echo "Update <img> tags to use <picture> for WebP delivery:"
echo '  <picture>'
echo '    <source type="image/webp" srcset="path/to/image.webp">'
echo '    <img src="path/to/image.png" alt="..." loading="lazy" decoding="async">'
echo '  </picture>'
