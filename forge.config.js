module.exports = {
  outDir: 'dist',
  packagerConfig: {
    dir: '.',
    ignore: (file) => {
      if (!file) return false;
      return !file.startsWith('/out') && file !== '/package.json' && file !== '/node_modules';
    },
    // 等需要分发给其他用户时，再配置签名：
    // 1. 一个 Apple Developer 账号
    // 2. 设置 APPLE_ID、APPLE_PASSWORD、APPLE_TEAM_ID 环境变量
    // 3. 确保网络能连接到 Apple 服务器
    // osxSign: {},
    // // ...
    // osxNotarize: {
    //   tool: 'notarytool',
    //   appleId: process.env.APPLE_ID,
    //   appleIdPassword: process.env.APPLE_PASSWORD,
    //   teamId: process.env.APPLE_TEAM_ID
    // }
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
  ],
};
