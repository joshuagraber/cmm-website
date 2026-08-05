terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_s3_bucket" "microdose_audio" {
  bucket = "${var.project_name}-microdose-audio"
}

resource "aws_s3_bucket_public_access_block" "microdose_audio" {
  bucket = aws_s3_bucket.microdose_audio.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "microdose_audio" {
  bucket = aws_s3_bucket.microdose_audio.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "microdose_audio" {
  bucket = aws_s3_bucket.microdose_audio.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "PUT"]
    allowed_origins = var.admin_upload_origins
    expose_headers = [
      "accept-ranges",
      "content-length",
      "content-range",
      "etag"
    ]
    max_age_seconds = 300
  }
}

resource "aws_iam_user" "app_audio" {
  name = "${var.project_name}-audio-app"
}

resource "aws_iam_access_key" "app_audio" {
  user = aws_iam_user.app_audio.name
}

resource "aws_iam_user_policy" "app_audio" {
  name = "${var.project_name}-audio-app"
  user = aws_iam_user.app_audio.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.microdose_audio.arn}/audio/microdoses/*"
      }
    ]
  })
}
