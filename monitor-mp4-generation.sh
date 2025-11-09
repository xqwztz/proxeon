#!/bin/bash
# Real-time monitoring of MP4 generation on BigBlueButton server
# Usage: ssh user@h9.sqx.pl 'bash -s' < monitor-mp4-generation.sh

echo "════════════════════════════════════════════════════════"
echo "  🔄 Real-time MP4 Generation Monitor"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

# Monitor worker log for MP4 processing
tail -f /var/log/bigbluebutton/bbb-rap-worker.log 2>/dev/null | grep --line-buffered -i "mp4\|video\|presentation\|processing\|publish" &

# Monitor for new MP4 files being created
watch -n 5 "find /var/bigbluebutton/published/presentation/ -name '*.mp4' -mmin -30 -ls 2>/dev/null" &

wait

