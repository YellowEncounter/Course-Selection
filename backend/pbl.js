// ROUTES FOR OUR API
// =============================================================================
var express = require("express");
var router = express.Router(); // get an instance of the express Router
const querystring = require("querystring");
var { usselect, us } = require("./mysql");
var crypto = require("crypto");
var https = require("https");

// 数据库配置
const _localhost = ["localhost", "course selection"]; // 数据库地址和库名
const _mysqllocalhost = ["localhost", "mysql"]; // mysql数据库信息

// 统一响应处理函数
const sendResponse = (res, data) => {
  res.setHeader('Content-Type', 'application/json;charset=utf-8');
  res.end(JSON.stringify(data));
};

// 增加用户接口
router.post("/addUser-1", (req, res) => {
  console.log("添加管理员请求");
  postmysql(req, res, "addUser-1");
});

router.post("/addUser-2", (req, res) => {
  console.log("添加教师请求");
  postmysql(req, res, "addUser-2");
});

router.post("/addUser-3", (req, res) => {
  console.log("添加学生请求");
  postmysql(req, res, "addUser-3");
});

// 删除用户接口
router.post("/deleteUser-1", (req, res) => {
  console.log("删除管理员请求");
  postmysql(req, res, "deleteUser-1");
});

router.post("/deleteUser-2", (req, res) => {
  console.log("删除教师请求");
  postmysql(req, res, "deleteUser-2");
});

router.post("/deleteUser-3", (req, res) => {
  console.log("删除学生请求");
  postmysql(req, res, "deleteUser-3");
});

// 查询用户接口
router.post("/getUser-1", (req, res) => {
  console.log("查询管理员请求");
  postmysql(req, res, "getUser-1");
});

router.post("/getUser-2", (req, res) => {
  console.log("查询教师请求");
  postmysql(req, res, "getUser-2");
});

router.post("/getUser-3", (req, res) => {
  console.log("查询学生请求");
  postmysql(req, res, "getUser-3");
});

// 更新用户接口
router.post("/updateUser-1", (req, res) => {
  console.log("更新管理员请求");
  postmysql(req, res, "updateUser-1");
});

router.post("/updateUser-2", (req, res) => {
  console.log("更新教师请求");
  postmysql(req, res, "updateUser-2");
});

router.post("/updateUser-3", (req, res) => {
  console.log("更新学生请求");
  postmysql(req, res, "updateUser-3");
});

// 课程管理接口 - 同时支持GET和POST方法
router.get("/getAllCourses", (req, res) => {
  console.log("GET方法获取所有课程请求");
  console.log("查询参数:", req.query);
  
  try {
    // 使用GET方法时，从查询参数获取数据
    const params = [];
    postmysql({ body: req.query }, res, "getAllCourses");
  } catch (error) {
    console.error("getAllCourses GET方法执行错误:", error);
    sendResponse(res, { error: "获取课程失败: " + error.message });
  }
});

router.post("/getAllCourses", (req, res) => {
  console.log("POST方法获取所有课程请求");
  console.log("请求体:", req.body);
  console.log("请求头:", req.headers);
  
  // 验证请求
  if (!req.body) {
    console.log("请求体为空");
    return sendResponse(res, { error: "请求体不能为空" });
  }
  
  // 添加详细日志
  console.log("开始执行 getAllCourses 存储过程");
  
  try {
    postmysql(req, res, "getAllCourses");
  } catch (error) {
    console.error("getAllCourses POST方法执行错误:", error);
    sendResponse(res, { error: "获取课程失败: " + error.message });
  }
});

router.post("/getTeacherCourses", (req, res) => {
  console.log("获取教师课程请求");
  postmysql(req, res, "getTeacherCourses");
});

router.post("/addCourse", (req, res) => {
  console.log("添加课程请求");
  postmysql(req, res, "addCourse");
});

router.post("/updateCourse", (req, res) => {
  console.log("更新课程请求");
  postmysql(req, res, "updateCourse");
});

router.post("/deleteCourse", (req, res) => {
  console.log("删除课程请求");
  postmysql(req, res, "deleteCourse");
});

