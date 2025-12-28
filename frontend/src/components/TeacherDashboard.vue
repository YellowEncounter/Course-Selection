<template>
  <div class="teacher-container">
    <div class="header">
      <h1>教师中心</h1>
      <div class="user-info">
        <span>欢迎，{{ userInfo.name }}（教师）</span>
        <button @click="logout" class="logout-btn">退出</button>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="tabs">
      <button @click="forceRefresh" class="refresh-btn">
        <i class="el-icon-refresh"></i> 刷新
      </button>
    </div>
    
    <div class="content">
      <!-- 课程管理 -->
      <div class="card">
        <div class="card-header">
          <h2>我的课程</h2>
          <button @click="openAddCourseDialog" class="add-btn">新增课程</button>
        </div>
        
        <!-- 空状态 -->
        <div v-if="!loading && teacherCourses.length === 0" class="empty-state">
          <i class="el-icon-document"></i>
          <p>暂无课程，点击"新增课程"开始添加</p>
        </div>
        
        <!-- 课程表格 -->
        <el-table
          v-else-if="!loading"
          :data="teacherCourses"
          border
          class="course-table"
          stripe
        >
          <el-table-column prop="id" label="课程ID" width="80" align="center"></el-table-column>
          <el-table-column prop="name" label="课程名称" min-width="120"></el-table-column>
          <el-table-column prop="credit" label="学分" width="80" align="center"></el-table-column>
          <el-table-column prop="time" label="上课时间" min-width="100"></el-table-column>
          <el-table-column label="已选人数" width="120" align="center">
            <template slot-scope="scope">
              {{ getStudentCount(scope.row.students) }}/{{ scope.row.maxStudents }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" align="center">
            <template slot-scope="scope">
              <button @click="editCourse(scope.row)" class="edit-btn">编辑</button>
              <button @click="deleteCourse(scope.row.id)" class="delete-btn">删除</button>
              <button @click="viewStudents(scope.row)" class="view-btn">查看学生</button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    
    <!-- 学生列表弹窗 -->
    <el-dialog :visible.sync="studentDialogVisible" title="选课学生列表" width="800px">
      <div class="dialog-header-info">
        <span>课程：{{ currentCourseName }}</span>
        <span>已选人数：{{ currentCourseStudents.length }}/{{ currentCourseMaxStudents }}</span>
        <el-button @click="refreshCurrentStudents" size="small" icon="el-icon-refresh">刷新</el-button>
      </div>
      <el-table :data="currentCourseStudents" border v-loading="studentsLoading">
        <el-table-column prop="id" label="学生ID" width="120" align="center"></el-table-column>
        <el-table-column prop="name" label="学生姓名" width="120" align="center"></el-table-column>
        <el-table-column prop="college" label="学院" width="150" align="center"></el-table-column>
        <el-table-column prop="class" label="班级" width="150" align="center"></el-table-column>
        <el-table-column prop="status" label="状态" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ scope.row.status === 'active' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
    
    <!-- 新增/编辑课程弹窗 -->
    <el-dialog :visible.sync="dialogVisible" :title="isEdit ? '编辑课程' : '新增课程'" width="400px">
      <el-form :model="form" :rules="rules" ref="form">
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="form.name"></el-input>
        </el-form-item>
        <el-form-item label="学分" prop="credit">
          <el-input v-model="form.credit" type="number" min="0"></el-input>
        </el-form-item>
        <el-form-item label="上课时间" prop="timeSlotId">
          <div class="time-select-container">
            <el-select 
              v-model="form.timeSlotId" 
              placeholder="选择上课时间" 
              style="width: 100%"
              size="medium"
            >
              <el-option-group
                v-for="(slots, weekday) in timeSlotGroups"
                :key="weekday"
                :label="weekday"
              >
                <el-option
                  v-for="slot in slots"
                  :key="slot.id"
                  :label="slot.label"
                  :value="slot.id"
                  :disabled="!isTimeSlotAvailable(slot.id)"
                >
                  <div class="time-option-content">
                    <div class="time-label">{{ slot.label }}</div>
                    <div class="time-range">{{ slot.timeRange }}</div>
                  </div>
                </el-option>
              </el-option-group>
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="人数上限" prop="maxStudents">
          <el-input v-model="form.maxStudents" type="number" min="1"></el-input>
        </el-form-item>
        <el-form-item label="课程简介" prop="desc">
          <el-input v-model="form.desc" type="textarea" rows="3"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <button @click="dialogVisible = false" class="cancel-btn">取消</button>
        <button @click="submitForm" class="confirm-btn">确认</button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { Message } from 'element-ui';
import { mapState } from 'vuex';
import { courseAPI } from '@/api/course';
import { 
  getTimeSlotsByWeekday, 
  isTimeSlotAvailable, 
  getTimeSlotById,
  parseTimeSlotFromTimeString 
} from '@/utils/timeSlots';

export default {
  components: {},
  computed: {
    ...mapState(['userInfo']),
    teacherCourses() {
      return this.courses.filter(course => course.teacherId == this.userInfo?.id);
    },
    totalStudentCount() {
      return this.teacherCourses.reduce((sum, course) => {
        return sum + this.getStudentCount(course.students);
      }, 0);
    }
  },
  methods: {
    // 加载课程数据
    async loadCourses() {
      this.loading = true;
      try {
        const response = await courseAPI.getTeacherCourses({ teacherId: this.userInfo?.id });
        this.courses = response.data || [];
      } catch (error) {
        Message.error('加载课程数据失败：' + error.message);
      } finally {
        this.loading = false;
      }
    },
    // 检查时间段是否可用
    isTimeSlotAvailable(timeSlotId) {
      return isTimeSlotAvailable(timeSlotId, this.teacherCourses, this.isEdit ? this.form.id : null);
    },

    openAddCourseDialog() {
      this.isEdit = false;
      this.form = { 
        id: '', 
        name: '', 
        credit: '', 
        timeSlotId: '', // 使用时间段ID
        time: '', // 保持兼容性
        desc: '',
        maxStudents: 30,  // 默认上限30人
        teacherId: this.userInfo?.id,  // 自动关联当前教师
        students: []  // 初始为空数组
      };
      this.dialogVisible = true;
    },
    editCourse(row) {
      this.isEdit = true;
      this.form = { 
        ...row,
        // 尝试从time字段解析timeSlotId
        timeSlotId: row.timeSlotId || parseTimeSlotFromTimeString(row.time) || ''
      };
      this.dialogVisible = true;
    },
    async deleteCourse(id) {
      try {
        await courseAPI.delete({ id });
        await this.loadCourses();
        Message.success('删除成功');
      } catch (error) {
        Message.error('删除失败：' + error.message);
      }
    },
    async viewStudents(course) {
      this.currentCourseId = course.id;
      this.currentCourseName = course.name;
      this.currentCourseMaxStudents = course.maxStudents || 0;
      this.studentDialogVisible = true;
      this.studentsLoading = true;
      
      try {
        // 调用API获取课程的学生详细信息
        const { courseStudentAPI } = await import('@/api/user');
        const response = await courseStudentAPI.getCourseStudents(course.id);
        this.currentCourseStudents = response.data || [];
      } catch (error) {
        console.error('获取学生信息失败:', error);
        Message.error('获取学生信息失败：' + error.message);
        this.currentCourseStudents = [];
      } finally {
        this.studentsLoading = false;
      }
    },

    // 刷新当前课程学生列表
    async refreshCurrentStudents() {
      if (!this.currentCourseId) return;
      this.studentsLoading = true;
      
      try {
        const { courseStudentAPI } = await import('@/api/user');
        const response = await courseStudentAPI.getCourseStudents(this.currentCourseId);
        this.currentCourseStudents = response.data || [];
        Message.success('学生列表已刷新');
      } catch (error) {
        console.error('刷新学生信息失败:', error);
        Message.error('刷新失败：' + error.message);
      } finally {
        this.studentsLoading = false;
      }
    },

    // 强制刷新所有数据
    async forceRefresh() {
      await this.loadCourses();
      Message.success('数据已刷新');
    },

    // 检查未处理的事件
    checkPendingEvents() {
      try {
        const pendingEvent = localStorage.getItem('course-data-changed');
        const eventTimestamp = localStorage.getItem('course-data-changed-timestamp');
        
        if (pendingEvent && eventTimestamp) {
          const eventData = JSON.parse(pendingEvent);
          const eventAge = Date.now() - parseInt(eventTimestamp);
          
          // 只处理最近10秒内的事件
          if (eventAge < 10000) {
            console.log('发现未处理的事件:', eventData);
            this.handleGlobalDataChange(eventData);
            
            // 清除已处理的事件
            localStorage.removeItem('course-data-changed');
            localStorage.removeItem('course-data-changed-timestamp');
          }
        }
      } catch (error) {
        console.error('检查未处理事件失败:', error);
      }
    },

    // 处理localStorage变化
    handleStorageChange(event) {
      if (event.key === 'course-data-changed') {
        try {
          console.log('教师端检测到localStorage变化');
          const eventData = JSON.parse(event.newValue);
          this.handleGlobalDataChange(eventData);
        } catch (error) {
          console.error('解析localStorage事件失败:', error);
        }
      }
    },

    // 处理全局数据变化
    async handleGlobalDataChange(eventData) {
      console.log('教师端收到数据变化事件:', eventData);
      
      // 如果是选课/退课事件，立即刷新数据并发送通知
      if (eventData.type === 'select' || eventData.type === 'drop') {
        // 检查是否是自己的课程
        const affectedCourse = this.teacherCourses.find(c => c.id === eventData.courseId);
        if (affectedCourse) {
          console.log(`自己的课程有变化: ${affectedCourse.name}，立即刷新`);
          
          // 立即更新本地数据，避免等待API
          const courseIndex = this.courses.findIndex(c => c.id === eventData.courseId);
          if (courseIndex !== -1) {
            const course = this.courses[courseIndex];
            if (eventData.type === 'select') {
              // 添加学生到课程
              const students = this.getStudentsArray(course.students);
              if (!students.includes(String(eventData.studentId))) {
                students.push(String(eventData.studentId));
                course.students = students;
                this.$set(this.courses, courseIndex, {...course});
              }
            } else if (eventData.type === 'drop') {
              // 从课程中移除学生
              const students = this.getStudentsArray(course.students);
              const studentIndex = students.indexOf(String(eventData.studentId));
              if (studentIndex > -1) {
                students.splice(studentIndex, 1);
                course.students = students;
                this.$set(this.courses, courseIndex, {...course});
              }
            }
          }
          
          // 重新加载数据以确保数据同步
          await this.loadCourses();
          
          // 构建详细的通知消息
          let notificationMsg = '';
          if (eventData.type === 'select') {
            const action = eventData.studentName 
              ? `学生 ${eventData.studentName}(${eventData.studentId})`
              : `学生 ${eventData.studentId}`;
            
            // 计算剩余名额
            const currentStudents = this.getStudentCount(affectedCourse.students);
            const remainingSlots = (affectedCourse.maxStudents || 0) - currentStudents;
            const slotsInfo = `（剩余名额：${remainingSlots}/${affectedCourse.maxStudents || 0}）`;
            
            notificationMsg = `${action} 成功选择课程《${eventData.courseName || affectedCourse.name}》${slotsInfo}`;
          } else {
            notificationMsg = `有学生退选了课程《${affectedCourse.name}》`;
          }
          
          // 显示详细通知
          Message({
            message: notificationMsg,
            type: 'info',
            duration: 5000,
            showClose: true
          });
          
          // 如果是选课且名额即将满员，发送警告
          if (eventData.type === 'select') {
            const currentStudents = this.getStudentCount(affectedCourse.students);
            const remainingSlots = (affectedCourse.maxStudents || 0) - currentStudents;
            
            if (remainingSlots <= 3 && remainingSlots > 0) {
              Message({
                message: `课程《${eventData.courseName || affectedCourse.name}》名额即将满员，剩余 ${remainingSlots} 个名额！`,
                type: 'warning',
                duration: 6000,
                showClose: true
              });
            }
          }
        }
      }
    },
    async submitForm() {
      this.$refs.form.validate(async valid => {
        if (valid) {
          try {
            // 获取时间段信息并转换为时间字符串
            const timeSlot = getTimeSlotById(this.form.timeSlotId);
            const courseData = {
              ...this.form,
              time: timeSlot ? timeSlot.label : this.form.time, // 兼容旧的time字段
              teacherId: this.userInfo?.id
            };

            if (this.isEdit) {
              await courseAPI.update(courseData);
              Message.success('编辑成功');
            } else {
              await courseAPI.add(courseData);
              Message.success('新增课程成功');
            }
            
            await this.loadCourses();
            this.dialogVisible = false;
          } catch (error) {
            Message.error('操作失败：' + error.message);
          }
        }
      });
    },
    logout() {
      this.$store.dispatch('logout');
      this.$router.push('/');
    },
    
    // 安全获取学生数量
    getStudentCount(students) {
      if (!students) return 0;
      
      // 如果已经是数组，直接返回长度
      if (Array.isArray(students)) return students.length;
      
      // 如果是字符串，尝试解析为JSON
      if (typeof students === 'string') {
        try {
          // 如果字符串已经是数组格式，直接解析
          if (students.trim().startsWith('[')) {
            const parsed = JSON.parse(students);
            return Array.isArray(parsed) ? parsed.length : 0;
          }
          // 如果是逗号分隔的字符串，转换为数组
          else if (students.includes(',')) {
            return students.split(',').filter(id => id.trim()).length;
          }
          // 如果是单个数字，返回1
          else if (students.trim() !== '') {
            return 1;
          }
          return 0;
        } catch (e) {
          console.warn('解析students数据失败:', e, students);
          return 0;
        }
      }
      
      // 其他情况返回0
      return 0;
    }
  },
  data() {
    return {
      loading: false,
      dialogVisible: false,
      studentDialogVisible: false,
      studentsLoading: false,
      currentCourseId: null,
      currentCourseName: '',
      currentCourseMaxStudents: 0,
      currentCourseStudents: [], // 当前课程的学生详细信息
      isEdit: false,
      courses: [], // 本地课程数据
      form: {
        id: '',
        name: '',
        credit: '',
        timeSlotId: '', // 改为时间段ID
        time: '', // 保持兼容性
        desc: '',
        maxStudents: 40,
        teacherId: '',
        students: []
      },
      rules: {
        name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
        credit: [{ required: true, message: '请输入学分', trigger: 'blur' }],
        timeSlotId: [{ required: true, message: '请选择上课时间', trigger: 'change' }],
        maxStudents: [{ required: true, message: '请输入人数上限', trigger: 'blur' }],
        desc: [] // 简介改为可选
      },
      timeSlotGroups: getTimeSlotsByWeekday()
    };
  },
  mounted() {
    this.loadCourses();
    
    // 设置定时刷新，每20秒刷新一次数据，与学生端同步
    this.refreshInterval = setInterval(() => {
      if (this.userInfo) {
        this.loadCourses();
      }
    }, 20000);
    
    // 监听全局数据变化事件
    this.$root.$on('course-data-changed', this.handleGlobalDataChange);
    
    // 监听localStorage变化（跨页面同步）
    window.addEventListener('storage', this.handleStorageChange);
    
    // 检查是否有未处理的事件
    this.checkPendingEvents();
  },
  beforeDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    // 移除全局事件监听
    this.$root.$off('course-data-changed', this.handleGlobalDataChange);
    // 移除storage监听
    window.removeEventListener('storage', this.handleStorageChange);
  }
};
</script>

