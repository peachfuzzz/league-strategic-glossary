#!/bin/bash
# Auto-import terms from CSV if the file exists

CSV_FILE="src/data/terms_export.csv"

if [ -f "$CSV_FILE" ]; then
    echo "📥 Found $CSV_FILE - importing terms..."
    python3 scripts/import_terms.py "$CSV_FILE"
else
    echo "ℹ️  No CSV file found at $CSV_FILE - skipping import"
fi
