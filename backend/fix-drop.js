const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'course selection'
});

console.log('开始修复退课存储过程...');

// 先删除旧存储过程
connection.query('DROP PROCEDURE IF EXISTS dropCourse', (err) => {
  if (err) {
    console.error('删除存储过程失败:', err.message);
  } else {
    console.log('旧存储过程删除成功');
  }
  
  // 创建新存储过程
  const createProc = `
    CREATE PROCEDURE dropCourse(IN p_course_id INT, IN p_student_id VARCHAR(20))
    BEGIN
      DECLARE v_course_exists INT DEFAULT 0;
      DECLARE v_students_text TEXT;
      
      SELECT COUNT(*) INTO v_course_exists FROM courses WHERE id = p_course_id;
      
      IF v_course_exists = 0 THEN
        SELECT JSON_OBJECT('success', false, 'error', 'Course not found', 'courseId', p_course_id, 'studentId', p_student_id) as result;
      ELSE
        SELECT COALESCE(students, '[]') INTO v_students_text FROM courses WHERE id = p_course_id;
        
        IF LOCATE(CONCAT('"', p_student_id, '"'), v_students_text) = 0 THEN
          SELECT JSON_OBJECT('success', false, 'error', 'You have not selected this course', 'courseId', p_course_id, 'studentId', p_student_id) as result;
        ELSE
          SET v_students_text = REPLACE(v_students_text, CONCAT('"', p_student_id, '"'), '');
          SET v_students_text = REPLACE(v_students_text, ',,', ',');
          SET v_students_text = REPLACE(v_students_text, '[,', '[');
          SET v_students_text = REPLACE(v_students_text, ',]', ']');
          
          IF v_students_text = '' OR v_students_text = '[' THEN
            SET v_students_text = '[]';
          END IF;
          
          UPDATE courses SET students = v_students_text WHERE id = p_course_id;
          
          IF ROW_COUNT() > 0 THEN
            SELECT JSON_OBJECT('success', true, 'message', 'Drop course successful', 'courseId', p_course_id, 'studentId', p_student_id) as result;
          ELSE
            SELECT JSON_OBJECT('success', false, 'error', 'Failed to update database', 'courseId', p_course_id, 'studentId', p_student_id) as result;
          END IF;
        END IF;
      END IF;
    END
  `;
  
  connection.query(createProc, (err2) => {
    if (err2) {
      console.error('创建存储过程失败:', err2.message);
    } else {
      console.log('新存储过程创建成功！');
    }
    
    connection.end();
  });
});