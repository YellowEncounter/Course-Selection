import request from './index';

// 课程接口
export const courseAPI = {
  // 获取所有课程 - 使用GET方法
  getAll: (params = {}) => {
    console.log('调用 getAllCourses API，参数:', params);
    console.log('请求URL:', '/api/pbl/getAllCourses');
    const result = request.get('/api/pbl/getAllCourses', { params });
    result.then(response => {
      console.log('getAllCourses 响应:', response);
    }).catch(error => {
      console.error('getAllCourses 错误:', error);
    });
    return result;
  },
  // 教师获取自己的课程
  getTeacherCourses: (data) => {
    console.log('调用 getTeacherCourses API');
    return request.post('/api/pbl/getTeacherCourses', data);
  },
  // 添加课程
  add: (data) => request.post('/api/pbl/addCourse', data),
  // 更新课程
  update: (data) => request.post('/api/pbl/updateCourse', data),
  // 删除课程
  delete: (data) => request.post('/api/pbl/deleteCourse', data),
  // 学生选课
  select: (data) => {
    console.log('调用 selectCourse API:', data);
    return request.post('/api/pbl/selectCourse', data);
  },
  // 学生退课
  drop: (data) => {
    console.log('调用 dropCourse API:', data);
    return request.post('/api/pbl/dropCourse', data);
  },
  // 获取课程学生列表
  getCourseStudents: (data) => request.post('/api/pbl/getCourseStudents', data),
  // 获取学生已选课程（使用新表）- 使用GET方法
  getStudentSelectedCourses: (params) => {
    console.log('调用 getStudentSelectedCourses API，参数:', params);
    return request.get('/api/course/getStudentSelectedCourses', { params });
  }
};