<style scoped>
.teacher-container {
  padding: 2rem;
  background-color: #f0f7ff;
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
  border: 1px solid #e3f2fd;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  color: #666;
  transition: all 0.3s;
}

.logout-btn:hover {
  background-color: #e3f2fd;
}

/* 标签页样式 */
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
  background-color: #e1f5fe;
  color: #0288d1;
  font-weight: 600;
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
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #f5f5f5;
}

h2 {
  color: #555;
  font-size: 1.2rem;
  margin: 0;
}

.add-btn {
  background-color: #e1f5fe;
  color: #0288d1;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.add-btn:hover {
  background-color: #b3e5fc;
}

.course-table {
  width: 100%;
  margin: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #999;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #ddd;
}

.empty-state p {
  font-size: 0.95rem;
  margin: 0;
}

.edit-btn {
  background-color: #e8f5e9;
  color: #2e7d32;
  border: none;
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  cursor: pointer;
  margin-right: 0.5rem;
}

.delete-btn {
  background-color: #ffebee;
  color: #c62828;
  border: none;
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  cursor: pointer;
  margin-right: 0.5rem;
}

.view-btn {
  background-color: #e0f7fa;
  color: #00695c;
  border: none;
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  cursor: pointer;
}

.cancel-btn {
  background-color: #f5f5f5;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  margin-right: 0.5rem;
}

