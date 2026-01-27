/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ai-core/ui', '@ai-core/types', '@ai-core/utils', '@ai-core/constants', '@ai-core/ai'],
};

module.exports = nextConfig;
