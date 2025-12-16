import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // 关键配置：将代码中的 process.env.API_KEY 替换为构建时的环境变量值
      // 优先读取 VITE_API_KEY，如果没有则尝试读取 API_KEY
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY),
    },
  };
});