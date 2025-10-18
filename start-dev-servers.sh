#!/bin/bash

# start-dev-servers.sh - Start all development servers
# This script starts both Next.js and Deno in tmux sessions for easy management

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Starting NinoWash Development Servers${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo -e "${YELLOW}💡 tmux is not installed, will start servers directly${NC}"
    echo ""
    
    echo -e "${GREEN}Starting Next.js (http://localhost:3000)...${NC}"
    cd "$PROJECT_DIR"
    pnpm dev &
    NEXTJS_PID=$!
    
    sleep 3
    
    echo -e "${GREEN}Starting Deno (http://localhost:8000)...${NC}"
    deno task dev &
    DENO_PID=$!
    
    echo ""
    echo -e "${GREEN}✓ Both servers started!${NC}"
    echo ""
    echo "📝 Process IDs:"
    echo "  - Next.js: $NEXTJS_PID"
    echo "  - Deno:    $DENO_PID"
    echo ""
    echo "🛑 To stop servers, press Ctrl+C or run:"
    echo "  kill $NEXTJS_PID $DENO_PID"
    echo ""
    
    wait
else
    echo -e "${GREEN}Using tmux for cleaner terminal management${NC}"
    echo ""
    
    # Kill any existing session
    tmux kill-session -t ninoWash 2>/dev/null || true
    
    # Create new session with Next.js
    tmux new-session -d -s ninoWash -n nextjs -c "$PROJECT_DIR"
    tmux send-keys -t ninoWash:nextjs "pnpm dev" Enter
    
    # Add Deno window
    tmux new-window -t ninoWash -n deno -c "$PROJECT_DIR"
    tmux send-keys -t ninoWash:deno "deno task dev" Enter
    
    echo -e "${GREEN}✓ Servers started in tmux session 'ninoWash'${NC}"
    echo ""
    echo "📝 Access servers at:"
    echo "  - Next.js:  http://localhost:3000"
    echo "  - Deno:     http://localhost:8000"
    echo ""
    echo "🖥️  Terminal windows:"
    echo "  - Next.js:  tmux attach -t ninoWash:nextjs"
    echo "  - Deno:     tmux attach -t ninoWash:deno"
    echo ""
    echo "📋 All windows:"
    echo "  - tmux attach -t ninoWash"
    echo ""
    echo "🛑 Stop all servers:"
    echo "  - tmux kill-session -t ninoWash"
    echo ""
    
    # Attach to the session
    tmux attach -t ninoWash
fi
