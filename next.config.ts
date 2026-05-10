import type { NextConfig } from "next";

const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'} https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com`,
    "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
    { key: 'X-Content-Type-Options',  value: 'nosniff' },
    { key: 'X-Frame-Options',         value: 'DENY' },
    { key: 'X-XSS-Protection',        value: '1; mode=block' },
    { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Content-Security-Policy', value: cspDirectives },
];

const nextConfig: NextConfig = {
    async headers() {
        return [{ source: '/(.*)', headers: securityHeaders }];
    },
};

export default nextConfig;
