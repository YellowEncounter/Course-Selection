import axios from 'axios';

// 创建axios实例
// src/api/index.js
const request = axios.create({
  baseURL: '/', // 使用根路径，由代理配置处理
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

// 请求拦截器（可选：添加token等）
request.interceptors.request.use(
  (config) => {
    // 示例：添加认证token
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器（统一处理返回格式）
request.interceptors.response.use(
  (response) => {
    const res = response.data;
    console.log('API响应:', res);

    // 后端可能返回多种格式，需要统一处理
    // 1. 直接返回数据格式: { data: [...] }
    // 2. 存储过程返回格式: { data: [{result: '{"success":true,"message":"..."}'}] }
    // 3. 错误格式: { error: '错误信息' } 或 { success: false, error: '错误信息' }
    
    // 如果是存储过程返回的JSON格式
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      const firstResult = res.data[0];
      if (firstResult && firstResult.result) {
        try {
          // 解析存储过程返回的JSON字符串
          const parsedResult = JSON.parse(firstResult.result);
          console.log('解析存储过程结果:', parsedResult);
          
          // 检查是否有错误
          if (parsedResult.success === false || parsedResult.error) {
            const errorMsg = parsedResult.error || parsedResult.message || '操作失败';
            const errorCode = parsedResult.code ? ` [${parsedResult.code}]` : '';
            return Promise.reject(new Error(errorMsg + errorCode));
          }
          
          // 返回解析后的结果
          return parsedResult;
        } catch (e) {
          console.warn('解析JSON失败，返回原始数据:', e);
          // 如果解析失败，检查result字段是否为成功消息
          if (typeof firstResult.result === 'string' && firstResult.result.includes('成功')) {
            return { success: true, message: firstResult.result };
          }
          // 返回原始数据
          return res;
        }
      }
    }

    // 直接错误处理
    if (res.success === false || res.error) {
      console.error('接口错误：', res.error || res.message);
      const errorMsg = res.error || res.message || '操作失败';
      const errorCode = res.code ? ` [${res.code}]` : '';
      return Promise.reject(new Error(errorMsg + errorCode));
    }

    // 返回完整数据
    return res;
  },
  (error) => {
    console.error('网络错误：', error);
    // 如果是网络错误或响应错误，直接reject
    if (error.response && error.response.data) {
      const res = error.response.data;
      if (res.error) {
        return Promise.reject(new Error(res.error));
      }
    }
    // 如果是Promise reject的错误（已经在拦截器中处理过的），直接传递
    if (error.message && (error.message.includes('操作失败') || error.message.includes('网络异常'))) {
      return Promise.reject(error);
    }
    return Promise.reject(new Error('网络异常，请稍后重试'));
  }
);

export default request;