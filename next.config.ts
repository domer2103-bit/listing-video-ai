import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root — otherwise Next.js walks up looking for a
  // lockfile and can pick up an unrelated one from a parent folder (e.g.
  // ~/Desktop) and warn about it.
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/airbnb",
        destination: "/for-airbnb-hosts",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
