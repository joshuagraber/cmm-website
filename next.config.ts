import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/queues/transcribe-microdose": [
      "./vercel-transcription/bin/**/*",
      "./vercel-transcription/models/**/*",
    ],
  },
};

export default nextConfig;
