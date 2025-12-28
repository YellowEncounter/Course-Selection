-- 删除旧的退课存储过程
DROP PROCEDURE IF EXISTS dropCourse;

-- 创建新的简化退课存储过程
DELIMITER //
CREATE PROCEDURE dropCourse(
    IN p_course_id INT,
    IN p_student_id VARCHAR(20)
)
BEGIN
    DECLARE v_course_exists INT DEFAULT 0;
    DECLARE v_students_text TEXT;
    DECLARE v_result VARCHAR(500);
    
    -- 检查课程是否存在
    SELECT COUNT(*) INTO v_course_exists FROM courses WHERE id = p_course_id;
    
    IF v_course_exists = 0 THEN
        SELECT JSON_OBJECT('success', false, 'error', 'Course not found', 'courseId', p_course_id, 'studentId', p_student_id) as result;
    ELSE
        -- 获取当前学生列表
        SELECT COALESCE(students, '[]') INTO v_students_text FROM courses WHERE id = p_course_id;
        
        -- 检查学生是否在课程中（字符串匹配）
        IF LOCATE(CONCAT('"', p_student_id, '"'), v_students_text) = 0 THEN
            SELECT JSON_OBJECT('success', false, 'error', 'You have not selected this course', 'courseId', p_course_id, 'studentId', p_student_id) as result;
        ELSE
            -- 移除学生
            SET v_students_text = REPLACE(v_students_text, CONCAT('"', p_student_id, '"'), '');
            SET v_students_text = REPLACE(v_students_text, ',,', ',');
            SET v_students_text = REPLACE(v_students_text, '[,', '[');
            SET v_students_text = REPLACE(v_students_text, ',]', ']');
            
            IF v_students_text = '' OR v_students_text = '[' THEN
                SET v_students_text = '[]';
            END IF;
            
            -- 更新课程
            UPDATE courses SET students = v_students_text WHERE id = p_course_id;
            
            IF ROW_COUNT() > 0 THEN
                SELECT JSON_OBJECT('success', true, 'message', 'Drop course successful', 'courseId', p_course_id, 'studentId', p_student_id) as result;
            ELSE
                SELECT JSON_OBJECT('success', false, 'error', 'Failed to update database', 'courseId', p_course_id, 'studentId', p_student_id) as result;
            END IF;
        END IF;
    END IF;
END //
DELIMITER ;