#!/bin/bash
set -e

# Configuration
APP_NAME="ultralearn"
REGION="us-central1" # Default region
DB_INSTANCE_NAME="${APP_NAME}-db"
DB_NAME="${APP_NAME}"
REPO_NAME="${APP_NAME}-repo"
ACTIONS_SA_NAME="github-actions-${APP_NAME}"
RUNTIME_SA_NAME="${APP_NAME}-runtime"

echo "========================================================"
echo "   UltraLearn GCP Setup Script"
echo "========================================================"
echo ""

# 1. Project Setup
echo "Enter your Google Cloud Project ID:"
read PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
  echo "Project ID is required."
  exit 1
fi

gcloud config set project $PROJECT_ID

echo "Enter the region you want to deploy to (default: $REGION):"
read INPUT_REGION
if [ ! -z "$INPUT_REGION" ]; then
  REGION=$INPUT_REGION
fi

# 2. Enable APIs
echo "Enabling necessary APIs..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  compute.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  cloudbuild.googleapis.com

# 3. Create Artifact Registry
echo "Creating Artifact Registry repository '$REPO_NAME'..."
if ! gcloud artifacts repositories describe $REPO_NAME --location=$REGION > /dev/null 2>&1; then
  gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for UltraLearn"
else
  echo "Repository '$REPO_NAME' already exists."
fi

# 4. Cloud SQL Setup
echo "Setting up Cloud SQL..."
echo "Enter a strong password for the database user 'postgres':"
read -s DB_PASSWORD

if ! gcloud sql instances describe $DB_INSTANCE_NAME > /dev/null 2>&1; then
  echo "Creating Cloud SQL instance (this may take a few minutes)..."
  # Using db-f1-micro for cost saving, upgrade for production
  gcloud sql instances create $DB_INSTANCE_NAME \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=$REGION \
    --root-password=$DB_PASSWORD
else
  echo "Cloud SQL instance '$DB_INSTANCE_NAME' already exists."
fi

echo "Creating database '$DB_NAME'..."
if ! gcloud sql databases describe $DB_NAME --instance=$DB_INSTANCE_NAME > /dev/null 2>&1; then
  gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE_NAME
else
  echo "Database '$DB_NAME' already exists."
fi

# Construct Connection Name
INSTANCE_CONNECTION_NAME="${PROJECT_ID}:${REGION}:${DB_INSTANCE_NAME}"
# Connection String for Cloud Run (Unix Socket)
DATABASE_URL_Internal="postgresql://postgres:${DB_PASSWORD}@localhost/${DB_NAME}?host=/cloudsql/${INSTANCE_CONNECTION_NAME}"

# 5. Service Accounts

# 5a. Create Runtime Service Account (runs the app)
echo "Creating Runtime Service Account..."
if ! gcloud iam service-accounts describe "${RUNTIME_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" > /dev/null 2>&1; then
  gcloud iam service-accounts create $RUNTIME_SA_NAME \
    --display-name="Runtime SA for UltraLearn"
else
  echo "Service Account '$RUNTIME_SA_NAME' already exists."
fi
RUNTIME_SA_EMAIL="${RUNTIME_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant permissions to Runtime SA
echo "Granting permissions to Runtime SA..."
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:${RUNTIME_SA_EMAIL}" --role="roles/secretmanager.secretAccessor"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:${RUNTIME_SA_EMAIL}" --role="roles/cloudsql.client"

# 5b. Create GitHub Actions Service Account (deploys the app)
echo "Creating GitHub Actions Service Account..."
if ! gcloud iam service-accounts describe "${ACTIONS_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" > /dev/null 2>&1; then
  gcloud iam service-accounts create $ACTIONS_SA_NAME \
    --display-name="GitHub Actions for UltraLearn"
else
  echo "Service Account '$ACTIONS_SA_NAME' already exists."
