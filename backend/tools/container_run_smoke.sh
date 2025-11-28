#!/bin/sh
# Run the minimal distributed smoke inside the container while polling /proc
(while true; do for p in /proc/[0-9]*; do printf "%s\n" "$p"; cat "$p/cmdline" 2>/dev/null | tr '\0' ' '; echo; done > /tmp/procs.log; sleep 0.25; done) & POLL_PID=$!
echo "started procs poll $POLL_PID"
PYTHONPATH=backend python3 backend/tools/tpot_trainer_smoke_distributed_minimal.py > /tmp/tpot_inside.out 2>&1 || true
kill $POLL_PID 2>/dev/null || true

echo "== tpot output =="
tail -n 200 /tmp/tpot_inside.out || true

echo "== last procs snapshot =="
tail -n 400 /tmp/procs.log || true
