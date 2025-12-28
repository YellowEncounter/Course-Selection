@echo off
echo 开始修复退课编码问题...

cd /d "%~dp0"

echo 执行SQL修复...
mysql -h localhost -u root -proot "course selection" < simple-drop-fix.sql

if %errorlevel% equ 0 (
    echo SQL修复成功！
) else (
    echo SQL修复失败，尝试使用Node.js执行...
    node -e "const mysql = require('mysql'); const connection = mysql.createConnection({host:'localhost',user:'root',password:'root',database:'course selection'}); connection.query('DROP PROCEDURE IF EXISTS dropCourse', (err)=>{if(err)console.error(err);else{connection.query(`CREATE PROCEDURE dropCourse(IN p_course_id INT, IN p_student_id VARCHAR(20)) BEGIN DECLARE v_course_exists INT DEFAULT 0; DECLARE v_students_text TEXT; SELECT COUNT(*) INTO v_course_exists FROM courses WHERE id = p_course_id; IF v_course_exists = 0 THEN SELECT JSON_OBJECT('success', false, 'error', 'Course not found') as result; ELSE SELECT COALESCE(students, '[]') INTO v_students_text FROM courses WHERE id = p_course_id; IF LOCATE(CONCAT('\"', p_student_id, '\"'), v_students_text) = 0 THEN SELECT JSON_OBJECT('success', false, 'error', 'You have not selected this course') as result; ELSE SET v_students_text = REPLACE(v_students_text, CONCAT('\"', p_student_id, '\"'), ''); SET v_students_text = REPLACE(v_students_text, ',,', ','); SET v_students_text = REPLACE(v_students_text, '[,', '['); SET v_students_text = REPLACE(v_students_text, ',]', ']'); IF v_students_text = '' OR v_students_text = '[' THEN SET v_students_text = '[]'; END IF; UPDATE courses SET students = v_students_text WHERE id = p_course_id; IF ROW_COUNT() > 0 THEN SELECT JSON_OBJECT('success', true, 'message', 'Drop course successful') as result; ELSE SELECT JSON_OBJECT('success', false, 'error', 'Failed to update database') as result; END IF; END IF; END IF; END`, (err2)=>{if(err2)console.error(err2);else{console.log('存储过程创建成功');connection.end();}});});"
)

echo 修复完成！
pause