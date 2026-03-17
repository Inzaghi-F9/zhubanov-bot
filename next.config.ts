/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Игнорируем ошибки типов при сборке
    ignoreBuildErrors: true,
  },
  eslint: {
    // Игнорируем ошибки линтера при сборке
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;