#!/bin/bash
# Clear all cargo-related data from the database
# Usage: bash clear-cargo.sh

set -e

echo "Clearing cargo data..."

docker exec eshtehard_db psql -U eshtehard -d eshtehard -c "
TRUNCATE TABLE
  \"Waybill\",
  \"Appointment\",
  \"HallAnnouncement\",
  \"CargoStatusHistory\",
  \"Cargo\"
RESTART IDENTITY CASCADE;
"

echo "Done. All cargo data cleared."
