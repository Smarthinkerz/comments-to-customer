#!/usr/bin/env bash
set -e
SRC=commentcustomer-developer/assets
mkdir -p dist/assets/videos
cp -r "$SRC/css" "$SRC/js" "$SRC/images" dist/assets/
cp "$SRC/videos/"*.mp4 dist/assets/videos/ 2>/dev/null || true
cp commentcustomer-developer/site.webmanifest dist/ 2>/dev/null || true
