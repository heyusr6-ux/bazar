/** @type {import('next').NextConfig} */
// /api/* on this site is forwarded to the API. The browser then sees one site,
// so the session cookie is first-party and mobile browsers do not block it.
const API_ORIGIN = process.env.API_ORIGIN || "https://bazar-api-sigma.vercel.app";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
