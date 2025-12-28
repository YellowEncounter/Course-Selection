<template>
  <div class="api-test-container">
    <h1>API测试页面</h1>
    
    <div class="test-section">
      <h2>获取所有课程</h2>
      <button @click="testGetAllCourses" :disabled="loading">测试</button>
      <div v-if="allCourses.length > 0">
        <h3>结果：找到 {{ allCourses.length }} 门课程</h3>
      </div>
    </div>
    
    <div class="test-section">
      <h2>获取学生已选课程</h2>
      <input v-model="testStudentId" type="number" placeholder="输入学生ID" />
      <button @click="testGetStudentSelectedCourses" :disabled="loading">测试</button>
      <div v-if="selectedCourses.length > 0">
        <h3>结果：找到 {{ selectedCourses.length }} 门已选课程</h3>
      </div>
    </div>
    
    <div class="test-section">
      <h2>选课测试</h2>
      <input v-model="selectStudentId" type="number" placeholder="输入学生ID" />
      <input v-model="selectCourseId" type="number" placeholder="输入课程ID" />
      <button @click="testSelectCourse" :disabled="loading">测试</button>
      <div v-if="selectResult">
        <h3>选课结果：{{ selectResult }}</h3>
      </div>
    </div>
    
    <div class="test-section">
      <h2>退课测试</h2>
      <input v-model="dropStudentId" type="number" placeholder="输入学生ID" />
      <input v-model="dropCourseId" type="number" placeholder="输入课程ID" />
      <button @click="testDropCourse" :disabled="loading">测试</button>
      <div v-if="dropResult">
        <h3>退课结果：{{ dropResult }}</h3>
      </div>
    </div>
    
    <div class="test-section">
      <h2>控制台日志</h2>
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
  name: 'ApiTest',
  data() {
    return {
      loading: false,
      allCourses: [],
      selectedCourses: [],
      testStudentId: '202501',
      selectStudentId: '202503',
      selectCourseId: '13',
      dropStudentId: '202503',
      dropCourseId: '13',
      selectResult: '',
      dropResult: '',
      logs: []
    };
  },
  methods: {
    addLog(message) {
      this.logs.unshift(`[${new Date().toLocaleTimeString()}] ${message}`);
      if (this.logs.length > 20) {
        this.logs = this.logs.slice(0, 20);
      }
    },
    
    async testGetAllCourses() {
      this.loading = true;
      this.addLog('开始测试获取所有课程...');
      
      try {
        const response = await courseAPI.getAll();
        this.addLog(`API调用成功: ${JSON.stringify(response)}`);
        this.allCourses = response.data || [];
        this.addLog(`获取到 ${this.allCourses.length} 门课程`);
      } catch (error) {
        this.addLog(`API调用失败: ${error.message}`);
        console.error('获取所有课程失败:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async testGetStudentSelectedCourses() {
      if (!this.testStudentId) {
        this.addLog('请输入学生ID');
        return;
      }
      
      this.loading = true;
      this.addLog(`开始测试获取学生${this.testStudentId}的已选课程...`);
      
      try {
        const response = await courseAPI.getStudentSelectedCourses({
          studentId: parseInt(this.testStudentId)
        });
        this.addLog(`API调用成功: ${JSON.stringify(response)}`);
        this.selectedCourses = response.data || [];
        this.addLog(`获取到 ${this.selectedCourses.length} 门已选课程`);
      } catch (error) {
        this.addLog(`API调用失败: ${error.message}`);
        console.error('获取学生已选课程失败:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async testSelectCourse() {
      if (!this.selectStudentId || !this.selectCourseId) {
        this.addLog('请输入学生ID和课程ID');
        return;
      }
      
      this.loading = true;
      this.selectResult = '';
      this.addLog(`开始测试选课: 学生${this.selectStudentId}选择课程${this.selectCourseId}`);
      
      try {
        const response = await courseAPI.select({
          courseId: parseInt(this.selectCourseId),
          studentId: parseInt(this.selectStudentId)
        });
        this.addLog(`API调用成功: ${JSON.stringify(response)}`);
        this.selectResult = response.message || (response.success ? '选课成功' : '选课失败');
      } catch (error) {
        this.addLog(`API调用失败: ${error.message}`);
        this.selectResult = '选课失败';
        console.error('选课失败:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async testDropCourse() {
      if (!this.dropStudentId || !this.dropCourseId) {
        this.addLog('请输入学生ID和课程ID');
        return;
      }
      
      this.loading = true;
      this.dropResult = '';
      this.addLog(`开始测试退课: 学生${this.dropStudentId}退选课程${this.dropCourseId}`);
      
      try {
        const response = await courseAPI.drop({
          courseId: parseInt(this.dropCourseId),
          studentId: parseInt(this.dropStudentId)
        });
        this.addLog(`API调用成功: ${JSON.stringify(response)}`);
        this.dropResult = response.message || (response.success ? '退课成功' : '退课失败');
      } catch (error) {
        this.addLog(`API调用失败: ${error.message}`);
        this.dropResult = '退课失败';
        console.error('退课失败:', error);
      } finally {
        this.loading = false;
      }
    }
  },
  
  mounted() {
    this.addLog('API测试页面已加载');
  }
};
</script>

<style scoped>
.api-test-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.test-section h2 {
  margin-top: 0;
}

.test-section input {
  margin-right: 10px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 3px;
}

.test-section button {
  padding: 5px 15px;
  background-color: #409EFF;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.test-section button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #eee;
  padding: 10px;
  background-color: #f9f9f9;
}

.log-entry {
  padding: 3px;
  border-bottom: 1px solid #eee;
  font-family: monospace;
  font-size: 12px;
}
</style>