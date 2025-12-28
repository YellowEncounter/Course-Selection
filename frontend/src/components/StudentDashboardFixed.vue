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
      <button @click="refreshCourses" class="refresh-btn">
        <i class="el-icon-refresh"></i> 刷新
      </button>
    </div>
    
    <div class="content">
      <!-- 已选课程 -->
      <div v-if="activeTab === 'selected'" class="card">
        <div v-if="loading" class="loading-state">
          <i class="el-icon-loading"></i>
          <p>正在加载课程数据...</p>
        </div>
        
        <div v-else>
          <div v-if="selectedCourses.length > 0" class="selected-list">
            <h3 style="margin-bottom: 1rem; color: #333;">已选课程 ({{ selectedCourses.length }}门)</h3>
            
            <div v-for="(course, index) in selectedCourses" :key="index" class="selected-item">
              <div class="course-info">
                <h3>{{ course.name }}</h3>
                <p><i class="el-icon-user"></i> 授课老师: {{ course.teacherName }}</p>
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
            
            <!-- 学分总结 -->
            <div class="credit-summary">
              <p>已选课程总数: {{ selectedCourses.length }}</p>
              <p>总学分: {{ totalCredit }}</p>
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
        </div>
      </div>
      
      <!-- 所有课程 -->
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
              ></el-input>
            </div>
            
            <div class="course-grid">
              <div class="course-card" v-for="course in filteredCourses" :key="course.id">
                <div class="course-header">
                  <h3>{{ course.name }}</h3>
                  <span class="credit">学分: {{ course.credit }}</span>
                </div>
                <div class="course-info">
                  <p><i class="el-icon-user"></i> 授课老师: {{ course.teacherName }}</p>
                  <p><i class="el-icon-time"></i> {{ course.time }}</p>
                  <p><i class="el-icon-people"></i> 剩余名额: {{ course.maxStudents - getStudentCount(course) }}/{{ course.maxStudents }}</p>
                  <p class="desc">{{ course.description || '暂无描述' }}</p>
                </div>
                <button 
                  class="select-btn" 
                  @click="selectCourse(course)"
                  :disabled="isCourseSelected(course.id) || getStudentCount(course) >= course.maxStudents || selectingCourse === course.id"
                >
                  <span v-if="selectingCourse === course.id">
                    <i class="el-icon-loading"></i> 处理中...
                  </span>
                  <span v-else>
                    {{ isCourseSelected(course.id) ? '已选' : (getStudentCount(course) >= course.maxStudents ? '名额已满' : '选择') }}
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
    
    // 获取学生数量
    getStudentCount(course) {
      if (!course) return 0;
      
      let students = course.students || '[]';
      
      if (typeof students === 'string') {
        try {
          students = JSON.parse(students);
        } catch (e) {
          students = [];
        }
      }
      
      if (!Array.isArray(students)) {
        students = [];
      }
      
      return students.length;
    },
    
    // 加载所有课程
    async loadCourses() {
      try {
        this.loading = true;
        
        if (!this.userInfo || !this.userInfo.id) {
          Message.warning('请先登录');
          return;
        }
        
        const response = await courseAPI.getAll();
        
        if (response && (response.success || response.data)) {
          this.courses = Array.isArray(response.data) ? response.data : [];
        } else {
          this.courses = [];
        }
        
        // 加载学生已选课程
        await this.loadSelectedCourses();
        
      } catch (error) {
        console.error('加载课程数据失败:', error);
        Message.error('加载课程数据失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },
    
    // 加载学生已选课程
    async loadSelectedCourses() {
      try {
        if (!this.userInfo || !this.userInfo.id) {
          this.selectedCourses = [];
          return;
        }
        
        const response = await courseAPI.getStudentSelectedCourses({
          studentId: this.userInfo.id
        });
        
        if (response && (response.success || response.data)) {
          this.selectedCourses = Array.isArray(response.data) ? response.data : [];
        } else {
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
      this.loadSelectedCourses();
    },
    
    // 刷新课程数据
    refreshCourses() {
      this.loadCourses();
    },
    
    // 选课
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
        
        if (response && response.success) {
          Message.success(`已选择 ${course.name}`);
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
    
    // 退课
    async dropCourse(courseId) {
      this.droppingCourse = courseId;
      
      try {
        const response = await courseAPI.drop({
          courseId: courseId,
          studentId: this.userInfo.id
        });
        
        if (response && response.success) {
          const course = this.selectedCourses.find(c => c.id === courseId);
          Message.success(`已退选 ${course ? course.name : '课程'}`);
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
    
    // 退出
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
      loading: false,
      selectingCourse: null,
      droppingCourse: null
    };
  },
  
  mounted() {
    this.loadCourses();
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