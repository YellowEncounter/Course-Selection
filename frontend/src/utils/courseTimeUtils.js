/**
 * 课程时间工具函数
 * 用于处理时间解析、冲突检测等
 */

/**
 * 节次到时间段映射
 */
const PERIOD_TO_TIME = {
  '第1-2节': { start: '08:00', end: '10:00' },
  '第3-4节': { start: '10:00', end: '12:00' },
  '第5-6节': { start: '14:00', end: '16:00' },
  '第7-8节': { start: '16:00', end: '18:00' },
  '第9-10节': { start: '19:00', end: '21:00' }
};

/**
 * 星期映射
 * 注意：使用ISO标准，周日=0, 周一=1, ..., 周六=6
 */
const WEEKDAY_MAP = {
  '周一': 1,
  '周二': 2,
  '周三': 3,
  '周四': 4,
  '周五': 5,
  '周六': 6,
  '周日': 0,
  '星期一': 1,
  '星期二': 2,
  '星期三': 3,
  '星期四': 4,
  '星期五': 5,
  '星期六': 6,
  '星期日': 0,
  'Mon': 1,
  'Tue': 2,
  'Wed': 3,
  'Thu': 4,
  'Fri': 5,
  'Sat': 6,
  'Sun': 0
};

/**
 * 解析课程时间字符串
 * 支持以下格式：
 * - "周一第1-2节"
 * - "周一 8:00-10:00"
 * - "星期一 08:00-10:00"
 * - "Mon 08:00-10:00"
 * 
 * @param {string} timeStr - 课程时间字符串
 * @returns {Object|null} - 解析后的时间对象 {weekday, startTime, endTime, periods}
 */
export function parseCourseTime(timeStr) {
  if (!timeStr) return null;

  try {
    let weekday, startTime, endTime;

    // 格式1: "周一第1-2节"
    const format1Match = timeStr.match(/(周[一二三四五六七]|星期[一二三四五六七])第?(\d+)-(\d+)节/);
    if (format1Match) {
      weekday = WEEKDAY_MAP[format1Match[1]];
      const periodStart = format1Match[2];
      const periodEnd = format1Match[3];
      
      // 根据节次映射到具体时间
      const timeRange = PERIOD_TO_TIME[`第${periodStart}-${periodEnd}节`] || 
                     PERIOD_TO_TIME[`第${periodStart}节`] ||
                     { start: '08:00', end: '10:00' };
      
      startTime = timeRange.start;
      endTime = timeRange.end;
    }
    // 格式2: "周一 8:00-10:00" 或 "星期一 08:00-10:00"
    else {
      const format2Match = timeStr.match(/(周[一二三四五六七]|星期[一二三四五六七]|[MonTueWedThuFriSatSun])\s*(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/i);
      if (format2Match) {
        weekday = WEEKDAY_MAP[format2Match[1]];
        startTime = `${format2Match[2].padStart(2, '0')}:${format2Match[3]}`;
        endTime = `${format2Match[4].padStart(2, '0')}:${format2Match[5]}`;
      }
    }

    if (weekday === undefined) {
      console.warn('无法解析星期:', timeStr);
      return null;
    }

    return {
      weekday,
      startTime,
      endTime,
      original: timeStr
    };
  } catch (error) {
    console.error('解析课程时间失败:', timeStr, error);
    return null;
  }
}

/**
 * 检查两个时间段是否重叠
 * @param {string} start1 - 第一个开始时间 "HH:MM"
 * @param {string} end1 - 第一个结束时间 "HH:MM"
 * @param {string} start2 - 第二个开始时间 "HH:MM"
 * @param {string} end2 - 第二个结束时间 "HH:MM"
 * @returns {boolean} - 是否重叠
 */
function isTimeOverlap(start1, end1, start2, end2) {
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);

  // 重叠条件：(开始1 < 结束2) && (结束1 > 开始2)
  // 注意：边界相接不算重叠，所以使用严格比较
  return start1Min < end2Min && end1Min > start2Min;
}

/**
 * 检查两个课程是否时间冲突
 * @param {Object} course1 - 第一个课程 {time: string, id: number, teacherId: number}
 * @param {Object} course2 - 第二个课程 {time: string, id: number, teacherId: number}
 * @returns {boolean} - 是否冲突
 */
export function isCourseConflict(course1, course2) {
  // 重要：如果两个课程是同一个，不冲突
  if (course1.id === course2.id) {
    return false;
  }
  
  if (!course1 || !course2) return false;
  if (!course1.time || !course2.time) return false;

  console.log('');
  console.log('🔍 [工具函数] isCourseConflict 调用');
  console.log(`   课程1: ${course1.name} (ID:${course1.id}, 教师:${course1.teacherId}) - ${course1.time}`);
  console.log(`   课程2: ${course2.name} (ID:${course2.id}, 教师:${course2.teacherId}) - ${course2.time}`);

  const time1 = parseCourseTime(course1.time);
  const time2 = parseCourseTime(course2.time);

  // 严格验证：如果任一时间解析失败，视为冲突
  if (!time1 || !time2) {
    console.warn('⚠️ [警告] 无法解析课程时间，视为冲突');
    console.log(`      ${course1.time} -> ${time1 ? '成功' : '失败'}`);
    console.log(`      ${course2.time} -> ${time2 ? '成功' : '失败'}`);
    return true;
  }

  console.log(`   解析结果:`);
  console.log(`      课程1: 星期${['日','一','二','三','四','五','六'][time1.weekday]} ${time1.startTime}-${time1.endTime}`);
  console.log(`      课程2: 星期${['日','一','二','三','四','五','六'][time2.weekday]} ${time2.startTime}-${time2.endTime}`);

  // 不同星期不会冲突
  if (time1.weekday !== time2.weekday) {
    console.log('✅ [结果] 不同星期，无冲突');
    return false;
  }

  // 检查时间段是否重叠
  const overlap = isTimeOverlap(time1.startTime, time1.endTime, time2.startTime, time2.endTime);
  
  // 调试日志：显示冲突检测结果
  if (overlap) {
    console.log('');
    console.log('❌❌❌ [结果] 时间冲突！');
    console.log(`   课程 ${course1.name} (${course1.teacherId}) 与 ${course2.name} (${course2.teacherId}) 时间段重叠`);
    console.log(`   ${time1.startTime}-${time1.endTime} 与 ${time2.startTime}-${time2.endTime} 重叠`);
  } else {
    console.log('✅ [结果] 时间段不重叠，无冲突');
  }
  
  return overlap;
}

