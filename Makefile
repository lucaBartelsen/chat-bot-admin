.PHONY: help setup build deploy start stop restart logs clean dev test lint format check status update-nginx backup restore

# Project configuration
PROJECT_NAME = fanfix-chatassist-frontend
DOCKER_IMAGE = $(PROJECT_NAME)
DOCKER_TAG = latest
CONTAINER_NAME = fanfix-frontend
NGINX_CONTAINER = fanfix-api-nginx-1
BACKEND_NETWORK = fanfix-api_default
DOMAIN = chatsassistant.com
API_URL = https://$(DOMAIN)/api

# Colors for better output
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
BLUE = \033[0;34m
NC = \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

# Help target
help: ## Show this help message
	@echo "$(GREEN)$(PROJECT_NAME)$(NC) - Available commands:"
	@echo ""
	@echo "$(YELLOW)Development Commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E "(dev|test|lint|format)" | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Docker Commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E "(build|deploy|start|stop|restart)" | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Maintenance Commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E "(logs|clean|status|setup)" | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Infrastructure Commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E "(update-nginx|backup|restore)" | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

# Development commands
setup: ## Setup development environment
	@echo "$(GREEN)Setting up development environment...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating .env file from template...$(NC)"; \
		cp .env.example .env; \
		echo "$(YELLOW)Please edit .env file with your configuration$(NC)"; \
	fi
	@if [ ! -f package-lock.json ]; then \
		echo "$(GREEN)Installing dependencies...$(NC)"; \
		npm install; \
	fi
	@echo "$(GREEN)✅ Setup complete!$(NC)"

dev: setup ## Start development server
	@echo "$(GREEN)Starting development server...$(NC)"
	npm run dev

test: ## Run tests
	@echo "$(GREEN)Running tests...$(NC)"
	npm test

lint: ## Run linting
	@echo "$(GREEN)Running linter...$(NC)"
	npm run lint

format: ## Format code
	@echo "$(GREEN)Formatting code...$(NC)"
	npm run format || npx prettier --write .

check: lint ## Run all checks (lint + test)
	@echo "$(GREEN)Running all checks...$(NC)"
	@$(MAKE) test

# Docker commands
build: ## Build Docker image
	@echo "$(GREEN)Building Docker image...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED)Error: .env file not found. Run 'make setup' first.$(NC)"; \
		exit 1; \
	fi
	@set -a && . ./.env && set +a && docker build \
		--build-arg NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-$(API_URL)} \
		-t $(DOCKER_IMAGE):$(DOCKER_TAG) \
		.
	@echo "$(GREEN)✅ Image built successfully!$(NC)"

deploy: build ## Deploy frontend to production
	@echo "$(GREEN)Deploying frontend to production...$(NC)"
	@echo "$(BLUE)Checking backend network...$(NC)"
	@if ! docker network ls | grep -q $(BACKEND_NETWORK); then \
		echo "$(RED)Error: Backend network '$(BACKEND_NETWORK)' not found!$(NC)"; \
		echo "$(YELLOW)Available networks:$(NC)"; \
		docker network ls; \
		exit 1; \
	fi
	@echo "$(BLUE)Stopping existing container...$(NC)"
	@docker stop $(CONTAINER_NAME) 2>/dev/null || true
	@docker rm $(CONTAINER_NAME) 2>/dev/null || true
	@echo "$(BLUE)Starting new container...$(NC)"
	@set -a && . ./.env && set +a && docker run -d \
		--name $(CONTAINER_NAME) \
		--network $(BACKEND_NETWORK) \
		--restart unless-stopped \
		-e NODE_ENV=production \
		-e NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-$(API_URL)} \
		$(DOCKER_IMAGE):$(DOCKER_TAG)
	@echo "$(BLUE)Waiting for container to be ready...$(NC)"
	@sleep 10
	@if docker ps | grep -q $(CONTAINER_NAME); then \
		echo "$(GREEN)✅ Frontend deployed successfully!$(NC)"; \
		echo "$(YELLOW)Next steps:$(NC)"; \
		echo "  1. Run 'make update-nginx' to update nginx configuration"; \
		echo "  2. Test at https://$(DOMAIN)"; \
	else \
		echo "$(RED)❌ Deployment failed!$(NC)"; \
		echo "$(YELLOW)Checking logs...$(NC)"; \
		docker logs $(CONTAINER_NAME); \
		exit 1; \
	fi

start: ## Start existing container
	@echo "$(GREEN)Starting frontend container...$(NC)"
	@docker start $(CONTAINER_NAME) || echo "$(RED)Container not found. Run 'make deploy' first.$(NC)"

stop: ## Stop frontend container
	@echo "$(GREEN)Stopping frontend container...$(NC)"
	@docker stop $(CONTAINER_NAME) 2>/dev/null || echo "$(YELLOW)Container not running$(NC)"

restart: ## Restart frontend container
	@echo "$(GREEN)Restarting frontend container...$(NC)"
	@docker restart $(CONTAINER_NAME) || echo "$(RED)Container not found. Run 'make deploy' first.$(NC)"

# Maintenance commands
logs: ## Show container logs
	@echo "$(GREEN)Showing frontend logs...$(NC)"
	@docker logs -f $(CONTAINER_NAME) 2>/dev/null || echo "$(RED)Container not found$(NC)"

logs-tail: ## Show last 100 lines of logs
	@echo "$(GREEN)Showing last 100 lines of logs...$(NC)"
	@docker logs --tail=100 $(CONTAINER_NAME) 2>/dev/null || echo "$(RED)Container not found$(NC)"