.confirm-btn {
  background-color: #e1f5fe;
  color: #0288d1;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
}

/* 表格样式优化 */
::v-deep .el-table {
  border-radius: 0.5rem;
  overflow: hidden;
}

::v-deep .el-table th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

::v-deep .el-table tr:hover > td {
  background-color: #f0f7ff !important;
}

/* 弹窗样式优化 */
::v-deep .el-dialog {
  border-radius: 0.75rem;
}

::v-deep .el-dialog__header {
  border-bottom: 1px solid #f5f5f5;
  padding: 1.25rem 1.5rem;
}

::v-deep .el-dialog__title {
  color: #333;
  font-weight: 600;
}

::v-deep .el-dialog__body {
  padding: 1.5rem;
}

::v-deep .el-dialog__footer {
  border-top: 1px solid #f5f5f5;
  padding: 1rem 1.5rem;
}

/* 表单样式优化 */
::v-deep .el-form-item__label {
  color: #606266;
  font-weight: 500;
}

::v-deep .el-input__inner {
  border-radius: 6px;
}

::v-deep .el-input__inner:focus {
  border-color: #0288d1;
}

/* 学生列表弹窗样式 */
.dialog-header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  margin-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.95rem;
  color: #666;
}

.dialog-header-info span {
  margin-right: 1rem;
}

/* 时间选择优化样式 */
.time-select-container {
  width: 100%;
}

::v-deep .time-option-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

::v-deep .time-option-content .time-label {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

::v-deep .time-option-content .time-range {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

::v-deep .el-select-dropdown__item.is-disabled {
  background-color: #f5f5f5;
  color: #c0c4cc;
}

::v-deep .el-select-dropdown__item.is-disabled .time-label {
  color: #c0c4cc;
  text-decoration: line-through;
}




</style>