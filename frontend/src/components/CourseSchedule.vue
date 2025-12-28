<template>
  <div class="course-schedule">
    <div class="schedule-header">
      <h2>{{ title }}</h2>
      <el-button @click="refreshSchedule" size="small" :loading="loading">
        <i class="el-icon-refresh"></i> 刷新
      </el-button>
    </div>

    <!-- PC端课程表 -->
    <div class="schedule-pc" v-loading="loading">
      <div class="schedule-container">
        <!-- 表头 -->
        <div class="schedule-header-row">
          <div class="schedule-cell time-cell">时间</div>
          <div 
            v-for="day in weekdays" 
            :key="day" 
            class="schedule-cell weekday-cell"
          >
            {{ day }}
          </div>
        </div>

        <!-- 表格内容 -->
        <div 
          v-for="(period, rowIndex) in periods" 
          :key="rowIndex" 
          class="schedule-row"
        >
          <div class="schedule-cell time-cell">
            <div class="period-label">{{ period.label }}</div>
            <div class="time-range">{{ period.time }}</div>
          </div>
          <div 
            v-for="(day, colIndex) in weekdays" 
            :key="colIndex" 
            class="schedule-cell course-cell"
            :class="{
              'has-course': getCourseCell(rowIndex, colIndex),
              'conflict': hasConflict(rowIndex, colIndex)
            }"
            :style="getCellStyle(rowIndex, colIndex)"
            @click="handleCellClick(rowIndex, colIndex)"
          >
            <div v-if="getCourseCell(rowIndex, colIndex)" class="course-item">
              <div class="course-name">{{ getCourseCell(rowIndex, colIndex).name }}</div>
              <div class="course-info">
                <template v-if="isTeacherView">
                  <i class="el-icon-user"></i>
                  <span>{{ getStudentCount(getCourseCell(rowIndex, colIndex).students) }}名学生</span>
                  <div class="course-progress">
                    <div class="progress-bar">
                      <div 
                        class="progress-fill" 
                        :style="{ width: getProgressPercentage(getCourseCell(rowIndex, colIndex)) + '%' }"
                      ></div>
                    </div>
                    <span class="progress-text">{{ getProgressText(getCourseCell(rowIndex, colIndex)) }}</span>
                  </div>
                </template>
                <template v-else>
                  <i class="el-icon-user"></i>
                  <span v-if="getCourseCell(rowIndex, colIndex).teacherName">
                    {{ getCourseCell(rowIndex, colIndex).teacherName }}
                  </span>
                  <div class="course-status">
                    <span class="slots-info">{{ getSlotsText(getCourseCell(rowIndex, colIndex)) }}</span>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 移动端课程表 -->
    <div class="schedule-mobile" v-loading="loading">
      <el-tabs v-model="activeMobileTab" type="card">
        <el-tab-pane 
          v-for="(day, index) in weekdays" 
          :key="index"
          :label="day"
          :name="String(index)"
        >
          <div class="mobile-day-schedule">
            <div 
              v-for="(period, periodIndex) in periods" 
              :key="periodIndex"
              class="mobile-period-item"
            >
              <div class="period-label">{{ period.label }}</div>
              <div class="period-time">{{ period.time }}</div>
              <div 
                v-if="getCourseCell(periodIndex, index)" 
                class="mobile-course-item"
                :style="{ backgroundColor: getCourseColor(getCourseCell(periodIndex, index).id) }"
              >
                <div class="course-name">{{ getCourseCell(periodIndex, index).name }}</div>
                <div class="course-teacher">
                  <template v-if="isTeacherView">
                    <i class="el-icon-user"></i>
                    {{ getCourseCell(periodIndex, index).studentCount || 0 }}名学生
                  </template>
                  <template v-else>
                    <i class="el-icon-user"></i>
                    {{ getCourseCell(periodIndex, index).teacherName }}
                  </template>
                </div>
              </div>
              <div v-else class="mobile-empty-cell">
                <span>无课程</span>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 统计信息 -->
    <div class="schedule-summary">
      <div class="summary-item">
        <span class="summary-label">已选课程：</span>
        <span class="summary-value">{{ courses.length }} 门</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">总学分：</span>
        <span class="summary-value">{{ totalCredit }} 学分</span>
      </div>
      <div class="summary-item" v-if="hasConflicts">
        <span class="summary-label warning">⚠️ 时间冲突：</span>
        <span class="summary-value warning">{{ conflictCount }} 处</span>
      </div>
    </div>

    <!-- 课程详情弹窗 -->
    <el-dialog 
      :visible.sync="detailDialogVisible" 
      title="课程详情" 
      width="500px"
    >
      <div v-if="selectedCourse" class="course-detail">
        <div class="detail-row">
          <span class="detail-label">课程名称：</span>
          <span class="detail-value">{{ selectedCourse.name }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">上课时间：</span>
          <span class="detail-value">{{ selectedCourse.time }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">授课老师：</span>
          <span class="detail-value">{{ selectedCourse.teacherName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">学分：</span>
          <span class="detail-value">{{ selectedCourse.credit }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">课程描述：</span>
          <span class="detail-value">{{ selectedCourse.description || selectedCourse.desc || '暂无描述' }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { parseCourseTime, getScheduleRow, getCourseColor } from '@/utils/courseTimeUtils';

export default {
  name: 'CourseSchedule',
  props: {
    courses: {
      type: Array,
      default: () => []
    },
    conflicts: {
      type: Map,
      default: () => new Map()
    },
    title: {
      type: String,
      default: '我的课程表'
    },
    isTeacherView: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      activeMobileTab: '0',
      detailDialogVisible: false,
      selectedCourse: null,
      weekdays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      periods: [
        { label: '第1-2节', time: '08:00-10:00' },
        { label: '第3-4节', time: '10:00-12:00' },
        { label: '第5-6节', time: '14:00-16:00' },
        { label: '第7-8节', time: '16:00-18:00' },
        { label: '第9-10节', time: '19:00-21:00' }
      ],
      scheduleGrid: [] // 5x7 课程表网格
    };
  },
  computed: {
    totalCredit() {
      return this.courses.reduce((sum, course) => {
        const credit = parseInt(course.credit || 0);
        return sum + (isNaN(credit) ? 0 : credit);
      }, 0);
    },
    hasConflicts() {
      return this.conflicts && this.conflicts.size > 0;
    },
    conflictCount() {
      return this.conflicts ? this.conflicts.size : 0;
    }
  },
  watch: {
    courses: {
      handler: 'buildScheduleGrid',
      immediate: true
    }
  },
  methods: {
    /**
     * 构建课程表网格
     */
    buildScheduleGrid() {
      // 初始化5x7网格
      this.scheduleGrid = Array(5).fill(null).map(() => Array(7).fill(null));

      this.courses.forEach(course => {
        const parsedTime = parseCourseTime(course.time);
        if (parsedTime) {
          const rowIndex = getScheduleRow(parsedTime.startTime);
          const colIndex = parsedTime.weekday;

          if (rowIndex >= 0 && rowIndex < 5 && colIndex >= 0 && colIndex < 7) {
            this.scheduleGrid[rowIndex][colIndex] = course;
          }
        }
      });
    },

    /**
     * 获取指定单元格的课程
     */
    getCourseCell(rowIndex, colIndex) {
      if (!this.scheduleGrid[rowIndex] || !this.scheduleGrid[rowIndex][colIndex]) {
        return null;
      }
      return this.scheduleGrid[rowIndex][colIndex];
    },

    /**
     * 获取单元格样式
     */
    getCellStyle(rowIndex, colIndex) {
      const course = this.getCourseCell(rowIndex, colIndex);
      if (!course) return {};

      const style = {
        backgroundColor: getCourseColor(course.id)
      };

      // 如果有冲突，添加冲突样式
      if (this.conflicts.has(course.id)) {
        style.border = '3px solid #f56c6c';
      }

      return style;
    },

    /**
     * 检查单元格是否有冲突
     */
    hasConflict(rowIndex, colIndex) {
      const course = this.getCourseCell(rowIndex, colIndex);
      return course && this.conflicts.has(course.id);
    },

    /**
     * 处理单元格点击
     */
    handleCellClick(rowIndex, colIndex) {
      const course = this.getCourseCell(rowIndex, colIndex);
      if (course) {
        this.selectedCourse = course;
        this.detailDialogVisible = true;
      }
    },

    /**
     * 刷新课程表
     */
    async refreshSchedule() {
      this.loading = true;
      try {
        await this.$emit('refresh');
      } catch (error) {
        console.error('刷新课程表失败:', error);
        this.$message.error('刷新失败');
      } finally {
        this.loading = false;
      }
    },

    /**
     * 获取课程颜色
     */
    getCourseColor(courseId) {
      return getCourseColor(courseId);
    },

    /**
     * 获取学生数量
     */
    getStudentCount(students) {
      if (!students) return 0;
      if (Array.isArray(students)) return students.length;
      if (typeof students === 'string') {
        try {
          const parsed = JSON.parse(students);
          return Array.isArray(parsed) ? parsed.length : 0;
        } catch (e) {
          return students.split(',').filter(id => id.trim()).length;
        }
      }
      return 0;
    },

    /**
     * 获取选课进度百分比
     */
    getProgressPercentage(course) {
      const current = this.getStudentCount(course.students);
      const max = course.maxStudents || 0;
      return max > 0 ? Math.min((current / max) * 100, 100) : 0;
    },

    /**
     * 获取进度文本
     */
    getProgressText(course) {
      const current = this.getStudentCount(course.students);
      const max = course.maxStudents || 0;
      return `${current}/${max}`;
    },

    /**
     * 获取剩余名额文本（学生端显示）
     */
    getSlotsText(course) {
      const current = this.getStudentCount(course.students);
      const max = course.maxStudents || 0;
      const remaining = max - current;
      
      if (remaining <= 0) {
        return '已满员';
      } else if (remaining <= 3) {
        return `剩余${remaining}名额`;
      } else {
        return `${remaining}名额`;
      }
    }
  },
  mounted() {
    this.buildScheduleGrid();
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  }
};
</script>

<style scoped>
.course-schedule {
  padding: 1rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.schedule-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
  font-weight: 600;
}

/* PC端课程表 */
.schedule-pc {
  display: block;
}

.schedule-container {
  display: table;
  width: 100%;
  border-collapse: collapse;
  overflow-x: auto;
}

.schedule-header-row,
.schedule-row {
  display: table-row;
}

.schedule-cell {
  display: table-cell;
  padding: 0.75rem 0.5rem;
  border: 1px solid #e0e0e0;
  text-align: center;
  vertical-align: middle;
}

.time-cell {
  background-color: #f5f7fa;
  font-weight: 600;
  color: #606266;
  min-width: 100px;
}

.period-label {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.time-range {
  font-size: 0.75rem;
  color: #909399;
}

.weekday-cell {
  background-color: #f5f7fa;
  font-weight: 600;
  color: #606266;
}

.course-cell {
  min-width: 120px;
  height: 100px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.course-cell:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.course-cell.has-course {
  background-color: #e8f4fd;
}

.course-cell.conflict {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.course-item {
  padding: 0.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #333;
}

.course-name {
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

.course-info {
  font-size: 0.75rem;
  color: #666;
}

.course-info i {
  margin-right: 0.25rem;
}

/* 课程进度条样式（教师端） */
.course-progress {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.progress-bar {
  width: 60px;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #fff;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.9);
}

/* 课程状态信息（学生端） */
.course-status {
  margin-top: 2px;
}

.slots-info {
  font-size: 11px;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 1px 4px;
  border-radius: 8px;
  display: inline-block;
}

/* 移动端课程表 */
.schedule-mobile {
  display: none;
}

.mobile-day-schedule {
  padding: 1rem;
}

.mobile-period-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  margin-bottom: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.period-label {
  font-weight: 600;
  color: #606266;
  min-width: 80px;
}

.period-time {
  color: #909399;
  font-size: 0.85rem;
  min-width: 100px;
  margin-left: 1rem;
}

.mobile-course-item {
  flex: 1;
  padding: 1rem;
  border-radius: 8px;
  color: #fff;
  margin-left: 1rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.mobile-course-item .course-name {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.mobile-course-item .course-teacher {
  font-size: 0.85rem;
  opacity: 0.9;
}

.mobile-empty-cell {
  flex: 1;
  padding: 1rem;
  color: #c0c4cc;
  font-style: italic;
  margin-left: 1rem;
}

/* 统计信息 */
.schedule-summary {
  display: flex;
  gap: 2rem;
  padding: 1.5rem;
  margin-top: 1.5rem;
  background: #f5f7fa;
  border-radius: 8px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-label {
  color: #606266;
  font-weight: 500;
}

.summary-value {
  color: #409eff;
  font-weight: 600;
  font-size: 1.1rem;
}

.summary-value.warning {
  color: #f56c6c;
}

.summary-label.warning {
  color: #f56c6c;
}

/* 课程详情弹窗 */
.course-detail {
  padding: 1rem;
}

.detail-row {
  display: flex;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  min-width: 100px;
  font-weight: 600;
  color: #606266;
}

.detail-value {
  flex: 1;
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .schedule-pc {
    display: none;
  }

  .schedule-mobile {
    display: block;
  }

  .course-schedule {
    padding: 0.5rem;
  }

  .schedule-header h2 {
    font-size: 1.2rem;
  }

  .schedule-summary {
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
  }

  .summary-item {
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .mobile-period-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .period-label,
  .period-time {
    margin-left: 0;
    min-width: auto;
  }

  .mobile-course-item {
    margin-left: 0;
    width: 100%;
  }
}
</style>