router.post("/selectCourse", (req, res) => {
  console.log("学生选课请求");
  postmysql(req, res, "selectCourse");
});

router.post("/dropCourse", (req, res) => {
  console.log("学生退课请求");
  postmysql(req, res, "dropCourse");
});

router.post("/getCourseStudents", (req, res) => {
  console.log("获取课程学生请求");
  postmysql(req, res, "getCourseStudents");
});

// 解析URL参数
queryString = function(url) {  
  var a = url.split("?");
  var json = querystring.parse(a[1] || "");  // 兼容无参数的URL
  return json;
};

// POST请求处理
postmysql = function(req, res, functionname) {
  console.log(`\n=== 开始处理 ${functionname} 请求 ===`);
  console.log("请求体原始数据:", req.body);
  console.log("请求体类型:", typeof req.body);
  
  if (!req.body) {
    console.log("错误：请求体为空");
    return sendResponse(res, { error: "请求体不能为空" });
  }
  
  try {
    let params;
    
    // 根据存储过程名称过滤需要的参数
    if (functionname.startsWith('addUser')) {
      // addUser只需要：id, name, password
      params = [req.body.id, req.body.name, req.body.password];
      console.log("addUser 参数:", params);
    } else if (functionname.startsWith('updateUser')) {
      // updateUser需要：id, name, password（存储过程已使用表别名解决冲突）
      params = [req.body.id, req.body.name, req.body.password];
      console.log("updateUser 参数:", params);
    } else if (functionname.startsWith('deleteUser')) {
      // deleteUser只需要：id
      params = [req.body.id];
      console.log("deleteUser 参数:", params);
    } else if (functionname === 'getTeacherCourses') {
      // getTeacherCourses：直接执行SQL查询避免存储过程问题
      console.log("调用 handleGetTeacherCourses");
      handleGetTeacherCourses(req, res);
      return;
    } else if (functionname === 'selectCourse') {
      // selectCourse需要：courseId, studentId
      params = [req.body.courseId, req.body.studentId];
      console.log("selectCourse 参数:", params);
      console.log(`调用 selectCourse 存储过程: courseId=${req.body.courseId}, studentId=${req.body.studentId}`);
      const selectParams = [_localhost[0], _localhost[1], 'selectCourse', req.body.courseId, req.body.studentId];
      usselect(selectParams, function(ret) {
        console.log('selectCourse 存储过程返回:', ret);
        sendResponse(res, ret);
      });
      return;
    } else if (functionname === 'dropCourse') {
      // 特殊处理退课逻辑：在后端手动处理
      console.log("调用 handleDropCourse");
      handleDropCourse(req, res);
      return;
    } else if (functionname === 'getCourseStudents') {
      // getCourseStudents只需要：courseId
      params = [req.body.courseId];
      console.log("getCourseStudents 参数:", params);
    } else if (functionname === 'updateCourse') {
      // updateCourse需要：id, name, credit, time, description, maxStudents
      params = [req.body.id, req.body.name, req.body.credit, req.body.time, req.body.description, req.body.maxStudents];
      console.log("updateCourse 参数:", params);
    } else if (functionname === 'addCourse') {
      // addCourse需要：name, credit, time, description, maxStudents, teacherId（不包含students）
      params = [req.body.name, req.body.credit, req.body.time, req.body.description, req.body.maxStudents, req.body.teacherId];
      console.log("addCourse 参数:", params);
    } else if (functionname === 'getAllCourses') {
      // getAllCourses不需要参数
      params = [];
      console.log("getAllCourses 不需要参数");
    } else {
      // 其他情况：传递所有参数
      params = Object.values(req.body);
      console.log("其他情况，传递所有参数:", params);
    }
    
    // 拼接数据库参数：主机、数据库名、存储过程名、业务参数
    const p = [_localhost[0], _localhost[1], functionname, ...params];
    console.log("数据库参数:", p);
    
    console.log(`开始调用 usselect 函数执行 ${functionname}`);
    usselect(p, function(ret) {
      console.log(`${functionname} 执行结果:`, ret);
      console.log(`=== 结束处理 ${functionname} 请求 ===\n`);
      sendResponse(res, ret);
    });
  } catch (error) {
    console.error(`${functionname} 参数解析错误:`, error);
    console.log(`=== 错误结束处理 ${functionname} 请求 ===\n`);
    sendResponse(res, { error: "参数解析错误：" + error.message });
  }
};

