/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle at .next/standalone for container /
  // Railway deploys (see Dockerfile). Vercel ignores this and uses its own
  // build adapter, so it's safe for both targets.
  output: "standalone",
};

export default nextConfig;
