/**
 * 预设时间段管理工具
 * 用于教师创建课程和防止时间冲突
 */

/**
 * 预设时间段定义
 * 格式：{ id, label, timeRange, weekday, description }
 */
export const PRESET_TIME_SLOTS = {
  // 周一
  monday_1: { id: 'monday_1', weekday: 1, label: '周一 第1-2节', timeRange: '08:00-10:00', startTime: '08:00', endTime: '10:00', description: '周一上午 8:00-10:00' },
  monday_2: { id: 'monday_2', weekday: 1, label: '周一 第3-4节', timeRange: '10:00-12:00', startTime: '10:00', endTime: '12:00', description: '周一上午 10:00-12:00' },
  monday_3: { id: 'monday_3', weekday: 1, label: '周一 第5-6节', timeRange: '14:00-16:00', startTime: '14:00', endTime: '16:00', description: '周一下午 14:00-16:00' },
  monday_4: { id: 'monday_4', weekday: 1, label: '周一 第7-8节', timeRange: '16:00-18:00', startTime: '16:00', endTime: '18:00', description: '周一下午 16:00-18:00' },
  monday_5: { id: 'monday_5', weekday: 1, label: '周一 第9-10节', timeRange: '19:00-21:00', startTime: '19:00', endTime: '21:00', description: '周一晚上 19:00-21:00' },
  
  // 周二
  tuesday_1: { id: 'tuesday_1', weekday: 2, label: '周二 第1-2节', timeRange: '08:00-10:00', startTime: '08:00', endTime: '10:00', description: '周二上午 8:00-10:00' },
  tuesday_2: { id: 'tuesday_2', weekday: 2, label: '周二 第3-4节', timeRange: '10:00-12:00', startTime: '10:00', endTime: '12:00', description: '周二上午 10:00-12:00' },
  tuesday_3: { id: 'tuesday_3', weekday: 2, label: '周二 第5-6节', timeRange: '14:00-16:00', startTime: '14:00', endTime: '16:00', description: '周二下午 14:00-16:00' },
  tuesday_4: { id: 'tuesday_4', weekday: 2, label: '周二 第7-8节', timeRange: '16:00-18:00', startTime: '16:00', endTime: '18:00', description: '周二下午 16:00-18:00' },
  tuesday_5: { id: 'tuesday_5', weekday: 2, label: '周二 第9-10节', timeRange: '19:00-21:00', startTime: '19:00', endTime: '21:00', description: '周二晚上 19:00-21:00' },
  
  // 周三
  wednesday_1: { id: 'wednesday_1', weekday: 3, label: '周三 第1-2节', timeRange: '08:00-10:00', startTime: '08:00', endTime: '10:00', description: '周三上午 8:00-10:00' },
  wednesday_2: { id: 'wednesday_2', weekday: 3, label: '周三 第3-4节', timeRange: '10:00-12:00', startTime: '10:00', endTime: '12:00', description: '周三上午 10:00-12:00' },
  wednesday_3: { id: 'wednesday_3', weekday: 3, label: '周三 第5-6节', timeRange: '14:00-16:00', startTime: '14:00', endTime: '16:00', description: '周三下午 14:00-16:00' },
  wednesday_4: { id: 'wednesday_4', weekday: 3, label: '周三 第7-8节', timeRange: '16:00-18:00', startTime: '16:00', endTime: '18:00', description: '周三下午 16:00-18:00' },
  wednesday_5: { id: 'wednesday_5', weekday: 3, label: '周三 第9-10节', timeRange: '19:00-21:00', startTime: '19:00', endTime: '21:00', description: '周三晚上 19:00-21:00' },
  
  // 周四
  thursday_1: { id: 'thursday_1', weekday: 4, label: '周四 第1-2节', timeRange: '08:00-10:00', startTime: '08:00', endTime: '10:00', description: '周四上午 8:00-10:00' },
  thursday_2: { id: 'thursday_2', weekday: 4, label: '周四 第3-4节', timeRange: '10:00-12:00', startTime: '10:00', endTime: '12:00', description: '周四上午 10:00-12:00' },
  thursday_3: { id: 'thursday_3', weekday: 4, label: '周四 第5-6节', timeRange: '14:00-16:00', startTime: '14:00', endTime: '16:00', description: '周四下午 14:00-16:00' },
  thursday_4: { id: 'thursday_4', weekday: 4, label: '周四 第7-8节', timeRange: '16:00-18:00', startTime: '16:00', endTime: '18:00', description: '周四下午 16:00-18:00' },
  thursday_5: { id: 'thursday_5', weekday: 4, label: '周四 第9-10节', timeRange: '19:00-21:00', startTime: '19:00', endTime: '21:00', description: '周四晚上 19:00-21:00' },
  
  // 周五
  friday_1: { id: 'friday_1', weekday: 5, label: '周五 第1-2节', timeRange: '08:00-10:00', startTime: '08:00', endTime: '10:00', description: '周五上午 8:00-10:00' },
  friday_2: { id: 'friday_2', weekday: 5, label: '周五 第3-4节', timeRange: '10:00-12:00', startTime: '10:00', endTime: '12:00', description: '周五上午 10:00-12:00' },
  friday_3: { id: 'friday_3', weekday: 5, label: '周五 第5-6节', timeRange: '14:00-16:00', startTime: '14:00', endTime: '16:00', description: '周五下午 14:00-16:00' },
  friday_4: { id: 'friday_4', weekday: 5, label: '周五 第7-8节', timeRange: '16:00-18:00', startTime: '16:00', endTime: '18:00', description: '周五下午 16:00-18:00' },
  friday_5: { id: 'friday_5', weekday: 5, label: '周五 第9-10节', timeRange: '19:00-21:00', startTime: '19:00', endTime: '21:00', description: '周五晚上 19:00-21:00' },
};