// GET请求处理（如需使用）
getmysql = function(req, res, functionname, ...p) {
  try {
    p = [_localhost[0], _localhost[1], functionname, ...(p || [])];
    usselect(p, function(ret) {
      sendResponse(res, ret);
    });
  } catch (error) {
    sendResponse(res, { error: "请求处理错误：" + error.message });
  }
};

// 教师课程查询处理函数
handleGetTeacherCourses = function(req, res) {
  const teacherId = req.body.teacherId;
  
  if (!teacherId) {
    return sendResponse(res, { error: "缺少必要参数：teacherId" });
  }

  // 使用项目已有的mysql连接方式
  us.mysqlconnection(_localhost[0], _localhost[1]).getConnection(function (error, connection) {
    if (error) {
      return sendResponse(res, { error: "数据库连接失败" });
    }
    
    // 直接执行SQL查询
    connection.query('SELECT * FROM courses WHERE teacherId = ?', [teacherId], function (error, results) {
      if (error) {
        sendResponse(res, { error: "查询教师课程失败：" + error.message });
      } else {
        sendResponse(res, { data: results || [] });
      }
      
      // 释放连接
      connection.release();
    });
  });
};

// 退课处理函数
handleDropCourse = function(req, res) {
  const { courseId, studentId } = req.body;

  if (!courseId || !studentId) {
    return sendResponse(res, { error: "缺少必要参数" });
  }

  console.log(`Processing dropCourse in Node.js: courseId=${courseId}, studentId=${studentId}`);

  // 使用 us.mysqlconnection 获取连接
  us.mysqlconnection(_localhost[0], _localhost[1]).getConnection(function (error, connection) {
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
          // Handle case where it might be already an object/array if driver parses JSON
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
      // We convert everything to string for comparison to be safe
      const studentIdStr = String(studentId);
      const initialLength = students.length;
      
      // Filter out the student
      const newStudents = students.filter(s => String(s) !== studentIdStr);

      if (newStudents.length === initialLength) {
        connection.release();
        console.log(`Student ${studentId} not found in course ${courseId}`);
        // Return the specific error message the frontend/user expects or saw
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
};

// 获取所有用户信息 - 支持前端AdminDashboard
router.get("/getAllUsers", (req, res) => {
  console.log("获取所有用户请求");
  const mysql = require('mysql');
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'course selection'
  });
  
  // 检查是否存在三表分离架构
  connection.query(`
    SELECT COUNT(*) as count FROM information_schema.tables 
    WHERE table_schema = 'course selection' 
    AND table_name IN ('admins', 'teachers', 'students')
  `, (err, results) => {
    if (err) {
      console.error('检查表结构失败:', err);
      connection.end();
      return res.status(500).json({ success: false, message: '数据库查询失败' });
    }
    
    const hasThreeTables = results[0].count >= 3;
    
    if (hasThreeTables) {
      // 使用三表分离架构查询
      const query = `
        SELECT 
          id, username, password, name, 'admin' as role, status, created_at,
          level, department, permissions
        FROM admins
        UNION ALL
        SELECT 
          id, username, password, name, 'teacher' as role, status, created_at,
          title as level, department, specialization as permissions
        FROM teachers
        UNION ALL
        SELECT 
          id, username, password, name, 'student' as role, status, created_at,
          grade as level, college as department, class_name as permissions
        FROM students
        ORDER BY role, id
      `;
      
      connection.query(query, (err, results) => {
        connection.end();
        
        if (err) {
          console.error('获取用户列表失败:', err);
          return res.json({ success: false, message: '获取用户列表失败' });
        }
        
        // 统一数据格式
        const users = results.map(user => ({
          id: user.id,
          username: user.username,
          password: user.password,
          name: user.name,
          role: user.role,
          status: user.status || 'active',
          college: user.department || '',
          class: user.permissions || '',
          created_at: user.created_at
        }));
        
        res.json({ success: true, data: users });
      });
    } else {
      // 使用传统单表架构查询
      connection.query('SELECT * FROM users ORDER BY role, id', (err, results) => {
        connection.end();
        
        if (err) {
          console.error('获取用户列表失败:', err);
          return res.json({ success: false, message: '获取用户列表失败' });
        }
        
        // 确保所有字段都存在，为空值设置默认值
        const users = results.map(user => ({
          ...user,
          status: user.status || 'active',
          college: user.college || '',
          class: user.class || ''
        }));
        
        res.json({ success: true, data: users });
      });
    }
  });
});

// 生成教师ID专用接口
router.get("/generateTeacherId", (req, res) => {
  console.log("生成教师ID请求");
  const mysql = require('mysql');
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'course selection'
  });
  
  const { type = 'T' } = req.query; // 默认为全职教师(T)，可选兼职(P)
  
  // 验证教师类别代码
  if (!['T', 'P'].includes(type)) {
    return res.json({ success: false, message: '教师类别代码必须是T(全职)或P(兼职)' });
  }
  
  const currentYear = new Date().getFullYear().toString().slice(-2); // 取后两位年份
  const prefix = `${currentYear}${type}`; // 如：25T 或 25P
  
  // 检查是否存在三表分离架构
  connection.query(`
    SELECT COUNT(*) as count FROM information_schema.tables 
    WHERE table_schema = 'course selection' 
    AND table_name = 'teachers'
  `, (err, results) => {
    if (err) {
      console.error('检查teachers表失败:', err);
      connection.end();
      return res.json({ success: false, message: '生成教师ID失败' });
    }
    
    const hasTeachersTable = results[0].count > 0;
    let query, table;
    
    if (hasTeachersTable) {
      query = `SELECT MAX(CASE WHEN id LIKE ? THEN CAST(SUBSTRING(id, 4) AS UNSIGNED) ELSE 0 END) as maxTeacherId FROM teachers WHERE id LIKE ?`;
      table = 'teachers';
    } else {
      query = `SELECT MAX(CASE WHEN id LIKE ? THEN CAST(SUBSTRING(id, 4) AS UNSIGNED) ELSE 0 END) as maxTeacherId FROM users WHERE role = "teacher" AND id LIKE ?`;
      table = 'users';
    }
    
    // 查询当前年份和类型最大的教师ID
    connection.query(query, [`${prefix}%`, `${prefix}%`], (err, results) => {
      if (err) {
        console.error('查询教师ID失败:', err);
        connection.end();
        return res.json({ success: false, message: '生成教师ID失败' });
      }
      
      const currentMax = results[0].maxTeacherId || 0;
      const newSequence = (currentMax + 1).toString().padStart(3, '0'); // 3位序号，前面补0
      const newId = `${prefix}${newSequence}`;
      
      connection.end();
      
      const typeText = type === 'T' ? '全职' : '兼职';
      res.json({ 
        success: true, 
        message: `成功生成${typeText}教师ID`,
        data: {
          teacherId: newId,
          year: currentYear,
          type: type,
          typeText: typeText,
          sequence: newSequence
        }
      });
    });
  });
});

