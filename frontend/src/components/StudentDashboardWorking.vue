<template>
  <div class="student-container">
    <div class="header">
      <h1>学生选课中心</h1>
      <div class="user-info">
        <span>欢迎，{{ userInfo.name }}（学生）</span>
        <button @click="logout" class="logout-btn">退出</button>
      </div>
    </div>
    
    <div class="tabs">
      <button :class="{active: activeTab === 'allCourses'}" @click="activeTab = 'allCourses'">所有课程</button>
      <button :class="{active: activeTab === 'selected'}" @click="activeTab = 'selected'">已选课程</button>
    </div>
    
    <div class="content">
      <div v-if="activeTab === 'allCourses'" class="card">
        <div v-if="loading" class="loading-state">
          <i class="el-icon-loading"></i>
          <p>正在加载课程数据...</p>
        </div>
        <div v-else>
          <div v-if="courses.length > 0">
            <div class="search-box">
              <el-input 
                v-model="searchKeyword" 
                placeholder="搜索课程名称" 
                prefix-icon="el-icon-search"
                clearable
                @input="onSearchInput"
              ></el-input>
            </div>
            
            <div class="course-grid">
              <div class="course-card" v-for="course in filteredCourses" :key="course.id">
                <div class="course-header">
                  <h3>{{ course.name }}</h3>
                  <span class="credit">学分: {{ course.credit }}</span>
                </div>
                <div class="course-info">
                  <p><i class="el-icon-user"></i> 授课老师: {{ course.teacherName || getTeacherName(course.teacherId) }}</p>
                  <p><i class="el-icon-time"></i> {{ course.time }}</p>
                  <p><i class="el-icon-people"></i> 剩余名额: {{ (course.maxStudents || 0) - (getStudentCount(course)) }}/{{ course.maxStudents || 0 }}</p>
                  <p class="desc">{{ course.description || course.desc || '暂无描述' }}</p>
                </div>
                <button 
                  class="select-btn" 
                  @click="selectCourse(course)"
                  :disabled="isSelected(course.id) || getStudentCount(course) >= (course.maxStudents || 0) || selectingCourse === course.id"
                >
                  <span v-if="selectingCourse === course.id">
                    <i class="el-icon-loading"></i> 处理中...
                  </span>
                  <span v-else>
                    {{ isSelected(course.id) ? '已选' : (getStudentCount(course) >= (course.maxStudents || 0) ? '名额已满' : '选择') }}
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <i class="el-icon-book-reader"></i>
            <p>暂无课程数据</p>
          </div>
        </div>
      </div>
      
      <div v-if="activeTab === 'selected'" class="card">
        <div v-if="loading" class="loading-state">
          <i class="el-icon-loading"></i>
          <p>正在加载课程数据...</p>
        </div>
        
        <!-- 调试信息 -->
        <div class="debug-info" style="background-color: #f0f0f0; padding: 10px; margin-bottom: 10px; font-size: 12px;">
          <p>调试信息:</p>
          <p>课程数据数量: {{ courses.length }}</p>
          <p>学生ID: {{ userInfo?.id }}</p>
          <p>已选课程数量: {{ selectedCoursesDisplay.length }}</p>
          <p>activeTab: {{ activeTab }}</p>
          <p>loading: {{ loading }}</p>
        </div>
        
        <div v-if="selectedCoursesDisplay.length > 0" class="selected-list">
          <div class="selected-item" v-for="(course, index) in selectedCoursesDisplay" :key="'selected-' + index + '-' + course.id">
            <div class="course-info">
              <h3>{{ course.name }}</h3>
              <p><i class="el-icon-user"></i> 授课老师: {{ course.teacherName || getTeacherName(course.teacherId) }}</p>
              <p><i class="el-icon-time"></i> {{ course.time }}</p>
              <p>学分: {{ course.credit }}</p>
            </div>
            <button class="drop-btn" @click="dropCourse(course.id)" :disabled="droppingCourse === course.id">
              <span v-if="droppingCourse === course.id">
                <i class="el-icon-loading"></i> 处理中...
              </span>
              <span v-else>退选</span>
            </button>
          </div>
        </div>
        
        <!-- 已选课程空状态 -->
        <div v-else class="empty-state">
          <i class="el-icon-book-reader"></i>
          <p>暂无已选课程</p>
        </div>
        
        <div class="credit-summary" v-if="selectedCoursesDisplay.length > 0">
          <p>已选课程总数: {{ selectedCoursesDisplay.length }}</p>
          <p>总学分: {{ totalCreditDisplay }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Message } from 'element-ui';
