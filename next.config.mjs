/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出配置
  output: 'export',

  // 静态导出不支持图片优化
  images: {
    unoptimized: true,
  },

  reactStrictMode: true,
  poweredByHeader: false,

  // Webpack 配置（处理 eosjs-classic-fibos）
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },

  // 开发环境代理配置（解决 CORS 问题）
  // 注意：rewrites 在 output: 'export' 时不生效，但开发服务器会使用
  async rewrites() {
    return [
      {
        source: '/api/rpc/:path*',
        destination: 'https://fibos-tracker.chains.one/:path*',
      },
      {
        source: '/api/explorer/:path*',
        destination: 'https://fibos-tracker.chains.one/explorer/:path*',
      },
      {
        source: '/api/bp-status',
        destination: 'https://api.fibos123.com/bp_status',
      },
    ];
  },

  // 环境变量
  env: {
    NEXT_PUBLIC_CHAIN_ID: '6aa7bd33b6b45192465afa3553dedb531acaaff8928cf64b70bd4c5e49b7ec6a',
    NEXT_PUBLIC_RPC_ENDPOINT: 'https://to-rpc.fibos.io',
    NEXT_PUBLIC_CHAIN_NAME: 'FIBOS',
  },
};

export default nextConfig;
