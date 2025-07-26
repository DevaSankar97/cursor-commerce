#!/bin/bash

# JioMart Clone Deployment Validation Script
# Usage: ./validate.sh

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local errors=0
    
    # Check Node.js
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        log_success "Node.js found: $node_version"
    else
        log_error "Node.js is not installed"
        ((errors++))
    fi
    
    # Check npm
    if command -v npm >/dev/null 2>&1; then
        local npm_version=$(npm --version)
        log_success "npm found: v$npm_version"
    else
        log_error "npm is not installed"
        ((errors++))
    fi
    
    # Check Docker
    if command -v docker >/dev/null 2>&1; then
        local docker_version=$(docker --version)
        log_success "Docker found: $docker_version"
    else
        log_error "Docker is not installed"
        ((errors++))
    fi
    
    # Check Docker Compose
    if command -v docker-compose >/dev/null 2>&1; then
        local compose_version=$(docker-compose --version)
        log_success "Docker Compose found: $compose_version"
    else
        log_error "Docker Compose is not installed"
        ((errors++))
    fi
    
    return $errors
}

check_project_structure() {
    log_info "Checking project structure..."
    
    local errors=0
    
    # Required files
    local required_files=(
        "package.json"
        "Dockerfile"
        "docker-compose.yml"
        ".gitignore"
        "client/package.json"
        "server/package.json"
        "server/server.js"
        "deployment/scripts/deploy.sh"
        "deployment/nginx/nginx.conf"
        "deployment/aws/cloudformation.yml"
    )
    
    for file in "${required_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            log_success "Found: $file"
        else
            log_error "Missing: $file"
            ((errors++))
        fi
    done
    
    return $errors
}

check_docker_configuration() {
    log_info "Validating Docker configuration..."
    
    local errors=0
    
    # Check Dockerfile syntax
    if docker build -f "$PROJECT_ROOT/Dockerfile" --dry-run "$PROJECT_ROOT" >/dev/null 2>&1; then
        log_success "Dockerfile syntax is valid"
    else
        log_error "Dockerfile has syntax errors"
        ((errors++))
    fi
    
    # Check Docker Compose syntax
    if docker-compose -f "$PROJECT_ROOT/docker-compose.yml" config >/dev/null 2>&1; then
        log_success "Docker Compose configuration is valid"
    else
        log_error "Docker Compose configuration has errors"
        ((errors++))
    fi
    
    return $errors
}

check_dependencies() {
    log_info "Checking project dependencies..."
    
    local errors=0
    
    # Check client dependencies
    if [[ -f "$PROJECT_ROOT/client/package.json" ]]; then
        cd "$PROJECT_ROOT/client"
        if npm ls >/dev/null 2>&1; then
            log_success "Client dependencies are properly installed"
        else
            log_warning "Client dependencies may have issues"
        fi
    fi
    
    # Check server dependencies
    if [[ -f "$PROJECT_ROOT/server/package.json" ]]; then
        cd "$PROJECT_ROOT/server"
        if npm ls >/dev/null 2>&1; then
            log_success "Server dependencies are properly installed"
        else
            log_warning "Server dependencies may have issues"
        fi
    fi
    
    cd "$PROJECT_ROOT"
    return $errors
}

check_environment_files() {
    log_info "Checking environment configuration..."
    
    local errors=0
    
    # Check environment templates
    local env_files=(
        "deployment/env/.env.production"
        "deployment/env/.env.staging"
        "server/.env.example"
    )
    
    for env_file in "${env_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$env_file" ]]; then
            log_success "Found: $env_file"
        else
            log_error "Missing: $env_file"
            ((errors++))
        fi
    done
    
    return $errors
}

check_deployment_scripts() {
    log_info "Checking deployment scripts..."
    
    local errors=0
    
    # Check deploy script
    if [[ -x "$PROJECT_ROOT/deployment/scripts/deploy.sh" ]]; then
        log_success "Deployment script is executable"
    else
        log_error "Deployment script is not executable"
        ((errors++))
    fi
    
    # Check health check script
    if [[ -f "$PROJECT_ROOT/server/healthcheck.js" ]]; then
        log_success "Health check script found"
    else
        log_error "Health check script missing"
        ((errors++))
    fi
    
    return $errors
}

