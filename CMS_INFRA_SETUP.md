# CMS Infrastructure Setup

## 1. Create Neon Postgres

- Create a Neon project/database.
- Copy the pooled Postgres connection string.
- Save it for Vercel as `DATABASE_URL`.
- Add it locally in `.env.local` when you are ready to migrate/import.

Then run:

```bash
npm run db:migrate
npm run microdoses:import-db
```

## 2. Create OAuth Apps

Pick GitHub, Google, or both.

GitHub OAuth apps:

- Production homepage URL: `https://www.coolmolecules.media`
- Production callback URL: `https://www.coolmolecules.media/api/auth/callback/github`
- Staging homepage URL: `https://dev.coolmolecules.media`
- Staging callback URL: `https://dev.coolmolecules.media/api/auth/callback/github`
- Staging www homepage URL: `https://www.dev.coolmolecules.media`
- Staging www callback URL: `https://www.dev.coolmolecules.media/api/auth/callback/github`

Use separate GitHub OAuth apps for production and staging if GitHub only lets
you set one callback URL on the app.

Google OAuth client:

- Authorized JavaScript origin: `https://www.coolmolecules.media`
- Dev JavaScript origin: `https://dev.coolmolecules.media`
- Dev www JavaScript origin: `https://www.dev.coolmolecules.media`
- Redirect URI: `https://www.coolmolecules.media/api/auth/callback/google`
- Dev redirect URI: `https://dev.coolmolecules.media/api/auth/callback/google`
- Dev www redirect URI: `https://www.dev.coolmolecules.media/api/auth/callback/google`

Set these in Vercel:

```bash
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ADMIN_ALLOWED_EMAILS=you@example.com,partner@example.com
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://www.coolmolecules.media
```

Generate `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

## 3. Bootstrap Terraform State In AWS

In AWS Console, create:

- S3 bucket for Terraform state, for example `cmmedia-terraform-state`
- DynamoDB table for locks:
  - name: `cmmedia-terraform-locks`
  - partition key: `LockID`
  - type: string

Enable bucket versioning on the state bucket.

These are for Terraform state, separate from the microdose audio bucket.

## 4. Bootstrap Terraform Once Locally

You need one initial AWS-authenticated local apply to create the app S3 bucket,
app IAM user, and GitHub OIDC role.

From `infra/terraform`:

```bash
terraform init \
  -backend-config="bucket=cmmedia-terraform-state" \
  -backend-config="key=cmm-website/terraform.tfstate" \
  -backend-config="region=us-east-2" \
  -backend-config="dynamodb_table=cmmedia-terraform-locks"
```

Then:

```bash
terraform apply \
  -var='enable_github_oidc=true' \
  -var='github_owner=YOUR_GITHUB_OWNER' \
  -var='github_repository=YOUR_REPO_NAME' \
  -var='terraform_state_bucket=cmmedia-terraform-state' \
  -var='terraform_lock_table=cmmedia-terraform-locks' \
  -var='admin_upload_origins=["http://localhost:3000","https://dev.coolmolecules.media","https://www.dev.coolmolecules.media","https://coolmolecules.media","https://www.coolmolecules.media"]'
```

After apply, capture:

- `audio_bucket_name`
- `app_audio_access_key_id`
- `app_audio_secret_access_key`
- `github_terraform_role_arn`

## 5. Configure Vercel Env Vars

In Vercel Project Settings -> Environment Variables:

Production:

```bash
DATABASE_URL=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://www.coolmolecules.media
ADMIN_ALLOWED_EMAILS=you@example.com,partner@example.com

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
# or Google equivalents

AWS_REGION=us-east-2
AWS_S3_BUCKET=<terraform audio_bucket_name>
AWS_ACCESS_KEY_ID=<terraform app_audio_access_key_id>
AWS_SECRET_ACCESS_KEY=<terraform app_audio_secret_access_key>
```

Preview/staging:

```bash
NEXTAUTH_URL=https://dev.coolmolecules.media
```

If you use the `www` staging domain as canonical instead, set:

```bash
NEXTAUTH_URL=https://www.dev.coolmolecules.media
```

Use the same remaining values as production for the first staging pass, or split
database/S3 later if you want stronger isolation.

For production transcription on Vercel, set:

```bash
ENABLE_VERCEL_TRANSCRIPTION=true
WHISPER_CPP_BIN=vercel-transcription/bin/whisper-cli
WHISPER_CPP_MODEL=vercel-transcription/models/ggml-tiny.en.bin
FFMPEG_BIN=
TRANSCRIPTION_QUEUE_MODE=
```

The build script downloads the Linux `whisper-cli` archive and the tiny English
ggml model when `ENABLE_VERCEL_TRANSCRIPTION=true`. Leave
`TRANSCRIPTION_QUEUE_MODE` blank in production so jobs use Vercel Queues. Use
`TRANSCRIPTION_QUEUE_MODE=inline` only for local testing.

## 6. Configure GitHub Actions

In GitHub repo settings, add this secret:

```bash
AWS_TERRAFORM_ROLE_ARN=arn:aws:iam::...:role/cmm-website-github-terraform
```

Add these variables:

```bash
AWS_REGION=us-east-2
TF_STATE_BUCKET=cmmedia-terraform-state
TF_STATE_KEY=cmm-website/terraform.tfstate
TF_LOCK_TABLE=cmmedia-terraform-locks
```

Create a GitHub Environment named `production`, ideally with required reviewers,
so Terraform apply is gated.

## 7. Connect Vercel Git Deploys

In Vercel:

- Import/connect the GitHub repo.
- Set production branch to `main`.
- Let Vercel handle app deploys.
- Let GitHub Actions handle CI and Terraform.

Vercel docs:

- https://vercel.com/docs/git
- https://vercel.com/docs/environment-variables

## 8. Production Migration

After env vars are set:

```bash
npm run db:migrate
npm run microdoses:import-db
```

Run these manually against production Neon for the first migration so results
can be inspected.

## 9. Smoke Test

- Visit `/admin/login`.
- Sign in with OAuth.
- Confirm `/admin` loads.
- Confirm imported records appear.
- Open `/microdoses`.
- Publish/unpublish one draft and confirm public visibility changes without deploy.
- Upload one small audio file and confirm it lands in private S3.

## Content Directory

Keep `content/` until the DB-backed production flow is verified. After that, we
can remove JSON fallback and delete `content/` in a cleanup pass.