// 验证教师ID格式接口
router.post("/validateTeacherId", (req, res) => {
  console.log("验证教师ID格式请求");
  const { teacherId } = req.body;
  
  if (!teacherId) {
    return res.json({ success: false, message: '教师ID不能为空' });
  }
  
  // 验证教师ID格式
  const teacherIdPattern = /^\d{2}[TP]\d{3}$/;
  
  if (!teacherIdPattern.test(teacherId)) {
    return res.json({ 
      success: false, 
      message: '教师ID格式不正确，应为：2位年份 + 教师类别代码(T/P) + 3位序号，如：25T001' 
    });
  }
  
  // 解析ID各部分
  const yearPart = teacherId.substring(0, 2);
  const categoryCode = teacherId.charAt(2);
  const sequencePart = teacherId.substring(3, 6);
  
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const minYear = parseInt(currentYear) - 10;
  const maxYear = parseInt(currentYear) + 2;
  
  // 验证年份
  if (parseInt(yearPart) < minYear || parseInt(yearPart) > maxYear) {
    return res.json({ 
      success: false, 
      message: '教师ID中的年份标识不合理' 
    });
  }
  
  const typeText = categoryCode === 'T' ? '全职' : '兼职';
  
  res.json({ 
    success: true, 
    message: '教师ID格式正确',
    data: {
      year: yearPart,
      type: categoryCode,
      typeText: typeText,
      sequence: sequencePart,
      fullId: teacherId
    }
  });
});

