import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    userInfo: JSON.parse(localStorage.getItem('userInfo')) || null,
    courses: JSON.parse(localStorage.getItem('courses')) || [
      { 
        id: 1, 
        name: '高等数学', 
        credit: 5, 
        time: '周一第1-2节', 
        desc: '高等数学基础课程',
        teacherId: 11,  // 修正：关联教师ID=11（>10）
        maxStudents: 50,  
        students: []  
      },
      { 
        id: 2, 
        name: '大学英语', 
        credit: 4, 
        time: '周三第3-4节', 
        desc: '大学英语进阶',
        teacherId: 11, // 修正：关联教师ID=11
        maxStudents: 40,
        students: []
      }
    ],
    // 修正：初始用户数据（管理员1-10，教师>10，学生年份+序号）
    users: JSON.parse(localStorage.getItem('users')) || [
      { id: 1, name: '系统管理员', role: 'admin', password: 'root' }, // 管理员ID=1（1-10）
      { id: 11, name: '张老师', role: 'teacher', password: '123' },   // 教师ID=11（>10）
      { id: 202301, name: '黄同学', role: 'student', password: '456' }, // 学生ID=202301
      { id: 202302, name: '李同学', role: 'student', password: '789' }  // 学生ID=202302
    ]
  },
  mutations: {
    setUserInfo(state, userInfo) {
      state.userInfo = userInfo;
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    },
    setCourses(state, courses) {
      state.courses = courses;
      localStorage.setItem('courses', JSON.stringify(courses));
    },
    setUsers(state, users) {
      state.users = users;
      localStorage.setItem('users', JSON.stringify(users));
    }
  },
  actions: {
    logout({ commit }) {
      commit('setUserInfo', null);
      localStorage.removeItem('userInfo');
    }
  },
  getters: {
    // 老师的课程
    teacherCourses: (state) => {
      if (!state.userInfo || state.userInfo.role !== 'teacher') return [];
      return state.courses.filter(course => course.teacherId == state.userInfo.id);
    },
    // 课程的授课老师信息
    getTeacherInfo: (state) => (teacherId) => {
      return state.users.find(user => user.id == teacherId) || { name: '未知' };
    },
    // 课程的学生列表
    getCourseStudents: (state) => (courseId) => {
      const course = state.courses.find(c => c.id === courseId);
      if (!course) return [];
      return state.users.filter(user => 
        user.role === 'student' && course.students.includes(user.id)
      );
    }
  }
});