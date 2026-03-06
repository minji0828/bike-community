import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
const apiWsUrl = apiBaseUrl.replace(/^http/i, 'ws')
const isDevelopment = process.env.NODE_ENV !== 'production'
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(isDevelopment ? ["'unsafe-eval'"] : []),
  'https://dapi.kakao.com',
  'https://t1.daumcdn.net',
  'https://kauth.kakao.com',
  'https://developers.kakao.com',
].join(' ')
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiBaseUrl} ${apiWsUrl} https://kauth.kakao.com https://kapi.kakao.com https://dapi.kakao.com`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://kauth.kakao.com",
].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'geolocation=(self)' },
        ],
      },
    ]
  },
}

export default nextConfig