import { mapState } from 'vuex';
import { courseAPI } from '@/api/course';

export default {
  computed: {
    ...mapState(['userInfo']),
    filteredCourses() {
      if (!this.searchKeyword) {
        return this.courses;
      }
      return this.courses.filter(course => 
        course && course.name && 
        course.name.toLowerCase().includes(this.searchKeyword.toLowerCase())
      );
    }
  },
  data() {
    return {
      activeTab: 'selected', // 默认显示已选课程
      searchKeyword: '',
      courses: [], // 本地课程数据
      teacherNamesCache: {}, // 教师名称缓存
      loading: false,
      selectingCourse: null,
      droppingCourse: null,
      selectedCoursesDisplay: [], // 直接存储已选课程数据
      totalCreditDisplay: 0 // 直接存储总学分
    };
  },
  methods: {
    // 辅助方法：安全获取并解析students数组
    getStudentsArray(students) {
      if (!students) return [];
      if (Array.isArray(students)) return students;
      
      if (typeof students === 'string') {
        try {
          if (students.trim().startsWith('[')) {
            const parsed = JSON.parse(students);
            return Array.isArray(parsed) ? parsed : [];
          }
          else if (students.includes(',')) {
            return students.split(',').map(id => id.trim()).filter(id => id);
          }
          else if (students.trim() !== '') {
            return [students.trim()];
          }
          return [];
        } catch (e) {
          console.warn('解析students数据失败:', e, students);
          return [];
        }
      }
      
      return [];
    },
    
    // 更新已选课程显示
    updateSelectedCoursesDisplay() {
      const studentId = String(this.userInfo?.id || '');
      if (!studentId) {
        console.warn('学生ID为空，无法获取已选课程');
        this.selectedCoursesDisplay = [];
        this.totalCreditDisplay = 0;
        return;
      }
      
      if (!Array.isArray(this.courses)) {
        console.warn('课程数据不是数组，无法筛选已选课程');
        this.selectedCoursesDisplay = [];
        this.totalCreditDisplay = 0;
        return;
      }
      
      const selected = this.courses.filter(course => {
        if (!course || !course.id) return false;
        
        const students = this.getStudentsArray(course.students);
        return students.map(String).includes(studentId);
      });
      
      // 计算总学分
      const totalCredit = selected.reduce((sum, course) => {
        const credit = parseInt(course.credit || 0);
        return sum + (isNaN(credit) ? 0 : credit);
      }, 0);
      
      // 更新显示数据
      this.selectedCoursesDisplay = [...selected];
      this.totalCreditDisplay = totalCredit;
      
      console.log('更新已选课程显示:', {
        studentId,
        totalCourses: this.courses.length,
        selectedCount: selected.length,
        selectedCourses: selected.map(c => ({id: c.id, name: c.name})),
        totalCredit
      });
    },
    
    // 获取教师信息
    async getTeacherName(teacherId) {
      if (this.teacherNamesCache[teacherId]) {
        return this.teacherNamesCache[teacherId];
      }
      
      try {
        const { teacherAPI } = await import('@/api/user');
        const response = await teacherAPI.get();
        const teachers = response.data || [];
        const teacher = teachers.find(t => t.id == teacherId);
        const name = teacher ? teacher.name : '未知';
        
        this.teacherNamesCache[teacherId] = name;
        return name;
      } catch (error) {
        console.error('获取教师信息失败：', error);
        this.teacherNamesCache[teacherId] = '未知';
        return '未知';
      }
    },
    
    // 加载课程数据
    async loadCourses() {
      this.loading = true;
      try {
        console.log('正在加载课程数据...');
        
        if (!this.userInfo || !this.userInfo.id) {
          Message.warning('请先登录');
          this.courses = [];
          this.updateSelectedCoursesDisplay();
          return;
        }
        
        try {
          const response = await courseAPI.getAll();
          let courses = response.data || [];
          console.log('原始课程数据:', courses);
          
          courses = courses.map(course => ({
            ...course,
            students: this.getStudentsArray(course.students)
          }));
          
          this.courses = courses;
          console.log('规范化后的课程数据加载成功:', this.courses.length, '条记录');
        } catch (apiError) {
          console.error('API加载失败，使用模拟数据:', apiError);
          Message.warning('无法连接服务器，使用本地缓存数据');
          
          // 使用模拟数据作为后备方案
          const mockCoursesData = [
            {
              id: 13,
              name: '测试课程_张老师',
              credit: 3,
              time: '周一 8:00-10:00',
              description: '这是一个测试课程',
              maxStudents: 30,
              teacherId: 1001,
              teacherName: '张老师',
              students: [202501, 202502]
            },
            {
              id: 14,
              name: '测试课程_戴老师',
              credit: 2,
              time: '周三 14:00-16:00',
              description: '这是另一个测试课程',
              maxStudents: 25,
              teacherId: 1002,
              teacherName: '戴老师',
              students: [202501]
            },
            {
              id: 15,
              name: 'AWS课程',
              credit: 4,
              time: '周五 10:00-12:00',
              description: 'AWS云计算课程',
              maxStudents: 20,
              teacherId: 1003,
              teacherName: '李老师',
              students: []
            }
          ];
          
          this.courses = mockCoursesData;
        }
        
        console.log('当前学生ID:', this.userInfo.id);
        
        // 更新已选课程显示
        this.updateSelectedCoursesDisplay();
        
        // 预加载教师信息
        this.preloadTeacherNames();
        
      } catch (error) {
        console.error('加载课程数据失败:', error);
        Message.error('加载课程数据失败：' + error.message);
        this.courses = [];
        this.updateSelectedCoursesDisplay();
      } finally {
        this.loading = false;
      }
    },
    
    // 预加载教师信息
    async preloadTeacherNames() {
      try {
        const { teacherAPI } = await import('@/api/user');
        const response = await teacherAPI.get();
        const teachers = response.data || [];
        
        teachers.forEach(teacher => {
          this.teacherNamesCache[teacher.id] = teacher.name;
        });
      } catch (error) {
        console.error('预加载教师信息失败:', error);
      }
    },
    
    isSelected(courseId) {
      const course = this.courses.find(c => c.id === courseId);
      if (!course) return false;
      
      const studentId = String(this.userInfo?.id || '');
      const students = this.getStudentsArray(course.students);
      
      return students.map(String).includes(studentId);
    },
    
    async selectCourse(course) {
      if (!this.userInfo?.id) {
        Message.warning('请先登录');
        return;
      }

      if (this.isSelected(course.id)) {
        Message.warning('您已选择此课程');
        return;
      }

      const currentStudents = this.getStudentsArray(course.students);
      
      if (currentStudents.length >= (course.maxStudents || 0)) {
        Message.warning('该课程已达人数上限');
        return;
      }

      this.selectingCourse = course.id;
      
      try {
        console.log('正在选择课程:', course.id, '学生ID:', this.userInfo.id);
        await courseAPI.select({
          courseId: course.id,
          studentId: this.userInfo.id
        });
        
        // 乐观更新：先更新本地状态，再重新加载数据
        const courseIndex = this.courses.findIndex(c => c.id === course.id);
        if (courseIndex !== -1) {
          const students = [...this.getStudentsArray(this.courses[courseIndex].students)];
          
          if (!students.includes(this.userInfo.id)) {
            students.push(this.userInfo.id);
            this.courses[courseIndex].students = students;
          }
        }
        
        await this.loadCourses();
        
        Message.success(`已选择 ${course.name}`);
      } catch (error) {
        console.error('选课失败:', error);
        Message.error('选课失败：' + error.message);
        await this.loadCourses();
      } finally {
        this.selectingCourse = null;
      }
    },
    
    async dropCourse(courseId) {
      this.droppingCourse = courseId;
      
      try {
        console.log('正在退选课程:', courseId, '学生ID:', this.userInfo.id);
        await courseAPI.drop({
          courseId: courseId,
          studentId: this.userInfo.id
        });
        
        // 乐观更新：先更新本地状态，再重新加载数据
        const courseIndex = this.courses.findIndex(c => c.id === courseId);
        if (courseIndex !== -1) {
          let students = [...(this.courses[courseIndex].students || [])];
          
          if (typeof students === 'string') {
            try {
              students = JSON.parse(students);
            } catch (e) {
              console.warn('解析students数据失败:', e, students);
              students = [];
            }
          }
          
          if (!Array.isArray(students)) {
            students = [];
          }
          
          const index = students.indexOf(this.userInfo.id);
          if (index !== -1) {
            students.splice(index, 1);
            this.courses[courseIndex].students = students;
          }
        }
        
        await this.loadCourses();
        
        const course = this.courses.find(c => c.id === courseId);
        Message.success(`已退选 ${course ? course.name : '课程'}`);
      } catch (error) {
        console.error('退课失败:', error);
        Message.error('退课失败：' + error.message);
        await this.loadCourses();
      } finally {
        this.droppingCourse = null;
      }
    },
    
    onSearchInput() {
      console.log('搜索关键词:', this.searchKeyword);
    },
    
    getStudentCount(course) {
      if (!course) return 0;
      
      let students = course.students || [];
      
      if (typeof students === 'string') {
        try {
          students = JSON.parse(students);
        } catch (e) {
          console.warn('解析students数据失败:', e, course.students);
          students = [];
        }
      }
      
      if (!Array.isArray(students)) {
        students = [];
      }
      
      return students.length;
    },
    
    logout() {
      this.$store.dispatch('logout');
      this.$router.push('/');
    },
    
    // 调试函数
    debugSelectedCourses() {
      console.log('=== 调试已选课程 ===');
      console.log('当前用户信息:', this.userInfo);
      console.log('所有课程数据:', this.courses);
      console.log('已选课程显示数据:', this.selectedCoursesDisplay);
      console.log('当前标签页:', this.activeTab);
      console.log('加载状态:', this.loading);
      
      if (Array.isArray(this.courses)) {
        this.courses.forEach(course => {
          console.log(`课程 ${course.name}:`, {
            id: course.id,
            students: course.students,
            studentsType: typeof course.students,
            parsedStudents: this.getStudentsArray(course.students),
            containsCurrentStudent: this.getStudentsArray(course.students).includes(String(this.userInfo?.id || ''))
          });
        });
      }
    }
  },
  
  mounted() {
    console.log('StudentDashboard已挂载，开始加载课程数据...');
    console.log('当前用户信息:', this.userInfo);
    
    try {
      this.loadCourses();
    } catch (error) {
      console.error('加载课程数据时发生错误:', error);
      this.loading = false;
    }
    
    // 定期刷新数据
    this.refreshInterval = setInterval(() => {
      if (this.userInfo) {
        try {
          this.loadCourses();
        } catch (error) {
          console.error('定期刷新课程数据时发生错误:', error);
        }
      }
    }, 30000);
  },
  
  beforeDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  },
  
  watch: {
    // 监听课程数据变化
    courses: {
      handler() {
        console.log('检测到课程数据变化，更新已选课程显示');
        this.updateSelectedCoursesDisplay();
      },
      deep: true
    },
    
    // 监听用户信息变化
    userInfo: {
      handler() {
        console.log('检测到用户信息变化，更新已选课程显示');
        this.updateSelectedCoursesDisplay();
      },
      deep: true
    },
    
    // 监听标签页变化
    activeTab(newTab) {
      console.log('标签页切换到:', newTab);
      if (newTab === 'selected') {
        // 切换到已选课程时，强制更新显示
        this.updateSelectedCoursesDisplay();
        this.$forceUpdate();
      }
    }
  },
  
  errorCaptured(err, vm, info) {
    console.error('StudentDashboard组件捕获到错误:', err, info);
    Message.error('页面发生错误，请刷新重试');
    return false;
  }
}
</script>

