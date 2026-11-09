const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  // 开发环境用绝对路径，生产环境用相对路径（支持双击打开dist/index.html）
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  // 关闭生产环境 source map，减小体积并避免暴露源码
  productionSourceMap: false,
  // 资源输出目录统一为 static，便于移动后路径一致
  assetsDir: 'static',

  devServer: {
    port: 8080,
    open: true,
    proxy: {},
    // 关闭 webpack-dev-server 的运行时错误 overlay（兜底防护）
    // MockJS 的全局XHR拦截可能在某些边界场景仍触发非致命错误
    client: {
      overlay: {
        warnings: false,
        errors: false
      }
    }
  },

  // 别名路径
  configureWebpack: {
    resolve: {
      alias: {
        '@': require('path').resolve(__dirname, 'src')
      }
    }
  }
})