// 统一添加用户接口 - 支持前端AdminDashboard
router.post("/addUser", (req, res) => {
  console.log("添加用户请求");
  const { id, name, password, role, status = 'active', college = '', class: className = '' } = req.body;
  
  if (!name || !password || !role) {
    return res.json({ success: false, message: '姓名、密码和角色不能为空' });
  }
  
  const mysql = require('mysql');
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'course selection'
  });
  
  // 检查是否存在三表分离架构
  connection.query(`
    SELECT COUNT(*) as count FROM information_schema.tables 
    WHERE table_schema = 'course selection' 
    AND table_name IN ('admins', 'teachers', 'students')
  `, (err, results) => {
    if (err) {
      console.error('检查表结构失败:', err);
      connection.end();
      return res.status(500).json({ success: false, message: '数据库查询失败' });
    }
    
    const hasThreeTables = results[0].count >= 3;
    
    if (hasThreeTables) {
      // 使用三表分离架构
      addUserToSeparateTables(connection, { id, name, password, role, status, college, className }, res);
    } else {
      // 使用传统单表架构
      addUserToSingleTable(connection, { id, name, password, role, status, college, className }, res);
    }
  });
});

// 统一更新用户接口 - 支持前端AdminDashboard
router.post("/updateUser", (req, res) => {
  console.log("更新用户请求");
  const { id, name, password, role, status, college, class: className } = req.body;
  
  if (!id || !name || !role) {
    return res.json({ success: false, message: 'ID、姓名和角色不能为空' });
  }
  
  const mysql = require('mysql');
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'course selection'
  });
  
  // 检查是否存在三表分离架构
  connection.query(`
    SELECT COUNT(*) as count FROM information_schema.tables 
    WHERE table_schema = 'course selection' 
    AND table_name IN ('admins', 'teachers', 'students')
  `, (err, results) => {
    if (err) {
      console.error('检查表结构失败:', err);
      connection.end();
      return res.status(500).json({ success: false, message: '数据库查询失败' });
    }
    
    const hasThreeTables = results[0].count >= 3;
    
    if (hasThreeTables) {
      // 使用三表分离架构
      updateUserInSeparateTables(connection, { id, name, password, role, status, college, className }, res);
    } else {
      // 使用传统单表架构
      updateUserInSingleTable(connection, { id, name, password, role, status, college, className }, res);
    }
  });
});

// 统一删除用户接口 - 支持前端AdminDashboard
router.post("/deleteUser", (req, res) => {
  console.log("删除用户请求");
  const { id } = req.body;
  
  if (!id) {
    return res.json({ success: false, message: '用户ID不能为空' });
  }
  
  if (id == 1) {
    return res.json({ success: false, message: '超级管理员不能删除' });
  }
  
  const mysql = require('mysql');
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'course selection'
  });
  
  // 检查是否存在三表分离架构
  connection.query(`
    SELECT COUNT(*) as count FROM information_schema.tables 
    WHERE table_schema = 'course selection' 
    AND table_name IN ('admins', 'teachers', 'students')
  `, (err, results) => {
    if (err) {
      console.error('检查表结构失败:', err);
      connection.end();
      return res.status(500).json({ success: false, message: '数据库查询失败' });
    }
    
    const hasThreeTables = results[0].count >= 3;
    
    if (hasThreeTables) {
      // 使用三表分离架构
      deleteUserFromSeparateTables(connection, id, res);
    } else {
      // 使用传统单表架构
      deleteUserFromSingleTable(connection, id, res);
    }
  });
});

