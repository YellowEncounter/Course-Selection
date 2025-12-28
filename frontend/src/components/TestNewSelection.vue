<template>
  <div class="test-container">
    <h1>测试新选课系统</h1>
    
    <div class="section">
      <h2>获取所有课程</h2>
      <button @click="loadAllCourses" :disabled="loading">加载所有课程</button>
      <div v-if="allCourses.length > 0">
        <h3>所有课程列表 ({{ allCourses.length }})</h3>
        <ul>
          <li v-for="course in allCourses" :key="course.id">
            {{ course.name }} (ID: {{ course.id }}) - {{ course.teacherName }}
          </li>
        </ul>
      </div>
    </div>
    
    <div class="section">
      <h2>获取学生已选课程</h2>
      <div class="input-group">
        <label>学生ID:</label>
        <input v-model="studentId" type="number" placeholder="输入学生ID" />
        <button @click="loadSelectedCourses" :disabled="loading || !studentId">获取已选课程</button>
      </div>
      <div v-if="selectedCourses.length > 0">
        <h3>已选课程列表 ({{ selectedCourses.length }})</h3>
        <ul>
          <li v-for="course in selectedCourses" :key="course.id">
            {{ course.name }} (ID: {{ course.id }}) - {{ course.teacherName }}
          </li>
        </ul>
      </div>
    </div>
    
    <div class="section">
      <h2>测试选课</h2>
      <div class="input-group">
        <label>学生ID:</label>
        <input v-model="testStudentId" type="number" placeholder="输入学生ID" />
        <label>课程ID:</label>
        <select v-model="testCourseId">
          <option value="" disabled>选择课程</option>
          <option v-for="course in allCourses" :key="course.id" :value="course.id">
            {{ course.name }}
          </option>
        </select>
        <button @click="testSelectCourse" :disabled="loading || !testStudentId || !testCourseId">
          选课
        </button>
      </div>
    </div>
    
    <div class="section">
      <h2>测试退课</h2>
      <div class="input-group">
        <label>学生ID:</label>
        <input v-model="testStudentId" type="number" placeholder="输入学生ID" />
        <label>课程ID:</label>
        <select v-model="testDropCourseId">
          <option value="" disabled>选择课程</option>
          <option v-for="course in selectedCourses" :key="course.id" :value="course.id">
            {{ course.name }}
          </option>
        </select>
        <button @click="testDropCourse" :disabled="loading || !testStudentId || !testDropCourseId">
          退课
        </button>
      </div>
    </div>
    
    <div class="section">
      <h2>日志</h2>
      <div class="log-container">
        <div v-for="(log, index) in logs" :key="index" class="log-entry">
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { courseAPI } from '@/api/course';

export default {
  name: 'TestNewSelection',
  data() {
    return {
      allCourses: [],
      selectedCourses: [],
      studentId: 202501,
      testStudentId: 202501,
      testCourseId: '',
      testDropCourseId: '',
      loading: false,
      logs: []
    };
  },
  methods: {
    addLog(message) {
      this.logs.unshift(`[${new Date().toLocaleTimeString()}] ${message}`);
      // 保持日志条数在50条以内
      if (this.logs.length > 50) {
        this.logs = this.logs.slice(0, 50);
      }
    },
    
    async loadAllCourses() {
      this.loading = true;
      this.addLog('开始加载所有课程...');
      
      try {
        const response = await courseAPI.getAll();
        if (response.success) {
          this.allCourses = response.data || [];
          this.addLog(`成功加载所有课程，共${this.allCourses.length}门`);
        } else {
          this.addLog(`加载所有课程失败: ${response.message}`);
        }
      } catch (error) {
        this.addLog(`加载所有课程异常: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    
    async loadSelectedCourses() {
      if (!this.studentId) {
        this.addLog('请输入学生ID');
        return;
      }
      
      this.loading = true;
      this.addLog(`开始加载学生${this.studentId}的已选课程...`);
      
      try {
        const response = await courseAPI.getStudentSelectedCourses({
          studentId: parseInt(this.studentId)
        });
        
        if (response.success) {
          this.selectedCourses = response.data || [];
          this.addLog(`成功加载学生已选课程，共${this.selectedCourses.length}门`);
        } else {
          this.addLog(`加载学生已选课程失败: ${response.message}`);
        }
      } catch (error) {
        this.addLog(`加载学生已选课程异常: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    
    async testSelectCourse() {
      if (!this.testStudentId || !this.testCourseId) {
        this.addLog('请输入学生ID和选择课程');
        return;
      }
      
      this.loading = true;
      this.addLog(`开始选课: 学生${this.testStudentId}选择课程${this.testCourseId}`);
      
      try {
        const response = await courseAPI.select({
          courseId: parseInt(this.testCourseId),
          studentId: parseInt(this.testStudentId)
        });
        
        if (response.success) {
          this.addLog(`选课成功: ${response.message}`);
          // 选课成功后，重新加载该学生的已选课程
          if (this.testStudentId == this.studentId) {
            await this.loadSelectedCourses();
          }
        } else {
          this.addLog(`选课失败: ${response.message}`);
        }
      } catch (error) {
        this.addLog(`选课异常: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    
    async testDropCourse() {
      if (!this.testStudentId || !this.testDropCourseId) {
        this.addLog('请输入学生ID和选择要退选的课程');
        return;
      }
      
      this.loading = true;
      this.addLog(`开始退课: 学生${this.testStudentId}退选课程${this.testDropCourseId}`);
      
      try {
        const response = await courseAPI.drop({
          courseId: parseInt(this.testDropCourseId),
          studentId: parseInt(this.testStudentId)
        });
        
        if (response.success) {
          this.addLog(`退课成功: ${response.message}`);
          // 退课成功后，重新加载该学生的已选课程
          if (this.testStudentId == this.studentId) {
            await this.loadSelectedCourses();
          }
        } else {
          this.addLog(`退课失败: ${response.message}`);
        }
      } catch (error) {
        this.addLog(`退课异常: ${error.message}`);
      } finally {
        this.loading = false;
      }
    }
  },
  
  mounted() {
    this.addLog('测试页面已加载');
    // 自动加载所有课程
    this.loadAllCourses();
  }
};
</script>

<style scoped>
.test-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.section {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.input-group label {
  min-width: 70px;
}

.input-group input, .input-group select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.input-group button {
  padding: 8px 15px;
  background-color: #409EFF;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.input-group button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  padding: 10px;
  background-color: #f9f9f9;
}

.log-entry {
  padding: 5px;
  border-bottom: 1px solid #eee;
  font-family: monospace;
  font-size: 12px;
}

ul {
  padding-left: 20px;
}

li {
  margin-bottom: 5px;
}
</style>