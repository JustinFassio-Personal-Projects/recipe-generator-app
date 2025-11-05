#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Recipe Generator Development Servers...${NC}"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env.local file not found${NC}"
    echo "Please create .env.local with your OPENAI_API_KEY"
    exit 1
fi

# Kill any existing processes on ports 5174 and 3000
echo "Cleaning up existing processes..."
pkill -9 -f "vercel dev" 2>/dev/null || true
pkill -9 -f "vite" 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

echo ""
echo -e "${BLUE}NOTE: You have TWO options for local development:${NC}"
echo ""
echo -e "${GREEN}Option 1 (Recommended): ${NC}Just run 'vercel dev' and open http://localhost:3000"
echo -e "${GREEN}Option 2: ${NC}Run vite on 5174 + vercel dev on 3000 (requires two terminals)"
echo ""
echo -e "${BLUE}Using Option 1 now...${NC}"
echo ""

vercel dev > /tmp/vercel-dev.log 2>&1 &
VERCEL_PID=$!

# Don't wait - vercel dev handles both frontend and backend
echo -e "${GREEN}✅ Vercel dev server starting on http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}Access your app at: ${GREEN}http://localhost:3000${NC}"
echo ""
echo "Logs: tail -f /tmp/vercel-dev.log"

# Set dummy PID for cleanup
VITE_PID=$VERCEL_PID

echo ""
echo "Press Ctrl+C to stop the server"

# Function to kill both processes on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $VERCEL_PID 2>/dev/null || true
    kill $VITE_PID 2>/dev/null || true
    lsof -ti:5174 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    exit 0
}

trap cleanup EXIT INT TERM

# Wait indefinitely
wait