// 单表架构的添加用户函数
function addUserToSingleTable(connection, userData, res) {
  const { id, name, password, role, status, college, className } = userData;
  
  // 学生ID自动生成
  if (role === 'student' && !id) {
    // 查询当前最大的学生ID
    connection.query(
      'SELECT MAX(CAST(id AS UNSIGNED)) as maxId FROM users WHERE role = "student"',
      (err, results) => {
        if (err) {
          console.error('生成学生ID失败:', err);
          connection.end();
          return res.json({ success: false, message: '生成学生ID失败' });
        }
        
        const currentMax = results[0].maxId || 1000;
        const newId = currentMax + 1;
        
        insertUserToSingleTable(newId);
      }
    );
  } else {
    insertUserToSingleTable(id);
  }
  
  function insertUserToSingleTable(finalId) {
    // 验证ID范围
    if (role === 'admin') {
      if (parseInt(finalId) < 1 || parseInt(finalId) > 10) {
        connection.end();
        return res.json({ success: false, message: '管理员ID必须在1-10范围内' });
      }
    } else if (role === 'teacher') {
      if (parseInt(finalId) < 11 || parseInt(finalId) > 999) {
        connection.end();
        return res.json({ success: false, message: '教师ID必须在11-999范围内' });
      }
    } else if (role === 'student') {
      if (parseInt(finalId) < 1001) {
        connection.end();
        return res.json({ success: false, message: '学生ID必须大于等于1001' });
      }
    }
    
    const sql = `INSERT INTO users (id, password, name, role, status, college, class) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    connection.query(sql, [finalId, password, name, role, status, college, className], (err) => {
      connection.end();
      
      if (err) {
        console.error('添加用户失败:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.json({ success: false, message: '用户ID已存在' });
        }
        return res.json({ success: false, message: '添加用户失败: ' + err.message });
      }
      
      res.json({ 
        success: true, 
        message: '添加用户成功',
        data: { id: finalId }
      });
    });
  }
}

// 单表架构的更新用户函数
function updateUserInSingleTable(connection, userData, res) {
  const { id, name, password, role, status, college, className } = userData;
  
  let sql, params;
  if (password && password.trim()) {
    sql = `UPDATE users SET name = ?, password = ?, status = ?, college = ?, class = ? WHERE id = ?`;
    params = [name, password, status, college, className, id];
  } else {
    sql = `UPDATE users SET name = ?, status = ?, college = ?, class = ? WHERE id = ?`;
    params = [name, status, college, className, id];
  }
  
  connection.query(sql, params, (err, results) => {
    connection.end();
    
    if (err) {
      console.error('更新用户失败:', err);
      return res.json({ success: false, message: '更新用户失败' });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    res.json({ success: true, message: '更新用户成功' });
  });
}

// 单表架构的删除用户函数
function deleteUserFromSingleTable(connection, id, res) {
  connection.query('DELETE FROM users WHERE id = ?', [id], (err, results) => {
    connection.end();
    
    if (err) {
      console.error('删除用户失败:', err);
      return res.json({ success: false, message: '删除用户失败' });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    res.json({ success: true, message: '删除用户成功' });
  });
}

// 三表分离架构的添加用户函数
function addUserToSeparateTables(connection, userData, res) {
  const { id, name, password, role, status, college, className } = userData;
  
  // 对于学生角色，需要生成ID
  if (role === 'student' && !id) {
    connection.query(
      'SELECT MAX(CAST(id AS UNSIGNED)) as maxId FROM students',
      (err, results) => {
        if (err) {
          console.error('查询学生ID失败:', err);
          connection.end();
          return res.json({ success: false, message: '生成学生ID失败' });
        }
        
        const currentMax = results[0].maxId || 2024000;
        const newStudentId = currentMax + 1;
        
        insertUserToSeparateTable(newStudentId);
      }
    );
  } else {
    insertUserToSeparateTable(id);
  }
  
  function insertUserToSeparateTable(finalId) {
    let sql, params;
    
    switch (role) {
      case 'admin':
        sql = `INSERT INTO admins (id, username, password, name, status, created_at) 
               VALUES (?, ?, ?, ?, ?, NOW())`;
        params = [finalId || 2, `admin${finalId || 2}`, password, name, status || 'active'];
        break;
        
      case 'teacher':
        sql = `INSERT INTO teachers (id, username, password, name, department, status, hire_date, created_at) 
               VALUES (?, ?, ?, ?, ?, ?, CURDATE(), NOW())`;
        params = [finalId || 101, `teacher${finalId || 101}`, password, name, college || '计算机学院', status || 'active'];
        break;
        
      case 'student':
        const grade = finalId >= 2025000 ? 2025 : 
                     finalId >= 2024000 ? 2024 :
                     finalId >= 2023000 ? 2023 : 2022;
        sql = `INSERT INTO students (id, username, password, name, college, major, class_name, grade, enrollment_date, status, created_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
        params = [
          finalId, 
          `student${finalId}`, 
          password, 
          name, 
          college || '计算机学院', 
          '计算机科学与技术',
          className || `${grade}级1班`,
          grade,
          `${grade}-09-01`,
          status || 'active'
        ];
        break;
        
      default:
        connection.end();
        return res.json({ success: false, message: '无效的用户角色' });
    }
    
    connection.query(sql, params, (err, results) => {
      connection.end();
      
      if (err) {
        console.error('添加用户失败:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.json({ success: false, message: '用户ID已存在' });
        }
        return res.json({ success: false, message: '添加用户失败: ' + err.message });
      }
      
      const newId = finalId || (role === 'admin' ? 2 : role === 'teacher' ? 101 : 2024001);
      res.json({ 
        success: true, 
        message: '添加用户成功',
        data: { id: newId }
      });
    });
  }
}

