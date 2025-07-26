# JioMart Clone - Deployment Guide

This guide provides comprehensive instructions for deploying the JioMart clone e-commerce platform across different environments and cloud platforms.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Docker Deployment](#docker-deployment)
5. [AWS Deployment](#aws-deployment)
6. [Google Cloud Platform Deployment](#gcp-deployment)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Security Considerations](#security-considerations)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Operating System**: Linux (Ubuntu 20.04+), macOS, or Windows with WSL2
- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 10GB free space

### Required Software
- **Node.js**: v18.x or higher
- **npm**: v8.x or higher
- **Docker**: v20.10 or higher
- **Docker Compose**: v2.0 or higher
- **Git**: Latest version

### Cloud Platform Tools
- **AWS CLI**: v2.x (for AWS deployment)
- **Google Cloud SDK**: Latest (for GCP deployment)

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/jiomart-clone.git
cd jiomart-clone
```

### 2. Configure Environment Variables
Copy the appropriate environment template:

```bash
# For production
cp deployment/env/.env.production .env

# For staging
cp deployment/env/.env.staging .env

# For development
cp server/.env.example server/.env
```

Update the `.env` file with your actual configuration values.

### 3. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (client + server)
npm run install-all
```

## Local Development

### Quick Start
```bash
# Start both client and server in development mode
npm run dev
```

This will start:
- React development server on `http://localhost:3000`
- Node.js server on `http://localhost:5000`

### Individual Services
```bash
# Start only the server
npm run server

# Start only the client
npm run client
```

## Docker Deployment

### Development Environment
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Environment
```bash
# Using production configuration
docker-compose -f docker-compose.yml -f deployment/aws/docker-compose.prod.yml up -d
```

### Services Included
- **Application**: Main JioMart application
- **MongoDB**: Database service
- **Redis**: Caching and session storage
- **Nginx**: Reverse proxy and load balancer

## AWS Deployment

### Prerequisites
1. AWS Account with appropriate permissions
2. AWS CLI configured with credentials
3. Domain name (optional but recommended)

### Infrastructure Setup

#### 1. Deploy Infrastructure with CloudFormation
```bash
aws cloudformation deploy \
  --template-file deployment/aws/cloudformation.yml \
  --stack-name jiomart-production \
  --parameter-overrides \
    EnvironmentName=jiomart-prod \
    DomainName=yourdomain.com \
    KeyName=your-ec2-key-pair \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

#### 2. Set up MongoDB Atlas
1. Create a MongoDB Atlas cluster
2. Configure network access (whitelist AWS IPs)
3. Create database user
4. Update `MONGODB_URI` in environment variables

#### 3. Configure AWS Services
```bash
# Create ECR repository
aws ecr create-repository --repository-name jiomart-clone --region us-east-1

# Set up S3 bucket for uploads (if not using CloudFormation)
aws s3 mb s3://jiomart-prod-uploads-${AWS_ACCOUNT_ID}
```

### Application Deployment

#### Using Deployment Script
```bash
chmod +x deployment/scripts/deploy.sh
./deployment/scripts/deploy.sh production aws
```

#### Manual Deployment
```bash
# Build and push Docker image
docker build -t jiomart-clone .

# Tag for ECR
docker tag jiomart-clone:latest ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/jiomart-clone:latest

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/jiomart-clone:latest
```

### ECS Service Configuration
Create an ECS task definition and service using the AWS Console or CLI:

```json
{
  "family": "jiomart-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "jiomart-app",
      "image": "account.dkr.ecr.region.amazonaws.com/jiomart-clone:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "5000"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/aws/ecs/jiomart",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## Google Cloud Platform Deployment

### Prerequisites
1. GCP Account with billing enabled
2. Google Cloud SDK installed and configured
3. Docker configured for GCR

### Setup
```bash
# Set project
gcloud config set project your-project-id

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  cloudresourcemanager.googleapis.com
```

### Deployment
```bash
# Using deployment script
./deployment/scripts/deploy.sh production gcp

# Or manually
gcloud builds submit --tag gcr.io/your-project-id/jiomart-clone
gcloud run deploy jiomart-clone \
  --image gcr.io/your-project-id/jiomart-clone \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## CI/CD Pipeline

### GitHub Actions Setup

#### 1. Repository Secrets
Configure the following secrets in your GitHub repository:

**AWS Deployment:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `STAGING_MONGODB_URI`
- `PRODUCTION_MONGODB_URI`
- `STAGING_JWT_SECRET`
- `PRODUCTION_JWT_SECRET`

**Optional:**
- `SLACK_WEBHOOK` (for notifications)

#### 2. Workflow Triggers
The CI/CD pipeline triggers on:
- Push to `main` branch (production deployment)
- Push to `develop` branch (staging deployment)
- Pull requests to `main` branch (testing only)
- Manual workflow dispatch

#### 3. Pipeline Stages
1. **Test**: Run unit tests and linting
2. **Build**: Build and push Docker image
3. **Security Scan**: Vulnerability scanning with Trivy
4. **Deploy**: Deploy to staging/production
5. **Notify**: Send deployment notifications

### Manual Deployment
```bash
# Trigger deployment via GitHub CLI
gh workflow run deploy.yml -f environment=production -f platform=aws
```

## Security Considerations

### Environment Variables
- Never commit sensitive data to version control
- Use secrets management services (AWS Secrets Manager, etc.)
- Rotate secrets regularly

### Network Security
- Use HTTPS in production
- Configure proper CORS settings
- Implement rate limiting
- Use security headers (configured in Nginx)

### Application Security
- JWT tokens with short expiration
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Infrastructure Security
- Use IAM roles with minimal permissions
- Enable VPC and security groups
- Regular security updates
- Enable logging and monitoring

## Monitoring and Logging

### Application Monitoring
- **Logs**: Centralized logging with CloudWatch/Stackdriver
- **Metrics**: Custom application metrics
- **Error Tracking**: Sentry integration
- **Performance**: New Relic APM

### Infrastructure Monitoring
- **AWS CloudWatch**: System metrics and alarms
- **Google Cloud Monitoring**: Resource utilization
- **Uptime Monitoring**: External service monitoring

### Setting up Monitoring
```bash
# Install monitoring agents (example for AWS)
# CloudWatch agent configuration
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
```

## Troubleshooting

### Common Issues

#### Docker Build Failures
```bash
# Clear Docker cache
docker system prune -a

# Rebuild with no cache
docker build --no-cache -t jiomart-clone .
```

#### Database Connection Issues
- Verify MongoDB connection string
- Check network security groups/firewall rules
- Ensure database user has proper permissions

#### SSL Certificate Issues
```bash
# Generate self-signed certificates for testing
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout deployment/nginx/ssl/key.pem \
  -out deployment/nginx/ssl/cert.pem
```

#### Memory Issues
- Increase container memory limits
- Optimize application memory usage
- Use connection pooling for database

### Debugging Commands
```bash
# Check container logs
docker logs jiomart-app

# Check container health
docker inspect jiomart-app

# Access container shell
docker exec -it jiomart-app /bin/sh

# Check system resources
docker stats
```

### Performance Optimization
- Enable gzip compression
- Use CDN for static assets
- Implement Redis caching
- Database query optimization
- Image optimization

## Backup and Recovery

### Database Backup
```bash
# MongoDB backup
mongodump --uri="$MONGODB_URI" --out=/backup/$(date +%Y%m%d)

# Automated backup script
0 2 * * * /usr/local/bin/backup-script.sh
```

### Application Backup
- Regular code commits to version control
- Docker image versioning
- Configuration backup

## Scaling

### Horizontal Scaling
- Use load balancers (ALB, Cloud Load Balancing)
- Auto-scaling groups
- Container orchestration (ECS, Kubernetes)

### Vertical Scaling
- Increase instance/container resources
- Database scaling (read replicas)
- Redis clustering

## Support and Maintenance

### Regular Tasks
- Security updates
- Dependency updates
- Performance monitoring
- Backup verification
- Cost optimization

### Health Checks
- Application health endpoints
- Database connectivity
- External service availability
- SSL certificate expiration

For additional support, please refer to the project documentation or create an issue in the repository.