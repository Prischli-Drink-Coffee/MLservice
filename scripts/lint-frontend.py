#!/usr/bin/env python3
"""Cross-platform frontend linting script."""
import os
import subprocess
import sys
from pathlib import Path

# Get the directory where this script is located
script_dir = Path(__file__).parent.absolute()
# Navigate to frontend directory
frontend_dir = script_dir.parent / "frontend"

# Change to frontend directory
os.chdir(frontend_dir)

# Run npm lint (shell=True needed for Windows to find npm)
result = subprocess.run(["npm", "run", "lint"], shell=True)
sys.exit(result.returncode)
