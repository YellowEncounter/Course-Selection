const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:7005',
        changeOrigin: true,
        secure: false
      },
      '/course': {
        target: 'http://localhost:7005',
        changeOrigin: true,
        secure: false
      },
      '/pbl': {
        target: 'http://localhost:7005',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
