import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:7005',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 可以在这里添加token等认证信息
    console.log(`🚀 请求: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    console.log(`✅ 响应: ${response.status} ${response.config.url}`);
    return response;
  },
  error => {
    // 详细的错误处理
    if (error.response) {
      // 服务器响应但状态码不是2xx
      const { status, data, config } = error.response;
      console.error(`❌ API错误 ${status}: ${config.method.toUpperCase()} ${config.url}`);
      console.error('错误详情:', data);
      
      // 根据状态码显示不同的错误信息
      switch (status) {
        case 400:
          error.message = '请求参数错误';
          break;
        case 401:
          error.message = '未授权访问';
          break;
        case 403:
          error.message = '禁止访问';
          break;
        case 404:
          error.message = 'API端点不存在';
          console.error('💡 解决方案: 检查后端路由配置');
          break;
        case 500:
          error.message = '服务器内部错误';
          console.error('💡 解决方案: 检查后端服务器日志');
          break;
        case 502:
          error.message = '网关错误';
          console.error('💡 解决方案: 检查后端服务是否正常运行');
          break;
        case 503:
          error.message = '服务不可用';
          break;
        case 504:
          error.message = '网关超时';
          break;
        default:
          error.message = `请求失败 (${status})`;
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('❌ 网络错误: 请求超时或服务器无响应');
      error.message = '网络连接失败，请检查：';
      error.solutions = [
        '1. 后端服务是否正在运行 (端口7005)',
        '2. 防火墙是否阻止了连接',
        '3. 网络连接是否正常',
        '4. API地址是否正确'
      ];
    } else {
      // 其他错误
      console.error('❌ 请求配置错误:', error.message);
      error.message = '请求配置错误';
    }

    return Promise.reject(error);
  }
);

export default api;