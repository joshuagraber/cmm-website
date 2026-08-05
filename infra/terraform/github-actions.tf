data "aws_caller_identity" "current" {}

locals {
  terraform_state_resources = var.terraform_state_bucket == "" ? [] : [
    "arn:aws:s3:::${var.terraform_state_bucket}",
    "arn:aws:s3:::${var.terraform_state_bucket}/*"
  ]
  terraform_lock_resources = var.terraform_lock_table == "" ? [] : [
    "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${var.terraform_lock_table}"
  ]
}

resource "aws_iam_openid_connect_provider" "github" {
  count = var.enable_github_oidc ? 1 : 0

  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [var.github_oidc_thumbprint]
}

resource "aws_iam_role" "github_terraform" {
  count = var.enable_github_oidc ? 1 : 0

  name = "${var.project_name}-github-terraform"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github[0].arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_owner}/${var.github_repository}:ref:refs/heads/${var.github_branch}"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "github_terraform" {
  count = var.enable_github_oidc ? 1 : 0

  name = "${var.project_name}-github-terraform"
  role = aws_iam_role.github_terraform[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat([
      {
        Effect = "Allow"
        Action = [
          "s3:*",
          "iam:*"
        ]
        Resource = [
          aws_s3_bucket.microdose_audio.arn,
          "${aws_s3_bucket.microdose_audio.arn}/*",
          aws_iam_user.app_audio.arn,
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com",
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/${var.project_name}-*",
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.project_name}-*",
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/${var.project_name}-*"
        ]
      }
      ],
      var.terraform_state_bucket == "" ? [] : [
        {
          Effect = "Allow"
          Action = [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:ListBucket"
          ]
          Resource = local.terraform_state_resources
        }
      ],
      var.terraform_lock_table == "" ? [] : [
        {
          Effect = "Allow"
          Action = [
            "dynamodb:GetItem",
            "dynamodb:PutItem",
            "dynamodb:DeleteItem",
            "dynamodb:DescribeTable"
          ]
          Resource = local.terraform_lock_resources
        }
    ])
  })
}
