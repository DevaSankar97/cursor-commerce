#!/bin/bash

# JioMart Clone Deployment Script
# Usage: ./deploy.sh [environment] [platform]
# Example: ./deploy.sh production aws

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-staging}
PLATFORM=${2:-docker}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Configuration
IMAGE_NAME="jiomart/jiomart-clone"
IMAGE_TAG="${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    command -v docker >/dev/null 2>&1 || log_error "Docker is required but not installed"
    command -v docker-compose >/dev/null 2>&1 || log_error "Docker Compose is required but not installed"
    
    if [[ "$PLATFORM" == "aws" ]]; then
        command -v aws >/dev/null 2>&1 || log_error "AWS CLI is required but not installed"
    elif [[ "$PLATFORM" == "gcp" ]]; then
        command -v gcloud >/dev/null 2>&1 || log_error "Google Cloud CLI is required but not installed"
    fi
    
    log_success "All dependencies are available"
}

load_environment() {
    log_info "Loading environment configuration for $ENVIRONMENT..."
    
    ENV_FILE="$PROJECT_ROOT/deployment/env/.env.$ENVIRONMENT"
    if [[ -f "$ENV_FILE" ]]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
        log_success "Environment configuration loaded"
    else
        log_warning "Environment file not found: $ENV_FILE"
        log_warning "Using default environment variables"
    fi
}

build_application() {
    log_info "Building application..."
    
    cd "$PROJECT_ROOT"
    
    # Build Docker image
    log_info "Building Docker image: $IMAGE_NAME:$IMAGE_TAG"
    docker build -t "$IMAGE_NAME:$IMAGE_TAG" -t "$IMAGE_NAME:latest" .
    
    log_success "Application built successfully"
}

run_tests() {
    log_info "Running tests..."
    
    # Run client tests
    log_info "Running client tests..."
    cd "$PROJECT_ROOT/client"
    npm test -- --coverage --watchAll=false
    
    # Run server tests
    log_info "Running server tests..."
    cd "$PROJECT_ROOT/server"
    npm test
    
    log_success "All tests passed"
}

deploy_docker() {
    log_info "Deploying with Docker Compose..."
    
    cd "$PROJECT_ROOT"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        docker-compose -f docker-compose.yml -f deployment/aws/docker-compose.prod.yml up -d
    else
        docker-compose up -d
    fi
    
    log_success "Application deployed with Docker Compose"
}

deploy_aws() {
    log_info "Deploying to AWS..."
    
    # Check AWS credentials
    aws sts get-caller-identity >/dev/null 2>&1 || log_error "AWS credentials not configured"
    
    # Deploy infrastructure with CloudFormation
    log_info "Deploying infrastructure..."
    aws cloudformation deploy \
        --template-file "$PROJECT_ROOT/deployment/aws/cloudformation.yml" \
        --stack-name "jiomart-$ENVIRONMENT" \
        --parameter-overrides \
            EnvironmentName="jiomart-$ENVIRONMENT" \
            DomainName="${DOMAIN_NAME:-your-domain.com}" \
        --capabilities CAPABILITY_IAM \
        --region "${AWS_REGION:-us-east-1}"
    
    # Build and push Docker image to ECR
    log_info "Building and pushing image to ECR..."
    
    # Get ECR login token
    aws ecr get-login-password --region "${AWS_REGION:-us-east-1}" | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION:-us-east-1}.amazonaws.com"
    
    # Create ECR repository if it doesn't exist
    aws ecr describe-repositories --repository-names jiomart-clone --region "${AWS_REGION:-us-east-1}" >/dev/null 2>&1 || \
        aws ecr create-repository --repository-name jiomart-clone --region "${AWS_REGION:-us-east-1}"
    
    # Tag and push image
    ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION:-us-east-1}.amazonaws.com/jiomart-clone"
    docker tag "$IMAGE_NAME:$IMAGE_TAG" "$ECR_URI:$IMAGE_TAG"
    docker tag "$IMAGE_NAME:$IMAGE_TAG" "$ECR_URI:latest"
    docker push "$ECR_URI:$IMAGE_TAG"
    docker push "$ECR_URI:latest"
    
    # Deploy ECS service
    log_info "Deploying ECS service..."
    # This would typically involve updating an ECS task definition and service
    # Implementation depends on your specific ECS setup
    
    log_success "Deployed to AWS successfully"
}

deploy_gcp() {
    log_info "Deploying to Google Cloud Platform..."
    
    # Check GCP authentication
    gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 >/dev/null 2>&1 || log_error "GCP credentials not configured"
    
    # Set project
    gcloud config set project "${GCP_PROJECT_ID}" || log_error "Failed to set GCP project"
    
    # Build and push to Container Registry
    log_info "Building and pushing image to Google Container Registry..."
    
    GCR_URI="gcr.io/${GCP_PROJECT_ID}/jiomart-clone"
    docker tag "$IMAGE_NAME:$IMAGE_TAG" "$GCR_URI:$IMAGE_TAG"
    docker tag "$IMAGE_NAME:$IMAGE_TAG" "$GCR_URI:latest"
    
    docker push "$GCR_URI:$IMAGE_TAG"
    docker push "$GCR_URI:latest"
    
    # Deploy to Cloud Run
    log_info "Deploying to Cloud Run..."
    gcloud run deploy jiomart-clone \
        --image="$GCR_URI:$IMAGE_TAG" \
        --platform=managed \
        --region="${GCP_REGION:-us-central1}" \
        --allow-unauthenticated \
        --port=5000 \
        --memory=1Gi \
        --cpu=1 \
        --max-instances=10 \
        --set-env-vars="NODE_ENV=$ENVIRONMENT" \
        --set-env-vars="MONGODB_URI=$MONGODB_URI" \
        --set-env-vars="JWT_SECRET=$JWT_SECRET"
    
    log_success "Deployed to Google Cloud Platform successfully"
}

cleanup() {
    log_info "Cleaning up..."
    
    # Remove old Docker images
    docker image prune -f
    
    log_success "Cleanup completed"
}

main() {
    log_info "Starting deployment process..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Platform: $PLATFORM"
    
    check_dependencies
    load_environment
    
    # Skip tests in development mode
    if [[ "$ENVIRONMENT" != "development" ]]; then
        run_tests
    fi
    
    build_application
    
    case "$PLATFORM" in
        "docker")
            deploy_docker
            ;;
        "aws")
            deploy_aws
            ;;
        "gcp")
            deploy_gcp
            ;;
        *)
            log_error "Unsupported platform: $PLATFORM"
            ;;
    esac
    
    cleanup
    
    log_success "Deployment completed successfully!"
    
    # Display access information
    if [[ "$PLATFORM" == "docker" ]]; then
        log_info "Application is running at: http://localhost:5000"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            echo "Usage: $0 [environment] [platform]"
            echo "Environments: development, staging, production"
            echo "Platforms: docker, aws, gcp"
            exit 0
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --no-cleanup)
            NO_CLEANUP=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Run main function
main