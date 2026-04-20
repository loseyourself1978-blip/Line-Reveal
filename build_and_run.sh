#!/bin/bash
say "Starting build"
cd "/Users/hj/Downloads/Line Reveal/LineReveal"

echo "Step 1: TypeScript compile..."
node_modules/.bin/tsc -b 2>&1
if [ $? -ne 0 ]; then
  say "TypeScript failed"
  echo "tsc FAILED"
  exit 1
fi
echo "tsc OK"

echo "Step 2: Vite build..."
node_modules/.bin/vite build 2>&1
if [ $? -ne 0 ]; then
  say "Build failed"
  echo "vite build FAILED"
  exit 1
fi
echo "vite OK"

echo "Step 3: Cap sync..."
node_modules/.bin/cap sync ios 2>&1
echo "cap sync OK"

say "Build complete. Now open Xcode and press Command+R to run."
echo "ALL DONE"
