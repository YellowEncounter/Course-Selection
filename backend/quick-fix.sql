USE `course selection`;

DROP PROCEDURE IF EXISTS `dropCourse`;

DELIMITER //

CREATE PROCEDURE `dropCourse`(IN p_courseId INT, IN p_studentId INT)
BEGIN
    DECLARE v_courseName VARCHAR(100);
    DECLARE v_students TEXT;
    DECLARE v_studentIdStr VARCHAR(50);
    
    -- 获取课程信息
    SELECT name, students INTO v_courseName, v_students
    FROM courses WHERE id = p_courseId;
    
    -- 转换学生ID为字符串
    SET v_studentIdStr = CAST(p_studentId AS CHAR);
    
    -- 检查学生是否在课程中（简单的字符串匹配）
    IF v_students LIKE CONCAT('%"', v_studentIdStr, '"%') THEN
        -- 移除学生
        UPDATE courses
        SET students = REPLACE(REPLACE(v_students, CONCAT(',"', v_studentIdStr, '"'), ''), CONCAT('"', v_studentIdStr, '"'), '')
        WHERE id = p_courseId;
        
        -- 返回成功
        SELECT JSON_OBJECT(
            'success', TRUE,
            'message', CONCAT('成功退选课程《', v_courseName, '》'),
            'courseId', p_courseId,
            'studentId', p_studentId
        ) AS result;
    ELSE
        -- 返回失败
        SELECT JSON_OBJECT(
            'success', FALSE,
            'error', CONCAT('您未选择课程《', v_courseName, '》'),
            'courseId', p_courseId,
            'studentId', p_studentId
        ) AS result;
    END IF;
END //

DELIMITER ;

SELECT '✓ 退课存储过程已修复' AS status;