output "audio_bucket_name" {
  value = aws_s3_bucket.microdose_audio.bucket
}

output "app_audio_access_key_id" {
  value = aws_iam_access_key.app_audio.id
}

output "app_audio_secret_access_key" {
  value     = aws_iam_access_key.app_audio.secret
  sensitive = true
}

output "github_terraform_role_arn" {
  value       = var.enable_github_oidc ? aws_iam_role.github_terraform[0].arn : null
  description = "IAM role ARN for GitHub Actions Terraform OIDC."
}