check_cloud_tools() {
    log_info "Checking cloud deployment tools..."
    
    local warnings=0
    
    # Check AWS CLI
    if command -v aws >/dev/null 2>&1; then
        local aws_version=$(aws --version 2>&1 | cut -d' ' -f1)
        log_success "AWS CLI found: $aws_version"
    else
        log_warning "AWS CLI not found (required for AWS deployment)"
        ((warnings++))
    fi
    
    # Check Google Cloud SDK
    if command -v gcloud >/dev/null 2>&1; then
        local gcloud_version=$(gcloud version --format="value(Google Cloud SDK)" 2>/dev/null)
        log_success "Google Cloud SDK found: $gcloud_version"
    else
        log_warning "Google Cloud SDK not found (required for GCP deployment)"
        ((warnings++))
    fi
    
    if [[ $warnings -gt 0 ]]; then
        log_warning "Some cloud tools are missing. Install them if you plan to deploy to those platforms."
    fi
    
    return 0
}

run_basic_tests() {
    log_info "Running basic validation tests..."
    
    local errors=0
    
    # Test client build (if dependencies are installed)
    if [[ -d "$PROJECT_ROOT/client/node_modules" ]]; then
        cd "$PROJECT_ROOT/client"
        if npm run build >/dev/null 2>&1; then
            log_success "Client builds successfully"
        else
            log_error "Client build failed"
            ((errors++))
        fi
    else
        log_warning "Client dependencies not installed, skipping build test"
    fi
    
    # Test server syntax
    if [[ -f "$PROJECT_ROOT/server/server.js" ]]; then
        if node -c "$PROJECT_ROOT/server/server.js" 2>/dev/null; then
            log_success "Server syntax is valid"
        else
            log_error "Server has syntax errors"
            ((errors++))
        fi
    fi
    
    cd "$PROJECT_ROOT"
    return $errors
}

generate_deployment_checklist() {
    log_info "Generating deployment checklist..."
    
    cat << EOF

📋 Pre-Deployment Checklist:

Environment Configuration:
[ ] Update MongoDB connection string
[ ] Configure JWT secrets
[ ] Set up Cloudinary credentials
[ ] Configure email service
[ ] Set up payment gateway keys
[ ] Configure domain name

Cloud Platform Setup:
[ ] AWS: Configure CLI and create ECR repository
[ ] GCP: Enable APIs and configure authentication
[ ] GitHub: Add repository secrets for CI/CD

Security Setup:
[ ] Generate SSL certificates
[ ] Configure firewall rules
[ ] Set up monitoring and alerting
[ ] Enable backup procedures

Testing:
[ ] Test locally with Docker Compose
[ ] Run security scans
[ ] Perform load testing
[ ] Validate all integrations

EOF
}

main() {
    echo "=============================================="
    echo "    JioMart Clone Deployment Validation"
    echo "=============================================="
    echo
    
    local total_errors=0
    
    check_prerequisites || ((total_errors+=$?))
    echo
    
    check_project_structure || ((total_errors+=$?))
    echo
    
    check_docker_configuration || ((total_errors+=$?))
    echo
    
    check_dependencies || ((total_errors+=$?))
    echo
    
    check_environment_files || ((total_errors+=$?))
    echo
    
    check_deployment_scripts || ((total_errors+=$?))
    echo
    
    check_cloud_tools
    echo
    
    run_basic_tests || ((total_errors+=$?))
    echo
    
    echo "=============================================="
    if [[ $total_errors -eq 0 ]]; then
        log_success "✅ All validation checks passed!"
        log_success "Your JioMart clone is ready for deployment!"
        echo
        log_info "Quick deployment commands:"
        echo "  Local:      docker-compose up -d"
        echo "  AWS:        ./deployment/scripts/deploy.sh production aws"
        echo "  GCP:        ./deployment/scripts/deploy.sh production gcp"
    else
        log_error "❌ Validation failed with $total_errors error(s)"
        log_error "Please fix the issues above before deploying"
    fi
    echo "=============================================="
    
    generate_deployment_checklist
    
    exit $total_errors
}

# Run main function
main