import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.linereveal.game',
  appName: 'Line Reveal',
  webDir: 'dist',
  ios: {
    // v1.3.4: 禁止 WKWebView 自动添加 safe area 内边距
    // 避免 window.innerHeight 因 Home Indicator 缩小，导致 canvas 高度不足出现黑边
    contentInset: 'never'
  }
};

export default config;