/**
 * 检查课程是否与已选课程列表冲突
 * @param {Object} course - 待检查的课程 {time: string, id: number|string}
 * @param {Array} selectedCourses - 已选课程列表
 * @returns {Object|null} - 冲突信息 {conflictCourse, reason} 或 null
 */
export function checkCourseConflict(course, selectedCourses) {
  console.log('');
  console.log('🔍 [工具函数] checkCourseConflict 调用');
  console.log(`   待检测课程: ${course.name} (ID:${course.id})`);
  console.log(`   已选课程数: ${selectedCourses.length}`);
  
  if (!course || !Array.isArray(selectedCourses) || selectedCourses.length === 0) {
    console.log('⚠️ [结果] 无已选课程，无冲突');
    return null;
  }

  let conflictFound = false;
  
  for (const selectedCourse of selectedCourses) {
    if (isCourseConflict(course, selectedCourse)) {
      const time1 = parseCourseTime(course.time);
      const time2 = parseCourseTime(selectedCourse.time);
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      
      let reason = `与已选课程《${selectedCourse.name}》时间冲突`;
      
      if (time1 && time2) {
        reason += ` (${weekdays[time1.weekday]} ${time1.startTime}-${time1.endTime} 与 ${weekdays[time2.weekday]} ${time2.startTime}-${time2.endTime})`;
      } else {
        reason += ' (时间格式错误)';
      }
      
      console.log('');
      console.log('⚠️ [结果] 检测到冲突，返回冲突信息');
      console.log(`   冲突课程: ${selectedCourse.name}`);
      console.log(`   冲突原因: ${reason}`);
      
      conflictFound = true;
      
      return {
        conflictCourse: selectedCourse,
        reason: reason
      };
    }
  }

  if (!conflictFound) {
    console.log('');
    console.log('✅ [结果] 未检测到时间冲突');
  }
  
  return null;
}

/**
 * 获取所有冲突的课程
 * @param {Array} courses - 待检查的课程列表
 * @param {Array} selectedCourses - 已选课程列表
 * @returns {Map<number, Object>} - 冲突映射 {courseId: {conflictCourse, reason}}
 */
export function getAllConflicts(courses, selectedCourses) {
  const conflicts = new Map();

  if (!Array.isArray(courses) || !Array.isArray(selectedCourses)) {
    return conflicts;
  }

  courses.forEach(course => {
    const conflict = checkCourseConflict(course, selectedCourses);
    if (conflict) {
      conflicts.set(course.id, conflict);
    }
  });

  return conflicts;
}

/**
 * 格式化课程时间用于显示
 * @param {string} timeStr - 原始时间字符串
 * @returns {Object} - 格式化的时间对象 {weekday, period, timeRange}
 */
export function formatCourseTime(timeStr) {
  const parsed = parseCourseTime(timeStr);
  if (!parsed) return null;

  const weekdayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  return {
    weekday: weekdayNames[parsed.weekday],
    weekdayIndex: parsed.weekday,
    timeRange: `${parsed.startTime}-${parsed.endTime}`,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    original: timeStr
  };
}

/**
 * 获取时间段在课程表中的位置
 * @param {string} startTime - 开始时间 "HH:MM"
 * @returns {number} - 在课程表中的行索引 (0-4)
 */
export function getScheduleRow(startTime) {
  const timeRanges = [
    { start: '08:00', end: '10:00' },  // 第1-2节
    { start: '10:00', end: '12:00' },  // 第3-4节
    { start: '14:00', end: '16:00' },  // 第5-6节
    { start: '16:00', end: '18:00' },  // 第7-8节
    { start: '19:00', end: '21:00' }   // 第9-10节
  ];

  for (let i = 0; i < timeRanges.length; i++) {
    const range = timeRanges[i];
    if (isTimeOverlap(range.start, range.end, startTime, startTime)) {
      return i;
    }
  }

  return 2; // 默认返回中间时段
}

/**
 * 生成课程颜色（基于课程ID）
 * @param {number|string} courseId - 课程ID
 * @returns {string} - 颜色代码
 */
export function getCourseColor(courseId) {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8B500', '#00CED1', '#FF69B4', '#32CD32', '#FF4500'
  ];
  
  const index = Math.abs(Number(courseId)) % colors.length;
  return colors[index];
}

/**
 * 验证时间字符串格式
 * @param {string} timeStr - 时间字符串
 * @returns {boolean} - 是否有效
 */
export function isValidTimeFormat(timeStr) {
  return parseCourseTime(timeStr) !== null;
}