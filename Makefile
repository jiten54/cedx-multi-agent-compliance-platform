# Makefile for CEDX Tiny Multi-Agent Fleet Workspace
# CASE_ID: CEDX-55BBED

.PHONY: init build run dev clean verify docker-up docker-down

# Initialize dependencies
init:
	npm install

# Build static assets and server.ts CJS target
build:
	npm run build

# Run production build locally
run:
	npm run start

# Start TypeScript tsx watch development server on port 3000
dev:
	npm run dev

# Clean output build folders
clean:
	npm run clean

# Run python compliance auditor verify script against generated audit log
verify:
	python3 verify_audit.py assets/audit.json

# Launch full stack multi-agent system via docker compose
docker-up:
	docker compose up --build -d

# Terminate full stack containers
docker-down:
	docker compose down
