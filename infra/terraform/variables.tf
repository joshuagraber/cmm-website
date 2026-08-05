variable "project_name" {
  type        = string
  description = "Project name used for resource names."
  default     = "cmm-website"
}

variable "aws_region" {
  type        = string
  description = "AWS region for S3 resources."
  default     = "us-east-2"
}

variable "admin_upload_origins" {
  type        = list(string)
  description = "Allowed browser origins for presigned admin uploads."
  default = [
    "http://localhost:3000",
    "https://dev.coolmolecules.media",
    "https://www.dev.coolmolecules.media",
    "https://coolmolecules.media",
    "https://www.coolmolecules.media"
  ]
}

variable "enable_github_oidc" {
  type        = bool
  description = "Create a GitHub Actions OIDC provider and Terraform apply role."
  default     = false
}

variable "github_owner" {
  type        = string
  description = "GitHub owner or organization allowed to assume the Terraform role."
  default     = ""
}

variable "github_repository" {
  type        = string
  description = "GitHub repository allowed to assume the Terraform role."
  default     = ""
}

variable "github_branch" {
  type        = string
  description = "GitHub branch allowed to apply Terraform."
  default     = "main"
}

variable "github_oidc_thumbprint" {
  type        = string
  description = "Thumbprint for token.actions.githubusercontent.com."
  default     = "6938fd4d98bab03faadb97b34396831e3780aea1"
}

variable "terraform_state_bucket" {
  type        = string
  description = "S3 bucket used for Terraform remote state, when managing the GitHub OIDC role."
  default     = ""
}

variable "terraform_lock_table" {
  type        = string
  description = "DynamoDB table used for Terraform state locking, when managing the GitHub OIDC role."
  default     = ""
}
