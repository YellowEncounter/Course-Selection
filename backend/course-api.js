/**
 * 课程选课退课 API 路由
 */

const express = require('express');
const router = express.Router();
const { usselect, us } = require('./mysql');
const DB_CONFIG = ['localhost', 'course selection'];

// 统一响应处理
const sendResponse = (res, data) => {
  res.setHeader('Content-Type', 'application/json;charset=utf-8');
  res.end(JSON.stringify(data));
};

// 解析存储过程返回的结果
const parseProcedureResult = (response) => {
  console.log('解析存储过程结果:', response);

  // 检查是否有错误
  if (response.error) {
    return {
      success: false,
      error: response.error
    };
  }

  // 检查是否有数据
  if (response.data && Array.isArray(response.data) && response.data.length > 0) {
    const firstResult = response.data[0];

    // 尝试解析result字段（JSON格式）
    if (firstResult.result) {
      try {
        const parsed = JSON.parse(firstResult.result);
        console.log('解析后的结果:', parsed);
        return parsed;
      } catch (e) {
        console.warn('解析JSON失败:', e);
        console.warn('原始result字段:', firstResult.result);
        // 如果解析失败，尝试直接返回result字段的值
        if (typeof firstResult.result === 'string') {
          if (firstResult.result === 'success') {
            return {
              success: true,
              message: '操作成功'
            };
          }
          return {
            success: true,
            message: firstResult.result
          };
        }
        return {
          success: false,
          error: '解析响应失败'
        };
      }
    }
  }

  // 默认返回成功
  return {
    success: true,
    data: response
  };
};

// 学生选课
router.post('/selectCourse', (req, res) => {
  console.log('收到选课请求:', req.body);
  const { courseId, studentId } = req.body;

  if (!courseId || !studentId) {
    return sendResponse(res, {
      success: false,
      error: '缺少必要参数: courseId 和 studentId'
    });
  }

  console.log(`学生 ${studentId} 选择课程 ${courseId}`);

  // 调用存储过程
  const params = ['localhost', 'course selection', 'selectCourse', courseId, studentId];
  usselect(params, (response) => {
    console.log('存储过程原始返回:', response);
    
    // 解析存储过程结果
    const result = parseProcedureResult(response);
    
    if (!result.success) {
      console.error('选课失败:', result.error);
      return sendResponse(res, result);
    }

    console.log('选课成功:', result);
    sendResponse(res, result);
  });
});

// 学生退课
router.post('/dropCourse', (req, res) => {
  console.log('收到退课请求:', req.body);
  const { courseId, studentId } = req.body;

  if (!courseId || !studentId) {
    return sendResponse(res, {
      success: false,
      error: '缺少必要参数: courseId 和 studentId'
    });
  }

  console.log(`Processing dropCourse in Node.js (course-api): courseId=${courseId}, studentId=${studentId}`);

  // Use us.mysqlconnection to handle logic directly
  us.mysqlconnection(DB_CONFIG[0], DB_CONFIG[1]).getConnection(function (error, connection) {
    if (error) {
      console.error("Database connection failed:", error);
      return sendResponse(res, { success: false, error: "Database connection failed" });
    }

    // 1. Get current students list
    connection.query('SELECT students FROM courses WHERE id = ?', [courseId], function (err, results) {
      if (err) {
        connection.release();
        console.error("Query failed:", err);
        return sendResponse(res, { success: false, error: "Query failed: " + err.message });
      }

      if (results.length === 0) {
        connection.release();
        return sendResponse(res, { success: false, error: "Course not found" });
      }

      let studentsStr = results[0].students;
      let students = [];
      try {
        if (studentsStr) {
          if (typeof studentsStr === 'string') {
            students = JSON.parse(studentsStr);
          } else {
            students = studentsStr;
          }
        }
        if (!Array.isArray(students)) {
             students = [];
        }
      } catch (e) {
        console.error("JSON parse error:", e);
        students = [];
      }

      console.log(`Current students in course ${courseId}:`, students);

      // 2. Check if student exists (handle both string and number types)
      const studentIdStr = String(studentId);
      const initialLength = students.length;
      
      // Filter out the student
      const newStudents = students.filter(s => String(s) !== studentIdStr);

      if (newStudents.length === initialLength) {
        connection.release();
        console.log(`Student ${studentId} not found in course ${courseId}`);
        return sendResponse(res, { success: false, error: "You have not selected this course" });
      }

      // 3. Update database
      const newStudentsJson = JSON.stringify(newStudents);
      console.log(`Updating course ${courseId} students to:`, newStudentsJson);
      
      connection.query('UPDATE courses SET students = ? WHERE id = ?', [newStudentsJson, courseId], function (err, updateResult) {
        connection.release();
        if (err) {
          console.error("Update failed:", err);
          return sendResponse(res, { success: false, error: "Update failed: " + err.message });
        }
        
        console.log("Drop course successful");
        sendResponse(res, { success: true, message: "退课成功", courseId: courseId });
      });
    });
  });
});

// 获取学生已选课程（可选实现）
router.get('/getStudentSelectedCourses', (req, res) => {
  console.log('收到获取学生已选课程请求:', req.query);
  const { studentId } = req.query;

  if (!studentId) {
    return sendResponse(res, {
      success: false,
      error: '缺少参数: studentId'
    });
  }

  // 直接使用getAllCourses返回所有课程，然后后端筛选
  const params = ['localhost', 'course selection', 'getAllCourses'];
  usselect(params, (response) => {
    if (response.error) {
      return sendResponse(res, {
        success: false,
        error: response.error
      });
    }

    const allCourses = response.data || [];
    
    // 筛选出包含该学生的课程
    const studentCourses = allCourses.filter(course => {
      if (!course.students) return false;
      
      let students = [];
      try {
        // 处理可能是字符串或已经是对象的students字段
        students = typeof course.students === 'string' ? JSON.parse(course.students) : course.students;
      } catch (e) {
        console.warn(`解析课程 ${course.id} 学生列表失败:`, e);
        return false;
      }
      
      if (!Array.isArray(students)) return false;
      
      // 检查学生ID是否存在（兼容数字和字符串）
      return students.some(id => String(id) === String(studentId));
    });

    sendResponse(res, {
      success: true,
      data: studentCourses
    });
  });
});

module.exports = router;