// 三表分离架构的更新用户函数
function updateUserInSeparateTables(connection, userData, res) {
  const { id, name, password, role, status, college, className } = userData;
  
  let table, sql, params;
  switch (role) {
    case 'admin':
      table = 'admins';
      if (password && password.trim()) {
        sql = `UPDATE ${table} SET name = ?, password = ?, status = ? WHERE id = ?`;
        params = [name, password, status, id];
      } else {
        sql = `UPDATE ${table} SET name = ?, status = ? WHERE id = ?`;
        params = [name, status, id];
      }
      break;
      
    case 'teacher':
      table = 'teachers';
      if (password && password.trim()) {
        sql = `UPDATE ${table} SET name = ?, password = ?, department = ?, status = ? WHERE id = ?`;
        params = [name, password, college, status, id];
      } else {
        sql = `UPDATE ${table} SET name = ?, department = ?, status = ? WHERE id = ?`;
        params = [name, college, status, id];
      }
      break;
      
    case 'student':
      table = 'students';
      if (password && password.trim()) {
        sql = `UPDATE ${table} SET name = ?, password = ?, college = ?, class_name = ?, status = ? WHERE id = ?`;
        params = [name, password, college, className, status, id];
      } else {
        sql = `UPDATE ${table} SET name = ?, college = ?, class_name = ?, status = ? WHERE id = ?`;
        params = [name, college, className, status, id];
      }
      break;
      
    default:
      connection.end();
      return res.json({ success: false, message: '无效的用户角色' });
  }
  
  connection.query(sql, params, (err, results) => {
    connection.end();
    
    if (err) {
      console.error('更新用户失败:', err);
      return res.json({ success: false, message: '更新用户失败' });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    res.json({ success: true, message: '更新用户成功' });
  });
}

// 三表分离架构的删除用户函数
function deleteUserFromSeparateTables(connection, id, res) {
  // 先查找用户在哪个表中
  const findUserQuery = `
    SELECT 'admins' as table_name, id FROM admins WHERE id = ?
    UNION ALL
    SELECT 'teachers' as table_name, id FROM teachers WHERE id = ?
    UNION ALL
    SELECT 'students' as table_name, id FROM students WHERE id = ?
  `;
  
  connection.query(findUserQuery, [id, id, id], (err, results) => {
    if (err) {
      console.error('查找用户失败:', err);
      connection.end();
      return res.json({ success: false, message: '删除用户失败' });
    }
    
    if (results.length === 0) {
      connection.end();
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    const tableName = results[0].table_name;
    const deleteSql = `DELETE FROM ${tableName} WHERE id = ?`;
    
    connection.query(deleteSql, [id], (err, deleteResults) => {
      connection.end();
      
      if (err) {
        console.error('删除用户失败:', err);
        return res.json({ success: false, message: '删除用户失败' });
      }
      
      if (deleteResults.affectedRows === 0) {
        return res.json({ success: false, message: '删除用户失败' });
      }
      
      res.json({ success: true, message: '删除用户成功' });
    });
  });
}

// 修改用户状态接口 - 支持前端AdminDashboard
router.post("/changeUserStatus", (req, res) => {
  console.log("修改用户状态请求");
  const { id, status } = req.body;
  
  if (!id || !status) {
    return res.status(400).json({ success: false, message: '用户ID和状态不能为空' });
  }
  
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ success: false, message: '状态值无效，只能是active或inactive' });
  }
  
  const mysql = require('mysql');
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'course selection'
  });
  
  // 检查是否存在三表分离架构
  connection.query(`
    SELECT COUNT(*) as count FROM information_schema.tables 
    WHERE table_schema = 'course selection' 
    AND table_name IN ('admins', 'teachers', 'students')
  `, (err, results) => {
    if (err) {
      console.error('检查表结构失败:', err);
      connection.end();
      return res.status(500).json({ success: false, message: '数据库查询失败' });
    }
    
    const hasThreeTables = results[0].count >= 3;
    
    if (hasThreeTables) {
      // 三表分离架构：需要先确定用户在哪个表中
      const checkQueries = [
        { table: 'admins', role: 'admin' },
        { table: 'teachers', role: 'teacher' },
        { table: 'students', role: 'student' }
      ];
      
      let found = false;
      let checkedCount = 0;
      
      checkQueries.forEach(({ table, role }) => {
        connection.query(`SELECT id FROM ${table} WHERE id = ?`, [id], (err, userResults) => {
          if (err) {
            console.error(`检查${table}表失败:`, err);
            checkedCount++;
            if (checkedCount === checkQueries.length && !found) {
              connection.end();
              return res.status(404).json({ success: false, message: '用户不存在' });
            }
            return;
          }
          
          if (userResults.length > 0 && !found) {
            found = true;
            connection.query(`UPDATE ${table} SET status = ? WHERE id = ?`, [status, id], (err, updateResults) => {
              connection.end();
              
              if (err) {
                console.error('修改用户状态失败:', err);
                return res.status(500).json({ success: false, message: '修改用户状态失败' });
              }
              
              if (updateResults.affectedRows === 0) {
                return res.status(404).json({ success: false, message: '用户不存在' });
              }
              
              res.json({ success: true, message: '修改用户状态成功' });
            });
          } else {
            checkedCount++;
            if (checkedCount === checkQueries.length && !found) {
              connection.end();
              return res.status(404).json({ success: false, message: '用户不存在' });
            }
          }
        });
      });
    } else {
      // 传统单表架构
      connection.query('UPDATE users SET status = ? WHERE id = ?', [status, id], (err, results) => {
        connection.end();
        
        if (err) {
          console.error('修改用户状态失败:', err);
          return res.json({ success: false, message: '修改用户状态失败' });
        }
        
        if (results.affectedRows === 0) {
          return res.status(404).json({ success: false, message: '用户不存在' });
        }
        
        res.json({ success: true, message: '修改用户状态成功' });
      });
    }
  });
});

// 生成三表分离的学生ID
function generateStudentIdForSeparateTables() {
  const currentYear = new Date().getFullYear();
  return `${currentYear}01`;
}

module.exports = router;