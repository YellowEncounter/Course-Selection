import request from './index';

// 管理员接口
export const adminAPI = {
  add: (data) => request.post('/api/pbl/addUser-1', data),
  delete: (data) => request.post('/api/pbl/deleteUser-1', data),
  get: (data = {}) => request.post('/api/pbl/getUser-1', data),
  update: (data) => request.post('/api/pbl/updateUser-1', data)
};

// 教师接口
export const teacherAPI = {
  add: (data) => request.post('/api/pbl/addUser-2', data),
  delete: (data) => request.post('/api/pbl/deleteUser-2', data),
  get: (data = {}) => request.post('/api/pbl/getUser-2', data),
  update: (data) => request.post('/api/pbl/updateUser-2', data)
};

// 学生接口
export const studentAPI = {
  add: (data) => request.post('/api/pbl/addUser-3', data),
  delete: (data) => request.post('/api/pbl/deleteUser-3', data),
  get: (data = {}) => request.post('/api/pbl/getUser-3', data),
  update: (data) => request.post('/api/pbl/updateUser-3', data)
};

// 课程学生接口
export const courseStudentAPI = {
  getCourseStudents: (courseId) => request.post('/api/pbl/getCourseStudents', { courseId })
};