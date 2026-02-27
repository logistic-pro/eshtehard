#!/bin/bash
# Clear all cargo-related data from the database
# Usage: bash clear-cargo.sh

set -e

echo "Clearing cargo data..."

docker exec eshtehard_db psql -U eshtehard -d eshtehard -c "TRUNCATE TABLE waybills, appointments, hall_announcements, cargo_status_history, cargo RESTART IDENTITY CASCADE;"

echo "Done. All cargo data cleared."