status: ## Show deployment status
	@echo "$(GREEN)Deployment Status:$(NC)"
	@echo ""
	@echo "$(BLUE)Frontend Container:$(NC)"
	@if docker ps | grep -q $(CONTAINER_NAME); then \
		echo "  Status: $(GREEN)Running$(NC)"; \
		docker ps | grep $(CONTAINER_NAME) | awk '{print "  Container: " $$1 "\n  Image: " $$2 "\n  Ports: " $$6}'; \
	else \
		echo "  Status: $(RED)Not Running$(NC)"; \
	fi
	@echo ""
	@echo "$(BLUE)Backend Network:$(NC)"
	@if docker network ls | grep -q $(BACKEND_NETWORK); then \
		echo "  Network: $(GREEN)Available$(NC)"; \
	else \
		echo "  Network: $(RED)Not Found$(NC)"; \
	fi
	@echo ""
	@echo "$(BLUE)Nginx Container:$(NC)"
	@if docker ps | grep -q nginx; then \
		echo "  Status: $(GREEN)Running$(NC)"; \
		docker ps | grep nginx | awk '{print "  Container: " $$1}'; \
	else \
		echo "  Status: $(RED)Not Running$(NC)"; \
	fi
	@echo ""
	@echo "$(BLUE)Docker Images:$(NC)"
	@docker images | grep $(PROJECT_NAME) || echo "  No images found"

clean: ## Clean up Docker resources
	@echo "$(GREEN)Cleaning up Docker resources...$(NC)"
	@echo "$(BLUE)Stopping containers...$(NC)"
	@docker stop $(CONTAINER_NAME) 2>/dev/null || true
	@echo "$(BLUE)Removing containers...$(NC)"
	@docker rm $(CONTAINER_NAME) 2>/dev/null || true
	@echo "$(BLUE)Removing images...$(NC)"
	@docker rmi $(DOCKER_IMAGE):$(DOCKER_TAG) 2>/dev/null || true
	@echo "$(BLUE)Cleaning unused resources...$(NC)"
	@docker system prune -f
	@echo "$(GREEN)✅ Cleanup complete!$(NC)"

# Infrastructure commands
update-nginx: ## Update nginx configuration and restart
	@echo "$(GREEN)Updating nginx configuration...$(NC)"
	@if [ ! -f nginx/conf.d/default.conf ]; then \
		echo "$(RED)Error: nginx/conf.d/default.conf not found!$(NC)"; \
		echo "$(YELLOW)Please ensure the unified nginx config is in place$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Restarting nginx container...$(NC)"
	@docker restart $(NGINX_CONTAINER) || echo "$(RED)Failed to restart nginx container$(NC)"
	@echo "$(GREEN)✅ Nginx updated and restarted!$(NC)"

backup: ## Backup current deployment
	@echo "$(GREEN)Creating deployment backup...$(NC)"
	@mkdir -p backups
	@timestamp=$$(date +%Y%m%d_%H%M%S); \
	backup_file="backups/frontend_backup_$$timestamp.tar.gz"; \
	echo "$(BLUE)Creating backup: $$backup_file$(NC)"; \
	tar -czf $$backup_file \
		--exclude=node_modules \
		--exclude=.next \
		--exclude=backups \
		. && \
	echo "$(GREEN)✅ Backup created: $$backup_file$(NC)"

restore: ## Restore from backup (requires BACKUP_FILE variable)
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "$(RED)Error: Please specify BACKUP_FILE$(NC)"; \
		echo "$(YELLOW)Usage: make restore BACKUP_FILE=backups/frontend_backup_20231201_120000.tar.gz$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Restoring from backup: $(BACKUP_FILE)$(NC)"
	@echo "$(RED)⚠️  This will overwrite current files!$(NC)"
	@read -p "Continue? (y/N): " confirm && [ "$$confirm" = "y" ]
	@tar -xzf $(BACKUP_FILE) && echo "$(GREEN)✅ Restore complete!$(NC)"

# Network management
network-create: ## Create backend network if it doesn't exist
	@echo "$(GREEN)Creating backend network...$(NC)"
	@docker network create $(BACKEND_NETWORK) 2>/dev/null || echo "$(YELLOW)Network already exists$(NC)"

network-info: ## Show network information
	@echo "$(GREEN)Network Information:$(NC)"
	@docker network ls | head -1
	@docker network ls | grep -E "($(BACKEND_NETWORK)|fanfix)" || echo "$(YELLOW)No matching networks found$(NC)"

# Quick deployment targets
quick-deploy: stop build start ## Quick redeploy (stop, build, start)
	@echo "$(GREEN)✅ Quick deployment complete!$(NC)"

full-deploy: clean deploy update-nginx ## Full deployment (clean, deploy, update nginx)
	@echo "$(GREEN)🎉 Full deployment complete!$(NC)"
	@echo "$(YELLOW)Frontend should be available at: https://$(DOMAIN)$(NC)"

# Development helpers
shell: ## Open shell in running container
	@echo "$(GREEN)Opening shell in frontend container...$(NC)"
	@docker exec -it $(CONTAINER_NAME) /bin/sh || echo "$(RED)Container not running$(NC)"

inspect: ## Inspect container configuration
	@echo "$(GREEN)Container inspection:$(NC)"
	@docker inspect $(CONTAINER_NAME) 2>/dev/null || echo "$(RED)Container not found$(NC)"

health: ## Check container health
	@echo "$(GREEN)Container health check:$(NC)"
	@docker exec $(CONTAINER_NAME) wget --quiet --tries=1 --spider http://localhost:3000 2>/dev/null && \
		echo "$(GREEN)✅ Container is healthy$(NC)" || \
		echo "$(RED)❌ Container is unhealthy$(NC)"