<style scoped>
.student-container {
  padding: 2rem;
  background-color: #fff5f7;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

h1 {
  color: #333;
  font-weight: 600;
}

.logout-btn {
  background-color: #fff;
  border: 1px solid #ffebee;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  color: #666;
  transition: all 0.3s;
}

.logout-btn:hover {
  background-color: #ffebee;
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.tabs button {
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 20px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.tabs button.active {
  background-color: #ffccd5;
  color: #c62828;
}

.card {
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.search-box {
  margin-bottom: 1.5rem;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.course-card {
  border: 1px solid #f8f8f8;
  border-radius: 1rem;
  padding: 1.2rem;
  transition: all 0.3s;
}

.course-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

h3 {
  margin: 0;
  color: #333;
}

.credit {
  background-color: #fff0f0;
  color: #e53935;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.course-info {
  margin-bottom: 1rem;
}

.course-info p {
  margin: 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.desc {
  color: #999;
  line-height: 1.5;
}

.select-btn {
  width: 100%;
  padding: 0.6rem;
  border: none;
  border-radius: 0.5rem;
  background-color: #ffebee;
  color: #c62828;
  cursor: pointer;
  transition: all 0.3s;
}

.select-btn:disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.select-btn:not(:disabled):hover {
  background-color: #ffccd5;
}

.selected-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.selected-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #f0f0f0;
  border-radius: 0.8rem;
  padding: 1rem;
}

.drop-btn {
  background-color: #f5f5f5;
  color: #666;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.drop-btn:hover {
  background-color: #e0e0e0;
}

.empty-state {
  text-align: center;
  padding: 3rem 0;
  color: #999;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #ddd;
}

.credit-summary {
  display: flex;
  justify-content: flex-end;
  gap: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #f5f5f5;
  color: #666;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  color: #999;
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.loading-state p {
  margin: 0;
  font-size: 1rem;
}
</style>