fi
ACTIONS_SA_EMAIL="${ACTIONS_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant permissions to GitHub Actions SA
echo "Granting permissions to GitHub Actions SA..."
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:${ACTIONS_SA_EMAIL}" --role="roles/run.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:${ACTIONS_SA_EMAIL}" --role="roles/storage.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:${ACTIONS_SA_EMAIL}" --role="roles/artifactregistry.writer"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:${ACTIONS_SA_EMAIL}" --role="roles/iam.serviceAccountUser" # To act as default compute SA if needed

# Allow GitHub Actions SA to impersonate Runtime SA
gcloud iam service-accounts add-iam-policy-binding $RUNTIME_SA_EMAIL \
    --member="serviceAccount:${ACTIONS_SA_EMAIL}" \
    --role="roles/iam.serviceAccountUser"

echo "Generating Key for GitHub Actions..."
if [ -f "gcp-sa-key.json" ]; then
    rm gcp-sa-key.json
fi
gcloud iam service-accounts keys create gcp-sa-key.json --iam-account=$ACTIONS_SA_EMAIL

# 6. Create Secrets
echo "Creating Secrets in Secret Manager..."

create_secret() {
  local KEY=$1
  local VAL=$2

  if ! gcloud secrets describe $KEY > /dev/null 2>&1; then
    echo -n "$VAL" | gcloud secrets create $KEY --replication-policy="automatic" --data-file=-
  else
    echo "Secret '$KEY' already exists. Updating version..."
    echo -n "$VAL" | gcloud secrets versions add $KEY --data-file=-
  fi
}

# Prompt for secrets
SECRETS=(
  "OPENROUTER_API_KEY"
  "GOOGLE_AI_API_KEY"
  "STABILITY_AI_API_KEY"
  "RUNWARE_API_KEY"
  "NEXTAUTH_SECRET"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "STRIPE_PRO_MONTHLY_PRICE_ID"
  "STRIPE_PRO_YEARLY_PRICE_ID"
  "STRIPE_LIFETIME_PRICE_ID"
)

# Store DATABASE_URL automatically
echo "Storing DATABASE_URL..."
create_secret "DATABASE_URL" "$DATABASE_URL_Internal"

echo "Storing NEXTAUTH_URL placeholder..."
create_secret "NEXTAUTH_URL" "http://localhost:3000"

echo "Storing NEXT_PUBLIC_APP_URL placeholder..."
create_secret "NEXT_PUBLIC_APP_URL" "http://localhost:3000"


echo "Now we will configure the other secrets. Press Enter to skip (you can edit them in GCP Console later)."

for SECRET_NAME in "${SECRETS[@]}"; do
  echo "Enter value for $SECRET_NAME:"
  read SECRET_VALUE
  if [ ! -z "$SECRET_VALUE" ]; then
    create_secret "$SECRET_NAME" "$SECRET_VALUE"
  else
    if ! gcloud secrets describe $SECRET_NAME > /dev/null 2>&1; then
        echo "Creating placeholder for $SECRET_NAME..."
        create_secret "$SECRET_NAME" "CHANGE_ME"
    fi
  fi
done


echo ""
echo "========================================================"
echo "   Setup Complete!"
echo "========================================================"
echo ""
echo "Action Items:"
echo "1. Go to your GitHub Repository > Settings > Secrets and variables > Actions."
echo "2. Add the following repository secrets:"
echo "   - GCP_PROJECT_ID: $PROJECT_ID"
echo "   - GCP_SA_KEY: (Copy content of 'gcp-sa-key.json')"
echo "   - GCP_SQL_INSTANCE_NAME: $INSTANCE_CONNECTION_NAME"
echo "   - GCP_SA_EMAIL: $RUNTIME_SA_EMAIL"
echo ""
echo "3. Update your Secret Manager values for 'NEXTAUTH_URL' and 'NEXT_PUBLIC_APP_URL' once deployed."
echo ""
echo "4. Delete 'gcp-sa-key.json' after adding to GitHub."
echo "   rm gcp-sa-key.json"
echo ""
