#!/bin/bash
# Script to check MP4 processing status on BigBlueButton server
# Usage: ssh user@h9.sqx.pl 'bash -s' < check-mp4-processing.sh

echo "════════════════════════════════════════════════════════"
echo "  BBB MP4 Processing Status Checker"
echo "════════════════════════════════════════════════════════"
echo ""

# 1. Check if worker service is running
echo "1️⃣  Checking worker service status..."
echo "────────────────────────────────────────────────────────"
systemctl is-active bbb-rap-process-worker.service > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Worker service is RUNNING"
else
    echo "❌ Worker service is NOT RUNNING"
    echo "   Start with: sudo systemctl start bbb-rap-process-worker.service"
fi
echo ""

# 2. Check recordings in queue
echo "2️⃣  Checking recording processing queue..."
echo "────────────────────────────────────────────────────────"
QUEUED=$(find /var/bigbluebutton/recording/status/processed -name "*.done" 2>/dev/null | wc -l)
PROCESSING=$(find /var/bigbluebutton/recording/status/published -name "*.done" 2>/dev/null | wc -l)
echo "📊 Recordings waiting to process: $QUEUED"
echo "📊 Recordings currently processing: $PROCESSING"
echo ""

# 3. Check recent worker logs
echo "3️⃣  Recent worker log entries (last 20 lines)..."
echo "────────────────────────────────────────────────────────"
if [ -f /var/log/bigbluebutton/bbb-rap-worker.log ]; then
    tail -20 /var/log/bigbluebutton/bbb-rap-worker.log | grep -i "mp4\|video\|presentation" || echo "No relevant logs found"
else
    echo "⚠️  Log file not found"
fi
echo ""

# 4. Check for errors
echo "4️⃣  Checking for errors in logs..."
echo "────────────────────────────────────────────────────────"
if [ -f /var/log/bigbluebutton/bbb-rap-worker.log ]; then
    ERRORS=$(grep -i "error\|failed\|exception" /var/log/bigbluebutton/bbb-rap-worker.log | tail -5)
    if [ -z "$ERRORS" ]; then
        echo "✅ No recent errors found"
    else
        echo "⚠️  Recent errors:"
        echo "$ERRORS"
    fi
else
    echo "⚠️  Log file not found"
fi
echo ""

# 5. Check published recordings with formats
echo "5️⃣  Checking published recordings formats..."
echo "────────────────────────────────────────────────────────"
for dir in /var/bigbluebutton/published/presentation/*/; do
    if [ -d "$dir" ]; then
        RECORD_ID=$(basename "$dir")
        HAS_HTML5=false
        HAS_MP4=false
        
        # Check for presentation format (HTML5)
        if [ -f "$dir/metadata.xml" ]; then
            HAS_HTML5=true
        fi
        
        # Check for video format (MP4)
        if [ -f "$dir/${RECORD_ID}.mp4" ]; then
            HAS_MP4=true
        fi
        
        echo "📹 $RECORD_ID:"
        [ "$HAS_HTML5" = true ] && echo "   ✅ HTML5 (presentation)"
        [ "$HAS_MP4" = true ] && echo "   ✅ MP4 (video)" || echo "   ⏳ MP4 (not ready yet or disabled)"
    fi
done | head -20
echo ""

# 6. Check MP4 configuration
echo "6️⃣  Checking MP4 configuration..."
echo "────────────────────────────────────────────────────────"
if [ -f /usr/local/bigbluebutton/core/scripts/presentation.yml ]; then
    if grep -q "mp4" /usr/local/bigbluebutton/core/scripts/presentation.yml; then
        echo "✅ MP4 is configured in presentation.yml"
        grep -A 3 "video_formats:" /usr/local/bigbluebutton/core/scripts/presentation.yml | head -5
    else
        echo "❌ MP4 is NOT configured in presentation.yml"
    fi
else
    echo "⚠️  Configuration file not found"
fi
echo ""

# 7. Check disk space
echo "7️⃣  Checking disk space..."
echo "────────────────────────────────────────────────────────"
df -h /var/bigbluebutton/ | tail -1
echo ""

echo "════════════════════════════════════════════════════════"
echo "✨ Check complete!"
echo "════════════════════════════════════════════════════════"

