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
      <button :class="{active: activeTab === 'selected'}" @click="switchToSelectedTab">已选课程</button>
      <button @click="forceRefreshCourses" class="refresh-btn">
        <i class="el-icon-refresh"></i> 刷新
      </button>
    </div>
    
    <div class="content">
      <div v-if="activeTab === 'selected'" class="card">
        <div v-if="loading" class="loading-state">
          <i class="el-icon-loading"></i>
          <p>正在加载课程数据...</p>
        </div>
        
        <div v-else>
          <!-- 已选课程列表 -->
          <div v-if="selectedCourses.length > 0" class="selected-list">
            <h3 style="margin-bottom: 1rem; color: #333;">已选课程 ({{ selectedCourses.length }}门)</h3>
            
            <div v-for="(course, index) in selectedCourses" :key="index" class="selected-item">
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
            <p style="font-size: 12px; color: #666; margin-top: 1rem;">
              如果您已选择课程但看不到列表，请点击"刷新"按钮
            </p>
          </div>
          
          <!-- 学分总结 -->
          <div v-if="selectedCourses.length > 0" class="credit-summary">
            <p>已选课程总数: {{ selectedCourses.length }}</p>
            <p>总学分: {{ totalCredit }}</p>
          </div>
        </div>
      </div>
      
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
                  <p><i class="el-icon-people"></i> 剩余名额: {{ getAvailableSlots(course) }}/{{ course.maxStudents || 0 }}</p>
                  <p class="desc">{{ course.description || course.desc || '暂无描述' }}</p>
                </div>
                <button 
                  class="select-btn" 
                  @click="selectCourse(course)"
                  :disabled="isCourseSelected(course.id) || getAvailableSlots(course) <= 0 || selectingCourse === course.id"
                >
                  <span v-if="selectingCourse === course.id">
                    <i class="el-icon-loading"></i> 处理中...
                  </span>
                  <span v-else>
                    {{ isCourseSelected(course.id) ? '已选' : (getAvailableSlots(course) <= 0 ? '名额已满' : '选择') }}
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
    },
    totalCredit() {
      if (!Array.isArray(this.selectedCourses)) {
        return 0;
      }
      return this.selectedCourses.reduce((sum, course) => {
        const credit = parseInt(course.credit || 0);
        return sum + (isNaN(credit) ? 0 : credit);
      }, 0);
    }
  },
  
  methods: {
    // 检查课程是否已选择
    isCourseSelected(courseId) {
      return this.selectedCourses.some(course => course.id === courseId);
    },
    
    // 获取可用名额
    getAvailableSlots(course) {
      if (!course) return 0;
      const maxStudents = course.maxStudents || 0;
      const currentSelected = course.selectedCount || 0;
      return maxStudents - currentSelected;
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
        console.log('开始加载所有课程数据...');
        
        if (!this.userInfo || !this.userInfo.id) {
          Message.warning('请先登录');
          this.courses = [];
          return;
        }
        
        console.log('调用API获取所有课程数据');
        const response = await courseAPI.getAll();
        console.log('获取所有课程API响应:', response);
        
        let courses = response.data || [];
        console.log('原始课程数据:', courses);
        
        if (Array.isArray(courses)) {
          // 为每个课程添加选课人数信息
          const coursesWithStats = await Promise.all(courses.map(async (course) => {
            try {
              // 获取课程选课统计
              const statsResponse = await this.getCourseStats(course.id);
              return {
                ...course,
                selectedCount: statsResponse.selectedCount || 0,
                availableCount: statsResponse.availableCount || course.maxStudents || 0
              };
            } catch (error) {
              console.error(`获取课程${course.id}统计失败:`, error);
              return {
                ...course,
                selectedCount: 0,
                availableCount: course.maxStudents || 0
              };
            }
          }));
          
          this.courses = coursesWithStats;
          console.log('课程数据加载成功，数量:', courses.length);
        } else {
          console.warn('课程数据不是数组格式');
          this.courses = [];
        }
        
        // 加载学生已选课程
        await this.loadSelectedCourses();
        
      } catch (error) {
        console.error('加载课程数据失败:', error);
        Message.error('加载课程数据失败，请稍后重试');
        this.courses = [];
      } finally {
        this.loading = false;
        console.log('课程数据加载完成');
      }
    },
    
    // 获取课程统计信息
    async getCourseStats(courseId) {
      // 简化实现，直接在前端计算
      // 这种方式简化了实现，避免了前端直接连接数据库
      return new Promise((resolve) => {
        // 使用已有的数据计算
        const course = this.courses.find(c => c.id === courseId);
        if (!course) {
          resolve({ selectedCount: 0, availableCount: 0 });
          return;
        }
        
        // 这里可以调用后端API获取统计信息，暂时使用courses表中的信息
        resolve({ 
          selectedCount: course.selectedCount || 0, 
          availableCount: course.maxStudents - (course.selectedCount || 0)
        });
      });
    },
    
    // 加载学生已选课程
    async loadSelectedCourses() {
      try {
        console.log('开始加载学生已选课程...');
        
        if (!this.userInfo || !this.userInfo.id) {
          this.selectedCourses = [];
          return;
        }
        
        console.log('调用API获取学生已选课程');
        const response = await courseAPI.getStudentSelectedCourses({
          studentId: this.userInfo.id
        });
        
        console.log('获取学生已选课程API响应:', response);
        
        // 确保无论响应格式如何，都能正确处理数据
        if (response && (response.success || response.data)) {
          this.selectedCourses = Array.isArray(response.data) ? response.data : [];
          console.log('学生已选课程加载成功，数量:', this.selectedCourses.length);
        } else {
          console.warn('获取学生已选课程失败或格式不正确');
          this.selectedCourses = [];
        }
        
      } catch (error) {
        console.error('加载学生已选课程失败:', error);
        Message.error('加载已选课程失败，请稍后重试');
        this.selectedCourses = [];
      }
    },
    
    // 切换到已选课程标签页
    switchToSelectedTab() {
      this.activeTab = 'selected';
      this.$nextTick(() => {
        console.log('切换到已选课程标签页');
        this.loadSelectedCourses();
      });
    },
    
    // 强制刷新课程数据
    forceRefreshCourses() {
      console.log('强制刷新课程数据');
      this.loadCourses().then(() => {
        this.$forceUpdate();
        this.$nextTick(() => {
          console.log('强制更新视图完成');
          console.log('已选课程数量:', this.selectedCourses.length);
        });
      });
    },
    
    async selectCourse(course) {
      if (!this.userInfo?.id) {
        Message.warning('请先登录');
        return;
      }

      if (this.isCourseSelected(course.id)) {
        Message.warning('您已选择此课程');
        return;
      }

      this.selectingCourse = course.id;
      
      try {
        const response = await courseAPI.select({
          courseId: course.id,
          studentId: this.userInfo.id
        });
        
        if (response.success) {
          Message.success(`已选择 ${course.name}`);
          // 重新加载课程数据
          await this.loadCourses();
        } else {
          Message.error(response.message || '选课失败');
        }
      } catch (error) {
        console.error('选课失败:', error);
        Message.error('选课失败，请稍后重试');
      } finally {
        this.selectingCourse = null;
      }
    },
    
    async dropCourse(courseId) {
      this.droppingCourse = courseId;
      
      try {
        const response = await courseAPI.drop({
          courseId: courseId,
          studentId: this.userInfo.id
        });
        
        if (response.success) {
          const course = this.selectedCourses.find(c => c.id === courseId);
          Message.success(`已退选 ${course ? course.name : '课程'}`);
          // 重新加载课程数据
          await this.loadCourses();
        } else {
          Message.error(response.message || '退课失败');
        }
      } catch (error) {
        console.error('退课失败:', error);
        Message.error('退课失败，请稍后重试');
      } finally {
        this.droppingCourse = null;
      }
    },
    
    onSearchInput() {
      console.log('搜索关键词:', this.searchKeyword);
    },
    
    logout() {
      this.$store.dispatch('logout');
      this.$router.push('/');
    }
  },
  
  data() {
    return {
      activeTab: 'selected',
      searchKeyword: '',
      courses: [],
      selectedCourses: [],
      teacherNamesCache: {},
      loading: false,
      selectingCourse: null,
      droppingCourse: null
    };
  },
  
  mounted() {
    console.log('StudentDashboardNew已挂载');
    console.log('当前用户信息:', this.userInfo);
    
    this.loadCourses();
    
    // 定期刷新数据
    this.refreshInterval = setInterval(() => {
      if (this.userInfo) {
        this.loadCourses();
      }
    }, 30000);
  },
  
  beforeDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
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

.refresh-btn {
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 20px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s;
  color: #666;
}

.refresh-btn:hover {
  background-color: #f0f0f0;
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