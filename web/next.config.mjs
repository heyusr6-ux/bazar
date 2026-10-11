/** @type {import('next').NextConfig} */
// /api/* on this site is forwarded to the API, so the buyer's sign-in cookie is first-party on phones.
const API_ORIGIN = process.env.API_ORIGIN || "https://bazar-api-sigma.vercel.app";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