/**
 * 获取所有时间段
 */
export function getAllTimeSlots() {
  return Object.values(PRESET_TIME_SLOTS);
}

/**
 * 按星期分组时间段
 */
export function getTimeSlotsByWeekday() {
  const grouped = {};
  const weekdays = ['周一', '周二', '周三', '周四', '周五'];
  
  weekdays.forEach((day, index) => {
    const weekdayNum = index + 1;
    grouped[day] = getAllTimeSlots().filter(slot => slot.weekday === weekdayNum);
  });
  
  return grouped;
}

/**
 * 检查时间段是否冲突
 * @param {string} timeSlotId1 - 时间段ID1
 * @param {string} timeSlotId2 - 时间段ID2
 * @returns {boolean} 是否冲突
 */
export function isTimeSlotConflict(timeSlotId1, timeSlotId2) {
  if (!timeSlotId1 || !timeSlotId2) return false;
  if (timeSlotId1 === timeSlotId2) return true;
  
  const slot1 = PRESET_TIME_SLOTS[timeSlotId1];
  const slot2 = PRESET_TIME_SLOTS[timeSlotId2];
  
  if (!slot1 || !slot2) return false;
  
  // 同一周期的不同时间段不会冲突
  return slot1.weekday === slot2.weekday && 
         ((slot1.startTime >= slot2.startTime && slot1.startTime < slot2.endTime) ||
          (slot2.startTime >= slot1.startTime && slot2.startTime < slot1.endTime));
}

/**
 * 获取时间段详情
 * @param {string} timeSlotId - 时间段ID
 * @returns {Object|null} 时间段详情
 */
export function getTimeSlotById(timeSlotId) {
  return PRESET_TIME_SLOTS[timeSlotId] || null;
}

/**
 * 检查课程时间段冲突
 * @param {string} courseTimeSlotId - 课程的时间段ID
 * @param {Array} selectedCourses - 已选课程列表
 * @returns {Object|null} 冲突信息
 */
export function checkTimeSlotConflict(courseTimeSlotId, selectedCourses) {
  if (!courseTimeSlotId || !Array.isArray(selectedCourses) || selectedCourses.length === 0) {
    return null;
  }
  
  for (const course of selectedCourses) {
    // 检查课程是否有时间段ID，或者从时间字符串解析
    const courseSlotId = course.timeSlotId || parseTimeSlotFromTimeString(course.time);
    
    if (courseSlotId && isTimeSlotConflict(courseTimeSlotId, courseSlotId)) {
      const slot1 = getTimeSlotById(courseTimeSlotId);
      const slot2 = getTimeSlotById(courseSlotId);
      
      return {
        conflictCourse: course,
        reason: `时间段冲突: ${slot1?.label || courseTimeSlotId} 与《${course.name}》${slot2?.label || course.time}冲突`
      };
    }
  }
  
  return null;
}

/**
 * 从时间字符串解析时间段ID
 * @param {string} timeString - 时间字符串，如"周一 第1-2节"或"周一 08:00-10:00"
 * @returns {string|null} 时间段ID
 */
export function parseTimeSlotFromTimeString(timeString) {
  if (!timeString) return null;
  
  // 遍历所有预设时间段，找到匹配的
  for (const [id, slot] of Object.entries(PRESET_TIME_SLOTS)) {
    if (timeString.includes(slot.label) || 
        timeString.includes(slot.timeRange) ||
        (timeString.includes(getWeekdayName(slot.weekday)) && 
         timeString.includes(slot.timeRange))) {
      return id;
    }
  }
  
  return null;
}

/**
 * 获取星期名称
 * @param {number} weekday - 星期数字 (1-5)
 * @returns {string} 星期名称
 */
function getWeekdayName(weekday) {
  const weekdays = ['', '周一', '周二', '周三', '周四', '周五'];
  return weekdays[weekday] || '';
}

/**
 * 验证时间段是否有效（检查是否已被占用）
 * @param {string} timeSlotId - 时间段ID
 * @param {Array} existingCourses - 现有课程列表
 * @param {string} excludeCourseId - 排除的课程ID（用于编辑时）
 * @returns {boolean} 是否可用
 */
export function isTimeSlotAvailable(timeSlotId, existingCourses, excludeCourseId = null) {
  if (!timeSlotId || !Array.isArray(existingCourses)) return true;
  
  return !existingCourses.some(course => {
    if (excludeCourseId && course.id === excludeCourseId) return false;
    
    const courseSlotId = course.timeSlotId || parseTimeSlotFromTimeString(course.time);
    return courseSlotId && isTimeSlotConflict(timeSlotId, courseSlotId);
  });
}