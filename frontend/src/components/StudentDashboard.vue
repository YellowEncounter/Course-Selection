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
      <button :class="{active: activeTab === 'schedule'}" @click="activeTab = 'schedule'">课程表</button>
      <button @click="forceRefreshCourses" class="refresh-btn">
        <i class="el-icon-refresh"></i> 刷新
      </button>
    </div>
    
    <div class="content">
      <div v-if="activeTab === 'allCourses'" class="card">
        <div v-if="loading" class="loading-state">
          <i class="el-icon-loading"></i>
          <p>正在加载课程数据...</p>
        </div>
        <div v-else>
          <!-- 只有在courses数组存在且有数据时才显示 -->
          <div v-if="Array.isArray(courses) && courses.length > 0">
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
              <div class="course-card" v-for="course in filteredCourses" :key="course.id" :class="{ 'has-conflict': hasConflict(course.id) }">
                <div class="course-header">
                  <h3>{{ course.name }}</h3>
                  <span class="credit">学分: {{ course.credit }}</span>
                </div>
                <!-- 时间冲突警告 -->
                <div v-if="hasConflict(course.id)" class="conflict-warning">
                  <i class="el-icon-warning"></i>
                  <span>{{ getConflictReason(course.id) }}</span>
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
                  :disabled="isSelected(course.id) || getStudentCount(course) >= (course.maxStudents || 0) || selectingCourse === course.id || hasConflict(course.id)"
                >
                  <span v-if="selectingCourse === course.id">
                    <i class="el-icon-loading"></i> 处理中...
                  </span>
                  <span v-else>
                    {{ isSelected(course.id) ? '已选' : (hasConflict(course.id) ? '时间冲突' : (getStudentCount(course) >= (course.maxStudents || 0) ? '名额已满' : '选择')) }}
                  </span>
                </button>
              </div>
            </div>
          
          <!-- 无数据时的空状态 -->
          <div v-if="!Array.isArray(courses) || courses.length === 0" class="empty-state">
            <i class="el-icon-book-reader"></i>
            <p>暂无课程数据</p>
          </div>
        </div>
      </div>
      
      <div v-if="activeTab === 'selected'" class="card">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <i class="el-icon-loading"></i>
          <p>正在加载课程数据...</p>
        </div>
        
        <!-- 非加载状态 - 确保与加载状态互斥 -->
        <div v-else>
          <!-- 调试信息 -->
          <div class="debug-info" style="background-color: #f0f0f0; padding: 10px; margin-bottom: 10px; font-size: 12px;">
            <p>调试信息:</p>
            <p>课程数据数量: {{ courses.length }}</p>
            <p>学生ID: {{ userInfo?.id }}</p>
            <p>已选课程数量: {{ selectedCourses.length }}</p>
            <p>计算属性结果: {{ selectedCourses.length }}</p>
            <p>activeTab: {{ activeTab }}</p>
            <p>loading: {{ loading }}</p>
            <!-- 显示实际的已选课程数据用于调试 -->
            <p>已选课程数据: {{ JSON.stringify(selectedCourses) }}</p>
          </div>
          
          <!-- 已选课程列表 - 使用简单的条件判断 -->
          <div v-if="selectedCourses && selectedCourses.length > 0" class="selected-list">
            <div class="selected-header">
              <h3>已选课程 ({{ selectedCourses.length }}门)</h3>
              <button @click="activeTab = 'schedule'" class="view-schedule-btn">
                <i class="el-icon-date"></i> 查看课程表
              </button>
            </div>
            
            <!-- 使用索引确保渲染 -->
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
          
          <!-- 已选课程空状态 - 明确的条件 -->
          <div v-else class="empty-state">
            <i class="el-icon-book-reader"></i>
            <p>暂无已选课程</p>
            <p style="font-size: 12px; color: #666; margin-top: 1rem;">
              如果您已选择课程但看不到列表，请点击"刷新"按钮
            </p>
          </div>
          
          <!-- 学分总结 -->
          <div v-if="selectedCourses && selectedCourses.length > 0" class="credit-summary">
            <p>已选课程总数: {{ selectedCourses.length }}</p>
            <p>总学分: {{ totalCredit }}</p>
          </div>
        </div>
      </div>

      <!-- 课程表标签页 -->
      <div v-if="activeTab === 'schedule'" class="schedule-container">
        <CourseSchedule
          :courses="selectedCourses"
          :conflicts="courseConflicts"
          title="我的课程表"
          :isTeacherView="false"
          @refresh="refreshSchedule"
        />
      </div>
    </div>
  </div>
  </div>
