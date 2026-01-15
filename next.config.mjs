/** @type {import('next').NextConfig} */
const nextConfig = {
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

  // 环境变量
  env: {
    NEXT_PUBLIC_CHAIN_ID: '6aa7bd33b6b45192465afa3553dedb531acaaff8928cf64b70bd4c5e49b7ec6a',
    NEXT_PUBLIC_RPC_ENDPOINT: 'https://to-rpc.fibos.io',
    NEXT_PUBLIC_CHAIN_NAME: 'FIBOS',
  },
};

export default nextConfig;
