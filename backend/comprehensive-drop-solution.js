const { usselect } = require('./mysql');
const _localhost = ['localhost', 'course selection'];

console.log('=== 完整退课问题诊断和修复 ===');

async function diagnoseAndFix() {
  return new Promise((resolve, reject) => {
    // 1. 检查课程19的当前状态
    console.log('\n1. 检查课程19的当前状态:');
    usselect([_localhost[0], _localhost[1], 'getAllCourses'], function(ret) {
      if (ret && ret.data) {
        const course19 = ret.data.find(c => c.id === 19);
        if (course19) {
          console.log('课程19:', {
            id: course19.id,
            name: course19.name,
            students: course19.students,
            studentsType: typeof course19.students
          });
          
          // 解析学生列表
          try {
            const students = JSON.parse(course19.students);
            console.log('解析后的学生列表:', students);
            console.log('学生202501是否在列表中:', students.includes('202501'), students.includes(202501));
          } catch (e) {
            console.log('学生列表JSON解析失败');
          }
        }
      }
      
      // 2. 测试退课功能（学生ID使用字符串）
      console.log('\n2. 测试退课功能（学生ID使用字符串）:');
      usselect([_localhost[0], _localhost[1], 'dropCourse', 19, '202501'], function(ret) {
        console.log('字符串学生ID退课结果:', JSON.stringify(ret, null, 2));
        
        // 3. 测试退课功能（学生ID使用数字）
        console.log('\n3. 测试退课功能（学生ID使用数字）:');
        usselect([_localhost[0], _localhost[1], 'dropCourse', 19, 202501], function(ret2) {
          console.log('数字学生ID退课结果:', JSON.stringify(ret2, null, 2));
          
          resolve({
            stringResult: ret,
            numberResult: ret2
          });
        });
      });
    });
  });
}

async function createFixedProcedure() {
  console.log('\n=== 创建增强版退课存储过程 ===');
  
  const mysql = require('mysql');
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'course selection'
  });
  
  return new Promise((resolve, reject) => {
    // 删除旧存储过程
    connection.query('DROP PROCEDURE IF EXISTS dropCourse', (err) => {
      if (err) {
        console.error('删除存储过程失败:', err.message);
        reject(err);
        return;
      }
      console.log('旧存储过程删除成功');
      
      // 创建增强版存储过程
      const createProc = `
        CREATE PROCEDURE dropCourse(IN p_course_id INT, IN p_student_id VARCHAR(50))
        BEGIN
          DECLARE v_course_exists INT DEFAULT 0;
          DECLARE v_students_text TEXT;
          DECLARE v_student_id_str VARCHAR(50);
          
          -- 标准化学生ID为字符串
          SET v_student_id_str = CAST(p_student_id AS CHAR);
          
          -- 检查课程是否存在
          SELECT COUNT(*) INTO v_course_exists FROM courses WHERE id = p_course_id;
          
          IF v_course_exists = 0 THEN
            SELECT JSON_OBJECT('success', false, 'error', 'Course not found', 'courseId', p_course_id, 'studentId', v_student_id_str) as result;
          ELSE
            -- 获取当前学生列表
            SELECT COALESCE(students, '[]') INTO v_students_text FROM courses WHERE id = p_course_id;
            
            -- 多重匹配检查
            IF LOCATE(CONCAT('"', v_student_id_str, '"'), v_students_text) > 0 THEN
              -- 学生在课程中，执行退课
              SET v_students_text = REPLACE(v_students_text, CONCAT('"', v_student_id_str, '"'), '');
              SET v_students_text = REPLACE(v_students_text, ',,', ',');
              SET v_students_text = REPLACE(v_students_text, '[,', '[');
              SET v_students_text = REPLACE(v_students_text, ',]', ']');
              
              IF v_students_text = '' OR v_students_text = '[' THEN
                SET v_students_text = '[]';
              END IF;
              
              UPDATE courses SET students = v_students_text WHERE id = p_course_id;
              
              IF ROW_COUNT() > 0 THEN
                SELECT JSON_OBJECT('success', true, 'message', 'Drop course successful', 'courseId', p_course_id, 'studentId', v_student_id_str) as result;
              ELSE
                SELECT JSON_OBJECT('success', false, 'error', 'Failed to update database', 'courseId', p_course_id, 'studentId', v_student_id_str) as result;
              END IF;
            ELSE
              -- 学生不在课程中
              SELECT JSON_OBJECT('success', false, 'error', 'You have not selected this course', 'courseId', p_course_id, 'studentId', v_student_id_str) as result;
            END IF;
          END IF;
        END
      `;
      
      connection.query(createProc, (err2) => {
        if (err2) {
          console.error('创建增强存储过程失败:', err2.message);
          reject(err2);
        } else {
          console.log('增强存储过程创建成功！');
          resolve();
        }
        connection.end();
      });
    });
  });
}

async function runFullTest() {
  try {
    // 1. 创建修复后的存储过程
    await createFixedProcedure();
    
    // 2. 运行诊断测试
    const results = await diagnoseAndFix();
    
    console.log('\n=== 测试完成 ===');
    console.log('字符串学生ID结果:', results.stringResult);
    console.log('数字学生ID结果:', results.numberResult);
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 执行完整测试
runFullTest();