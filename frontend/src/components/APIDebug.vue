<template>
  <div class="debug-container">
    <h1>API调试工具</h1>
    
    <div class="test-section">
      <h2>获取所有课程</h2>
      <button @click="testGetAllCourses" :disabled="loading">测试</button>
      <div class="result" v-if="allCoursesResult">
        <h3>结果:</h3>
        <pre>{{ allCoursesResult }}</pre>
      </div>
    </div>
    
    <div class="test-section">
      <h2>获取学生已选课程</h2>
      <input v-model="studentId" type="number" placeholder="学生ID" />
      <button @click="testGetStudentSelectedCourses" :disabled="loading">测试</button>
      <div class="result" v-if="selectedCoursesResult">
        <h3>结果:</h3>
        <pre>{{ selectedCoursesResult }}</pre>
      </div>
    </div>
    
    <div class="test-section">
      <h2>选课</h2>
      <input v-model="selectStudentId" type="number" placeholder="学生ID" />
      <input v-model="selectCourseId" type="number" placeholder="课程ID" />
      <button @click="testSelectCourse" :disabled="loading">测试</button>
      <div class="result" v-if="selectResult">
        <h3>结果:</h3>
        <pre>{{ selectResult }}</pre>
      </div>
    </div>
    
    <div class="test-section">
      <h2>退课</h2>
      <input v-model="dropStudentId" type="number" placeholder="学生ID" />
      <input v-model="dropCourseId" type="number" placeholder="课程ID" />
      <button @click="testDropCourse" :disabled="loading">测试</button>
      <div class="result" v-if="dropResult">
        <h3>结果:</h3>
        <pre>{{ dropResult }}</pre>
      </div>
    </div>
    
    <div class="test-section">
      <h2>网络请求详情</h2>
      <div class="request-details" v-if="requestDetails">
        <h3>最新请求:</h3>
        <p><strong>URL:</strong> {{ requestDetails.url }}</p>
        <p><strong>方法:</strong> {{ requestDetails.method }}</p>
        <p><strong>状态码:</strong> {{ requestDetails.status }}</p>
        <p><strong>响应头:</strong> <pre>{{ JSON.stringify(requestDetails.headers, null, 2) }}</pre></p>
        <p><strong>请求数据:</strong> <pre>{{ JSON.stringify(requestDetails.data, null, 2) }}</pre></p>
        <p><strong>响应数据:</strong> <pre>{{ JSON.stringify(requestDetails.response, null, 2) }}</pre></p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'APIDebug',
  data() {
    return {
      loading: false,
      studentId: '202501',
      selectStudentId: '202503',
      selectCourseId: '13',
      dropStudentId: '202503',
      dropCourseId: '13',
      allCoursesResult: '',
      selectedCoursesResult: '',
      selectResult: '',
      dropResult: '',
      requestDetails: null
    };
  },
  methods: {
    async testGetAllCourses() {
      this.loading = true;
      this.requestDetails = null;
      
      try {
        const response = await axios.get('/pbl/getAllCourses');
        this.allCoursesResult = JSON.stringify(response.data, null, 2);
        this.requestDetails = {
          url: '/pbl/getAllCourses',
          method: 'GET',
          status: response.status,
          headers: response.headers,
          data: {},
          response: response.data
        };
      } catch (error) {
        this.allCoursesResult = JSON.stringify(error.response?.data || error.message, null, 2);
        this.requestDetails = {
          url: '/pbl/getAllCourses',
          method: 'GET',
          status: error.response?.status || 'N/A',
          headers: error.response?.headers || {},
          data: {},
          response: error.response?.data || error.message
        };
      } finally {
        this.loading = false;
      }
    },
    
    async testGetStudentSelectedCourses() {
      this.loading = true;
      this.requestDetails = null;
      
      try {
        const response = await axios.get('/course/getStudentSelectedCourses', {
          params: { studentId: parseInt(this.studentId) }
        });
        this.selectedCoursesResult = JSON.stringify(response.data, null, 2);
        this.requestDetails = {
          url: '/course/getStudentSelectedCourses',
          method: 'GET',
          status: response.status,
          headers: response.headers,
          data: { studentId: parseInt(this.studentId) },
          response: response.data
        };
      } catch (error) {
        this.selectedCoursesResult = JSON.stringify(error.response?.data || error.message, null, 2);
        this.requestDetails = {
          url: '/course/getStudentSelectedCourses',
          method: 'GET',
          status: error.response?.status || 'N/A',
          headers: error.response?.headers || {},
          data: { studentId: parseInt(this.studentId) },
          response: error.response?.data || error.message
        };
      } finally {
        this.loading = false;
      }
    },
    
    async testSelectCourse() {
      this.loading = true;
      this.requestDetails = null;
      
      try {
        const response = await axios.post('/api/course/selectCourse', {
          courseId: parseInt(this.selectCourseId),
          studentId: parseInt(this.selectStudentId)
        });
        this.selectResult = JSON.stringify(response.data, null, 2);
        this.requestDetails = {
          url: '/api/course/selectCourse',
          method: 'POST',
          status: response.status,
          headers: response.headers,
          data: {
            courseId: parseInt(this.selectCourseId),
            studentId: parseInt(this.selectStudentId)
          },
          response: response.data
        };
      } catch (error) {
        this.selectResult = JSON.stringify(error.response?.data || error.message, null, 2);
        this.requestDetails = {
          url: '/api/course/selectCourse',
          method: 'POST',
          status: error.response?.status || 'N/A',
          headers: error.response?.headers || {},
          data: {
            courseId: parseInt(this.selectCourseId),
            studentId: parseInt(this.selectStudentId)
          },
          response: error.response?.data || error.message
        };
      } finally {
        this.loading = false;
      }
    },
    
    async testDropCourse() {
      this.loading = true;
      this.requestDetails = null;
      
      try {
        const response = await axios.post('/api/course/dropCourse', {
          courseId: parseInt(this.dropCourseId),
          studentId: parseInt(this.dropStudentId)
        });
        this.dropResult = JSON.stringify(response.data, null, 2);
        this.requestDetails = {
          url: '/api/course/dropCourse',
          method: 'POST',
          status: response.status,
          headers: response.headers,
          data: {
            courseId: parseInt(this.dropCourseId),
            studentId: parseInt(this.dropStudentId)
          },
          response: response.data
        };
      } catch (error) {
        this.dropResult = JSON.stringify(error.response?.data || error.message, null, 2);
        this.requestDetails = {
          url: '/api/course/dropCourse',
          method: 'POST',
          status: error.response?.status || 'N/A',
          headers: error.response?.headers || {},
          data: {
            courseId: parseInt(this.dropCourseId),
            studentId: parseInt(this.dropStudentId)
          },
          response: error.response?.data || error.message
        };
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.debug-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

.test-section {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.test-section input {
  margin: 0 10px 10px 0;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 150px;
}

.test-section button {
  padding: 8px 15px;
  background-color: #409EFF;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
}

.test-section button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.result {
  margin-top: 15px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.result pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 300px;
  overflow-y: auto;
}

.request-details p {
  margin: 5px 0;
}

.request-details pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
}
</style>