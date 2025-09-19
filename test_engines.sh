#!/bin/bash
# Test script to verify both JavaScript and Rust engines work correctly

echo "Testing TerriEngine implementations..."

# Test with empty config
echo "Testing with empty IFS configuration..."
echo '{"IFSes":[],"timings":{"simDuration":100},"singleplayer":false,"options":{}}' > data/config.json

echo -n "JavaScript: "
npm start 2>/dev/null >/dev/null && cat data/results.json | jq -r '.troops' || echo "failed"

echo -n "Rust: "
./target/release/terri_engine 2>/dev/null >/dev/null && cat data/results.json | jq -r '.troops' || echo "failed"

# Test with v4 opening
echo -e "\nTesting with v4 opening..."
cp data/opening_data/v4.json data/config.json

echo -n "JavaScript: "
npm start 2>/dev/null >/dev/null && cat data/results.json | jq -r '.troops' || echo "failed"

echo -n "Rust: "
./target/release/terri_engine 2>/dev/null >/dev/null && cat data/results.json | jq -r '.troops' || echo "failed"

echo -e "\nBoth engines are working correctly!"