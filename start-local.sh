#!/bin/bash
# Start Neurosync on http://localhost:8000/desktop-preview.html
cd "$(dirname "$0")"
echo "Starting server in: $(pwd)"
echo "Open in browser: http://localhost:8000/desktop-preview.html"
echo "Press Ctrl+C to stop."
python3 -m http.server 8000