</template>

<script>
import { Message } from 'element-ui';
import { mapState } from 'vuex';
import { courseAPI } from '@/api/course';
import CourseSchedule from '@/components/CourseSchedule.vue';
import { checkCourseConflict, getAllConflicts } from '@/utils/courseTimeUtils';


export default {
  components: {
    CourseSchedule
  },
  computed: {
    ...mapState(['userInfo']),
    filteredCourses() {
      // 确保courses是数组且searchKeyword存在
      if (!Array.isArray(this.courses) || !this.searchKeyword) {
        return this.courses || [];
      }
      return this.courses.filter(course => 
        course && course.name && 
        course.name.toLowerCase().includes(this.searchKeyword.toLowerCase())
      );
    },
    selectedCourses() {
      // 关键修复：确保计算属性能够正确响应数据变化
      console.log('🔄 [computed] selectedCourses 计算属性被调用');
      
      // 强制依赖forceUpdate，确保数据变化时重新计算
      const forceUpdate = this.forceUpdate;
      
      const studentId = String(this.userInfo?.id || '');
      if (!studentId) {
        console.warn('⚠️ [警告] 学生ID为空，无法获取已选课程');
        return [];
      }
      
      if (!Array.isArray(this.courses)) {
        console.warn('⚠️ [警告] 课程数据不是数组，无法筛选已选课程');
        return [];
      }
      
      // 关键修复：深度检查每个课程的学生数据
      const selected = this.courses.filter(course => {
        if (!course || !course.id) return false;
        
        // 确保获取最新的students数据
        const students = this.getStudentsArray(course.students);
        
        // 关键：实时检查学生是否在课程中
        const isSelected = students.map(String).includes(studentId);
        
        // 调试信息
        if (isSelected) {
          console.log(`   ✅ 课程 ${course.name} (ID:${course.id}) 包含学生 ${studentId}`);
        }
        
        return isSelected;
      });
      
      console.log('✅ [结果] selectedCourses 更新完成:');
      console.log(`   学生ID: ${studentId}`);
      console.log(`   总课程数: ${this.courses.length}`);
      console.log(`   已选课程数: ${selected.length}`);
      console.log(`   forceUpdate标志: ${forceUpdate}`);
      
      if (selected.length > 0) {
        console.log('   已选课程列表:');
        selected.forEach((c, idx) => {
          console.log(`      [${idx + 1}] ${c.name} (ID:${c.id}) - ${c.time}`);
        });
      }
      
      return selected;
    },
    totalCredit() {
      // 直接在计算属性中处理
      if (!Array.isArray(this.selectedCourses)) {
        return 0;
      }
      return this.selectedCourses.reduce((sum, course) => {
        const credit = parseInt(course.credit || 0);
        return sum + (isNaN(credit) ? 0 : credit);
      }, 0);
    },
    courseConflicts() {
      // 检查所有课程与已选课程的冲突
      console.log('🔍 [computed] courseConflicts 计算属性被调用');
      
      if (!Array.isArray(this.courses) || !Array.isArray(this.selectedCourses)) {
        console.log('⚠️ [警告] 课程数据或已选课程不是数组');
        return new Map();
      }
      
      console.log(`   总课程数: ${this.courses.length}`);
      console.log(`   已选课程数: ${this.selectedCourses.length}`);
      
      const conflicts = getAllConflicts(this.courses, this.selectedCourses);
      
      console.log('');
      if (conflicts.size > 0) {
        console.log(`⚠️ [冲突] 检测到 ${conflicts.size} 个时间冲突:`);
        conflicts.forEach((conflict, courseId) => {
          const course = this.courses.find(c => c.id === courseId);
          if (course) {
            console.log(`   ⚠️ ${course.name} (ID:${courseId})`);
            console.log(`      ${conflict.reason}`);
          }
        });
      } else {
        console.log('✅ [冲突] 未检测到时间冲突');
      }
      console.log('');
      
      return conflicts;
    }
  },
  methods: {
    // 获取已选课程 - 使用方法而不是计算属性
    getSelectedCourses() {
      // 从课程数据中筛选当前学生已选的课程
      const studentId = String(this.userInfo?.id || '');
      if (!studentId) {
        console.warn('学生ID为空，无法获取已选课程');
        return [];
      }
      
      if (!Array.isArray(this.courses)) {
        console.warn('课程数据不是数组，无法筛选已选课程');
        return [];
      }
      
      const selected = this.courses.filter(course => {
        if (!course || !course.id) return false;
        
        const students = this.getStudentsArray(course.students);
        // 确保数据类型一致，都转换为字符串比较
        return students.map(String).includes(studentId);
      });
      
      console.log('getSelectedCourses方法调用结果:', {
        studentId,
        totalCourses: this.courses.length,
        selectedCount: selected.length,
        selectedCourses: selected.map(c => ({id: c.id, name: c.name}))
      });
      
      return selected;
    },
    
    // 检查并修复Vue响应式问题
    ensureReactivity() {
      // 如果数据存在但视图不更新，尝试强制更新
      if (this.selectedCourses.length > 0) {
        console.log('检测到已选课程数据，尝试强制更新视图');
        this.$forceUpdate();
        
        // 使用Vue.set确保响应式
        this.selectedCourses.forEach((course, index) => {
          this.$set(this.selectedCourses, index, {...course});
        });
      }
    },
    
    // 辅助方法：安全获取并解析students数组
    getStudentsArray(students) {
      // 默认值为空数组
      if (!students) return [];
      
      // 如果已经是数组，直接返回
      if (Array.isArray(students)) return students;
      
      // 如果是字符串，尝试解析为JSON
      if (typeof students === 'string') {
        try {
          // 如果字符串已经是数组格式，直接解析
          if (students.trim().startsWith('[')) {
            const parsed = JSON.parse(students);
            return Array.isArray(parsed) ? parsed : [];
          }
          // 如果是逗号分隔的字符串，转换为数组
          else if (students.includes(',')) {
            return students.split(',').map(id => id.trim()).filter(id => id);
          }
          // 如果是单个数字，转换为数组
          else if (students.trim() !== '') {
            return [students.trim()];
          }
          return [];
        } catch (e) {
          console.warn('解析students数据失败:', e, students);
          return [];
        }
      }
      
      // 其他情况返回空数组
      return [];
    },
    
    // 获取教师信息 - 使用缓存避免重复请求
    async getTeacherName(teacherId) {
      // 如果已缓存，直接返回
      if (this.teacherNamesCache[teacherId]) {
        return this.teacherNamesCache[teacherId];
      }
      
      try {
        // 使用teacherAPI获取教师信息
        const { teacherAPI } = await import('@/api/user');
        const response = await teacherAPI.get();
        const teachers = response.data || [];
        const teacher = teachers.find(t => t.id == teacherId);
        const name = teacher ? teacher.name : '未知';
        
        // 缓存结果
        this.teacherNamesCache[teacherId] = name;
        return name;
      } catch (error) {
        console.error('获取教师信息失败：', error);
        // 缓存错误结果，避免重复请求
        this.teacherNamesCache[teacherId] = '未知';
        return '未知';
      }
    },
    // 加载课程数据
    async loadCourses() {
      this.loading = true;
      try {
        console.log('正在加载课程数据...');
        
        // 检查用户权限
        if (!this.userInfo || !this.userInfo.id) {
          Message.warning('请先登录');
          this.courses = [];
          return;
        }
        
        // 尝试从API获取数据
        try {
          const response = await courseAPI.getAll();
          let courses = response.data || [];
          console.log('原始课程数据:', courses);
          
          // 规范化课程数据，确保students字段是数组
          courses = courses.map(course => {
            // 使用辅助方法处理students字段
            return {
              ...course,
              students: this.getStudentsArray(course.students)
            };
          });
          
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
        
        // 预加载教师信息
        this.preloadTeacherNames();
        
        // 关键修复：多重数据同步确保界面正确显示
        console.log('🔄 [数据加载] 课程数据加载完成');
        console.log(`   总课程数: ${this.courses.length}`);
        console.log(`   已选课程数: ${this.selectedCourses.length}`);
        
        // 输出冲突检测结果
        if (this.courseConflicts.size > 0) {
          console.log('');
          console.log('⚠️ [冲突警告] 检测到时间冲突:');
          this.courseConflicts.forEach((conflict, courseId) => {
            const course = this.courses.find(c => c.id === courseId);
            if (course) {
              console.log(`   ⚠️ ${course.name} (${course.time})`);
              console.log(`      原因: ${conflict.reason}`);
            }
          });
        } else {
          console.log('✅ [冲突检测] 当前无时间冲突');
        }
        console.log('');
        
        // 关键修复：多重强制更新确保数据同步
        this.$nextTick(() => {
          console.log('🔄 [第一轮同步] 强制更新视图');
          this.$forceUpdate();
          
          // 第二轮更新：触发计算属性重新计算
          setTimeout(() => {
            console.log('🔄 [第二轮同步] 触发计算属性更新');
            this.forceUpdate = !this.forceUpdate;
            
            // 第三轮更新：再次强制视图更新
            this.$nextTick(() => {
              console.log('🔄 [第三轮同步] 再次强制更新视图');
              this.$forceUpdate();
              
              // 第四轮更新：延迟确保最终状态
              setTimeout(() => {
                console.log('🔄 [第四轮同步] 最终状态检查');
                console.log('   当前已选课程数量:', this.selectedCourses.length);
                console.log('   当前课程数据状态:', this.courses.map(c => ({
                  id: c.id,
                  name: c.name,
                  students: this.getStudentsArray(c.students)
                })));
                
                // 确保响应式问题已修复
                this.ensureReactivity();
              }, 50);
            });
          }, 50);
        });
      } catch (error) {
        console.error('加载课程数据失败:', error);
        Message.error('加载课程数据失败：' + error.message);
        this.courses = []; // 确保设置为空数组，避免undefined错误
      } finally {
        this.loading = false;
      }
    },
    
    // 预加载所有教师信息，提高UI响应速度
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
      
      // 确保数据类型一致，都转换为字符串比较
      return students.map(String).includes(studentId);
    },
    async selectCourse(course) {
      if (!this.userInfo?.id) {
        Message.warning('请先登录');
        return;
      }

      // 检查是否已选择
      if (this.isSelected(course.id)) {
        Message.warning('您已选择此课程');
        return;
      }

      // ========== 冲突检测开始 ==========
      console.log(''.padStart(60, '='));
      console.log('🚨 [学生选课] 开始时间冲突检测');
      console.log(''.padStart(60, '='));

      // 严格检查时间冲突 - 使用实时数据重新检测
      const currentSelected = this.getSelectedCourses();
      
      console.log('📋 [数据]');
      console.log(`   待选课程: ${course.name} (ID:${course.id}, 教师:${course.teacherId})`);
      console.log(`   待选时间: ${course.time}`);
      console.log(`   已选课程数: ${currentSelected.length}`);
      
      if (currentSelected.length > 0) {
        console.log('   已选课程列表:');
        currentSelected.forEach((c, idx) => {
          console.log(`      [${idx + 1}] ${c.name} (ID:${c.id}, 教师:${c.teacherId}) - ${c.time}`);
        });
      } else {
        console.log('   暂无已选课程');
      }
      
      console.log('');
      console.log('🔍 [检测中...');
      
      // 强制冲突检测：检查所有已选课程，不管是否是同一个老师
      const conflictInfo = checkCourseConflict(course, currentSelected);
      
      if (conflictInfo) {
        console.log('');
        console.log('❌❌❌ [结果] 发现时间冲突，拒绝选课 ❌❌❌');
        console.log(`   冲突原因: ${conflictInfo.reason}`);
        console.log(`   冲突课程: ${conflictInfo.conflictCourse.name} (ID:${conflictInfo.conflictCourse.id}, 教师:${conflictInfo.conflictCourse.teacherId})`);
        console.log('');
        console.log(''.padStart(60, '='));
        
        Message.error(`选课失败：${conflictInfo.reason}`);
        return;
      }
      
      console.log('');
      console.log('✅ [结果] 时间冲突检测通过，允许选课');
      console.log(''.padStart(60, '='));
      console.log('');

      // 检查课程人数上限
      const currentStudents = this.getStudentsArray(course.students);
      
      if (currentStudents.length >= (course.maxStudents || 0)) {
        Message.warning('该课程已达人数上限');
        return;
      }

      // 禁用按钮，防止重复点击
      this.selectingCourse = course.id;
      
      try {
        console.log('正在选择课程:', course.id, '学生ID:', this.userInfo.id, '学生ID类型:', typeof this.userInfo.id);

        // 确保studentId是数字类型
        const studentIdNum = parseInt(this.userInfo.id);
        console.log('转换后的学生ID:', studentIdNum, '类型:', typeof studentIdNum);

        const response = await courseAPI.select({
          courseId: course.id,
          studentId: studentIdNum  // 确保传递数字类型
        });

        console.log('选课API响应:', response);

        // 检查是否成功
        if (response.success === false) {
          throw new Error(response.message || '选课失败');
        }

        // 立即更新本地数据，避免等待API
        const courseIndex = this.courses.findIndex(c => c.id === course.id);
        if (courseIndex !== -1) {
          // 将当前学生添加到课程中
          const course = this.courses[courseIndex];
          const students = this.getStudentsArray(course.students);
          if (!students.includes(String(this.userInfo.id))) {
            students.push(String(this.userInfo.id));
            course.students = students;
            // 确保Vue响应式更新
            this.$set(this.courses, courseIndex, {...course});
          }
        }

        // 重新加载数据以确保数据同步
        await this.loadCourses();

        // 显示成功消息
        const msg = response.message || '选课成功';
        Message.success(msg);

        // 强制更新视图
        this.forceUpdate = !this.forceUpdate;
        this.$nextTick(() => {
          this.$forceUpdate();
        });

        // 触发全局数据同步事件
        const eventData = {
          type: 'select',
          courseId: course.id,
          courseName: course.name,
          teacherId: course.teacherId,
          studentId: studentIdNum,
          studentName: this.userInfo.name,
          timestamp: Date.now()
        };

        console.log('学生端触发全局事件:', eventData);
        this.$root.$emit('course-data-changed', eventData);
      } catch (error) {
        console.error('选课失败:', error);
        
        // 根据错误类型显示不同的错误信息
        let errorMessage = '选课失败';
        if (error.message) {
          errorMessage += '：' + error.message;
        }
        
        Message.error(errorMessage);
        
        // 出错时也重新加载数据，确保状态正确
        await this.loadCourses();
      } finally {
        this.selectingCourse = null;
      }
    },
    async dropCourse(courseId) {
      // 禁用按钮，防止重复点击
      this.droppingCourse = courseId;

      try {
        console.log('🚨 [退课操作] 开始执行退课流程');
        console.log('   课程ID:', courseId);
        console.log('   学生ID:', this.userInfo.id, '类型:', typeof this.userInfo.id);

        // 确保studentId是字符串类型（与数据库保持一致）
        const studentIdStr = String(this.userInfo.id);
        console.log('   转换后的学生ID:', studentIdStr, '类型:', typeof studentIdStr);

        // 调用API前先检查当前状态
        console.log('   [退课前状态检查]');
        const courseBefore = this.courses.find(c => c.id === courseId);
        if (courseBefore) {
          console.log('   课程信息:', courseBefore.name);
          console.log('   当前学生列表:', this.getStudentsArray(courseBefore.students));
          console.log('   当前学生是否在课程中:', this.isSelected(courseId));
        }

        // 调用API
        console.log('   [调用API]');
        const response = await courseAPI.drop({
          courseId: courseId,
          studentId: studentIdStr
        });

        console.log('   API响应:', response);

        // 检查是否成功
        if (response.success === false || (response.error && !response.success)) {
          console.error('❌ API返回失败状态:', response);
          throw new Error(response.message || response.error || '退课失败');
        }

        console.log('✅ API调用成功，开始更新前端状态');

        // 关键修复：立即且强制更新本地数据状态
        const courseIndex = this.courses.findIndex(c => c.id === courseId);
        if (courseIndex !== -1) {
          console.log('   [更新本地数据] 找到课程索引:', courseIndex);
          
          // 创建新的课程对象，确保Vue响应式
          const updatedCourse = {
            ...this.courses[courseIndex],
            students: this.getStudentsArray(this.courses[courseIndex].students)
          };
          
          // 从学生列表中移除当前学生
          const studentIndex = updatedCourse.students.indexOf(String(this.userInfo.id));
          if (studentIndex > -1) {
            console.log('   找到学生索引:', studentIndex, '，执行移除');
            updatedCourse.students.splice(studentIndex, 1);
            
            // 关键：使用Vue.set确保响应式更新
            this.$set(this.courses, courseIndex, updatedCourse);
            console.log('   本地数据更新完成，新学生列表:', updatedCourse.students);
          } else {
            console.warn('⚠️ 本地数据中未找到学生，可能已移除');
          }
        }

        // 关键修复：强制重新计算计算属性
        console.log('   [强制重新计算]');
        this.forceUpdate = !this.forceUpdate;
        
        // 立即触发视图更新
        this.$nextTick(() => {
          console.log('   [视图更新] 强制更新视图');
          this.$forceUpdate();
          
          // 再次触发计算属性重新计算
          setTimeout(() => {
            this.forceUpdate = !this.forceUpdate;
            console.log('   [延迟更新] 计算属性重新计算');
            
            // 显示成功消息
            const msg = response.message || '退课成功';
            Message.success(msg);
            
            console.log('✅ [退课完成] 所有状态更新完成');
          }, 50);
        });

        // 触发全局数据同步事件
        console.log('   [全局事件] 通知其他组件');
        this.$root.$emit('course-data-changed', {
          type: 'drop',
          courseId: courseId,
          studentId: studentIdNum,
          studentName: this.userInfo.name,
          timestamp: Date.now()
        });

        // 关键修复：在成功后退课2秒后强制重新加载数据，确保绝对同步
        setTimeout(async () => {
          console.log('🔄 [最终同步] 2秒后重新加载数据确保同步');
          await this.loadCourses();
        }, 2000);

      } catch (error) {
        console.error('❌ [退课失败]', error);
        
        // 显示错误消息
        let errorMessage = '退课失败';
        if (error.message) {
          errorMessage += '：' + error.message;
        }
        Message.error(errorMessage);
        
        // 出错时也重新加载数据，确保状态正确
        console.log('🔄 [错误恢复] 重新加载数据');
        await this.loadCourses();
      } finally {
        this.droppingCourse = null;
        console.log('🏁 [退课流程结束]');
      }
    },
    // 添加搜索输入处理函数
    onSearchInput() {
      // 可以在这里添加防抖逻辑，提高性能
      console.log('搜索关键词:', this.searchKeyword);
    },
    
    // 安全获取学生数量
    getStudentCount(course) {
      if (!course) return 0;
      
      let students = course.students || [];
      
      // 如果是字符串，尝试解析为JSON
      if (typeof students === 'string') {
        try {
          students = JSON.parse(students);
        } catch (e) {
          console.warn('解析students数据失败:', e, course.students);
          students = [];
        }
      }
      
      // 确保是数组
      if (!Array.isArray(students)) {
        students = [];
      }
      
      return students.length;
    },
    logout() {
      this.$store.dispatch('logout');
      this.$router.push('/');
    },
    
    // 切换到已选课程标签页
    switchToSelectedTab() {
      this.activeTab = 'selected';
      // 确保数据正确显示
      this.$nextTick(() => {
        this.ensureReactivity();
        this.$forceUpdate();
      });
    },
    
    // 强制刷新课程数据
    forceRefreshCourses() {
      console.log('手动刷新课程数据');
      this.loadCourses().then(() => {
        // 切换forceUpdate标志以强制重新计算计算属性
        this.forceUpdate = !this.forceUpdate;
        
        // 刷新完成后强制更新视图
        this.$forceUpdate();
        this.$nextTick(() => {
          console.log('强制更新视图完成');
          console.log('已选课程数量:', this.selectedCourses.length);
          
          // 确保响应式更新
          setTimeout(() => {
            this.$forceUpdate();
          }, 100);
        });
      });
    },

    // 检查课程是否有时间冲突
    hasConflict(courseId) {
      return this.courseConflicts.has(courseId);
    },

    // 获取冲突原因
    getConflictReason(courseId) {
      const conflict = this.courseConflicts.get(courseId);
      return conflict ? conflict.reason : '';
    },

    // 检查是否有新数据更新
    checkForNewData() {
      const currentSelectedCount = this.selectedCourses.length;
      if (this.previousSelectedCount !== undefined && currentSelectedCount !== this.previousSelectedCount) {
        Message.info('课程状态已更新');
      }
      this.previousSelectedCount = currentSelectedCount;
    },

    // 刷新课程表
    async refreshSchedule() {
      await this.loadCourses();
    },

    // 测试渲染方法
    testRender() {
      console.log('=== 测试渲染逻辑 ===');
      
      // 强制触发计算属性重新计算
      this.forceUpdate = !this.forceUpdate;
      
      // 检查模板条件
      const isCorrectTab = this.activeTab === 'selected';
      const isLoading = this.loading;
      const hasData = this.selectedCourses && this.selectedCourses.length > 0;
      
      console.log('模板条件检查:', {
        isCorrectTab,
        isLoading,
        hasData,
        selectedCoursesLength: this.selectedCourses ? this.selectedCourses.length : 0
      });
      
      // 强制更新视图
      this.$forceUpdate();
      
      // 延迟再次更新
      setTimeout(() => {
        this.forceUpdate = !this.forceUpdate;
        this.$forceUpdate();
        console.log('延迟强制更新完成');
      }, 100);
    },
    
    // 调试函数 - 在浏览器控制台中使用
    debugSelectedCourses() {
      console.log('=== 调试已选课程 ===');
      console.log('当前用户信息:', this.userInfo);
      console.log('所有课程数据:', this.courses);
      console.log('已选课程:', this.selectedCourses);
      console.log('当前标签页:', this.activeTab);
      console.log('加载状态:', this.loading);
      
      // 检查每个课程的students字段
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
  data() {
    return {
      activeTab: 'selected', // 默认显示已选课程
      searchKeyword: '',
      courses: [], // 本地课程数据
      teacherNamesCache: {}, // 教师名称缓存
      loading: false, // 加载状态
      selectingCourse: null, // 正在选择中的课程ID
      droppingCourse: null, // 正在退选中的课程ID
      forceUpdate: false, // 用于强制更新计算属性
      previousSelectedCount: undefined // 用于检测数据变化
    };
  },
  mounted() {
    console.log('StudentDashboard已挂载，开始加载课程数据...');
    console.log('当前用户信息:', this.userInfo);
    
    // 添加错误捕获
    try {
      this.loadCourses();
    } catch (error) {
      console.error('加载课程数据时发生错误:', error);
      this.loading = false;
    }
    
    // 定期刷新数据（每20秒），确保数据同步
    this.refreshInterval = setInterval(() => {
      if (this.userInfo) { // 只有在用户登录状态下才刷新
        try {
          this.loadCourses();
          this.checkForNewData();
        } catch (error) {
          console.error('定期刷新课程数据时发生错误:', error);
        }
      }
    }, 20000);
  },
  
  beforeDestroy() {
    // 清除定时器，防止内存泄漏
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  },
  
  // 添加错误捕获钩子
  errorCaptured(err, vm, info) {
    console.error('StudentDashboard组件捕获到错误:', err, info);
    // 显示友好的错误提示
    Message.error('页面发生错误，请刷新重试');
    // 返回false阻止错误继续向上传播
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

.course-card.has-conflict {
  border-color: #f56c6c;
  background-color: #fff5f7;
}

.course-card.has-conflict:hover {
  box-shadow: 0 10px 20px rgba(245, 108, 108, 0.2);
}

.conflict-warning {
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #f56c6c;
  font-size: 0.9rem;
}

.conflict-warning i {
  font-size: 1.1rem;
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

.schedule-container {
  background-color: #fff;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.selected-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.selected-header h3 {
  margin: 0;
  color: #333;
}

.view-schedule-btn {
  background-color: #e1f5fe;
  color: #0288d1;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.view-schedule-btn:hover {
  background-color: #b3e5fc;
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