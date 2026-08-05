# Microdose Admin CMS

## Environment

Required for admin production:

- `DATABASE_URL`: Neon/Postgres connection string.
- `NEXTAUTH_SECRET`: random secret for admin sessions.
- `NEXTAUTH_URL`: deployed app URL.
- `ADMIN_ALLOWED_EMAILS`: comma-separated allowlist for the two admin users.
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`: GitHub OAuth admin login.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: optional Google OAuth admin login.
- `AWS_REGION`: S3 bucket region.
- `AWS_S3_BUCKET`: private audio bucket name.
- `AWS_ACCESS_KEY_ID`: app IAM access key from Terraform output.
- `AWS_SECRET_ACCESS_KEY`: app IAM secret from Terraform output.

Optional local or break-glass password auth:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ENABLE_ADMIN_PASSWORD_AUTH=true`

Password auth is disabled in production unless explicitly enabled.

Required for Vercel-native transcription spike:

- `ENABLE_VERCEL_TRANSCRIPTION=true`: downloads and bundles transcription assets
  during Vercel builds.
- `WHISPER_CPP_BIN`: path to the deployed whisper.cpp binary.
- `WHISPER_CPP_MODEL`: path to the deployed ggml model.
- `FFMPEG_BIN`: optional, defaults to `ffmpeg`.
- `TRANSCRIPTION_QUEUE_MODE=inline`: optional local-only mode for testing the
  full transcription processor without Vercel Queues.
- `VERCEL_WHISPER_CPP_URL`: optional build-time override for the Linux
  `whisper-cli` archive.
- `VERCEL_WHISPER_MODEL_NAME`: optional build-time model selector, defaults to
  `tiny.en`.
- `VERCEL_WHISPER_MODEL_URL`: optional build-time override for the ggml model
  download.

Queue publishing and consumption use Vercel Queues through `@vercel/queue`.
Vercel handles queue authentication with OIDC in deployed environments.
When `WHISPER_CPP_BIN` and `WHISPER_CPP_MODEL` are blank, the worker defaults to
the bundled Vercel asset paths:

- `.vercel-transcription/bin/whisper-cli`
- `.vercel-transcription/models/ggml-tiny.en.bin`

## Setup

1. Provision S3 and IAM:
   `cd infra/terraform && terraform init && terraform apply`
2. Set app environment variables in Vercel/local shell.
3. Run DB migrations:
   `npm run db:migrate`
4. Import existing JSON-backed records:
   `npm run microdoses:import-db`
5. Sign in at `/admin/login`.

## Auth

Production admin auth should use GitHub or Google OAuth plus
`ADMIN_ALLOWED_EMAILS`. The app rejects any authenticated account whose email is
not on the allowlist.

For two admins, create OAuth apps with these callback URLs:

- Local: `http://localhost:3000/api/auth/callback/github`
- Staging GitHub: `https://dev.coolmolecules.media/api/auth/callback/github`
- Staging www GitHub: `https://www.dev.coolmolecules.media/api/auth/callback/github`
- Production GitHub: `https://www.coolmolecules.media/api/auth/callback/github`
- Local Google: `http://localhost:3000/api/auth/callback/google`
- Staging Google: `https://dev.coolmolecules.media/api/auth/callback/google`
- Staging www Google: `https://www.dev.coolmolecules.media/api/auth/callback/google`
- Production Google: `https://www.coolmolecules.media/api/auth/callback/google`

GitHub OAuth Apps commonly allow one callback URL, so use separate GitHub apps
for local/staging/production if needed. Google OAuth clients can include
multiple authorized redirect URIs.

Use provider-level 2FA/passkeys on the two admin accounts.

## Deployment

Vercel should own application deployments through its Git integration:

- Pull requests get Preview Deployments.
- Merges to `main` deploy Production.
- Vercel environment variables are configured per Preview/Production
  environment.

GitHub Actions provides extra checks in `.github/workflows/ci.yml`:

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

Terraform automation lives in `.github/workflows/terraform.yml`:

- Pull requests run `terraform fmt`, `terraform validate`, and `terraform plan`.
- Pushes to `main` run `terraform apply` through the GitHub `production`
  environment.
- GitHub Actions authenticates to AWS with OIDC using
  `AWS_TERRAFORM_ROLE_ARN`, not static AWS keys.

Create these GitHub repository or environment values:

- Secret: `AWS_TERRAFORM_ROLE_ARN`
- Variable: `AWS_REGION`
- Variable: `TF_STATE_BUCKET`
- Variable: `TF_STATE_KEY`, optional, defaults to `cmm-website/terraform.tfstate`
- Variable: `TF_LOCK_TABLE`

The first Terraform run must be bootstrapped manually with AWS credentials to
create the GitHub OIDC role, or you can create that role by hand and set the
secret. To bootstrap with Terraform, pass:

```bash
terraform apply \
  -var='enable_github_oidc=true' \
  -var='github_owner=YOUR_GITHUB_OWNER' \
  -var='github_repository=YOUR_REPO' \
  -var='terraform_state_bucket=YOUR_TF_STATE_BUCKET' \
  -var='terraform_lock_table=YOUR_TF_LOCK_TABLE' \
  -var='admin_upload_origins=["http://localhost:3000","https://dev.coolmolecules.media","https://www.dev.coolmolecules.media","https://coolmolecules.media","https://www.coolmolecules.media"]'
```

## Content Directory

`content/` is not the production source of truth once `DATABASE_URL` is set.
Keep it for now as seed/dev fallback data:

- local development works before Postgres is configured
- `npm run microdoses:import-db` can import the current records
- the directory can be removed later after production DB migration is verified

## Workflow

- Upload audio in `/admin/microdoses/new` or an existing draft.
- Save the draft record.
- Click `Transcribe` to create a transcription job.
- The Vercel Queue consumer at `/api/queues/transcribe-microdose` processes the job.
- Edit transcript text, start/end boundaries, speakers, metadata, tags, and Markdown fields.
- Publish/unpublish/archive from the admin record page.

If Vercel cannot run local Whisper comfortably, keep the same DB tables and replace the queue consumer with an AWS worker that processes `transcription_jobs` against the same S3 bucket.
