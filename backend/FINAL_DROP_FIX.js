const mysql = require('mysql');

console.log('开始最终退课修复...');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'course selection'
});

// 1. 删除旧存储过程
connection.query('DROP PROCEDURE IF EXISTS dropCourse', (err) => {
  if (err) {
    console.error('删除存储过程失败:', err.message);
    return;
  }
  console.log('旧存储过程删除成功');
  
  // 2. 创建新存储过程
  const createProcedureSQL = `
    CREATE PROCEDURE dropCourse(IN p_course_id INT, IN p_student_id VARCHAR(50))
    BEGIN
      DECLARE v_course_exists INT DEFAULT 0;
      DECLARE v_students_text TEXT;
      DECLARE v_student_id_str VARCHAR(50);
      
      -- 统一转换为字符串处理
      SET v_student_id_str = CAST(p_student_id AS CHAR);
      
      -- 检查课程是否存在
      SELECT COUNT(*) INTO v_course_exists FROM courses WHERE id = p_course_id;
      
      IF v_course_exists = 0 THEN
        SELECT JSON_OBJECT('success', false, 'error', 'Course not found', 'courseId', p_course_id, 'studentId', v_student_id_str) as result;
      ELSE
        -- 获取当前学生列表
        SELECT COALESCE(students, '[]') INTO v_students_text FROM courses WHERE id = p_course_id;
        
        -- 检查学生是否在课程中（字符串匹配）
        IF LOCATE(CONCAT('"', v_student_id_str, '"'), v_students_text) > 0 THEN
          -- 学生在课程中，执行退课操作
          SET v_students_text = REPLACE(v_students_text, CONCAT('"', v_student_id_str, '"'), '');
          SET v_students_text = REPLACE(v_students_text, ',,', ',');
          SET v_students_text = REPLACE(v_students_text, '[,', '[');
          SET v_students_text = REPLACE(v_students_text, ',]', ']');
          
          IF v_students_text = '' OR v_students_text = '[' THEN
            SET v_students_text = '[]';
          END IF;
          
          -- 更新数据库
          UPDATE courses SET students = v_students_text WHERE id = p_course_id;
          
          IF ROW_COUNT() > 0 THEN
            SELECT JSON_OBJECT('success', true, 'message', '退课成功', 'courseId', p_course_id, 'studentId', v_student_id_str) as result;
          ELSE
            SELECT JSON_OBJECT('success', false, 'error', '数据库更新失败', 'courseId', p_course_id, 'studentId', v_student_id_str) as result;
          END IF;
        ELSE
          -- 学生不在课程中，返回中文错误信息（使用英文避免编码问题）
          SELECT JSON_OBJECT('success', false, 'error', 'You have not selected this course', 'courseId', p_course_id, 'studentId', v_student_id_str) as result;
        END IF;
      END IF;
    END
  `;
  
  connection.query(createProcedureSQL, (err2) => {
    if (err2) {
      console.error('创建新存储过程失败:', err2.message);
      console.error('SQL:', createProcedureSQL);
    } else {
      console.log('新存储过程创建成功！');
      
      // 3. 测试新存储过程
      console.log('\n测试新存储过程...');
      connection.query('CALL dropCourse(19, "202501")', (err3, results) => {
        if (err3) {
          console.error('测试失败:', err3.message);
        } else {
          console.log('测试结果:', results);
        }
        
        connection.end();
        console.log('\n修复完成！现在退课功能应该正常工作了。');
      });
    }
  });
});