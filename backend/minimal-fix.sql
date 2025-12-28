USE `course selection`;

DROP PROCEDURE IF EXISTS `dropCourse`;

CREATE PROCEDURE `dropCourse`(IN p_courseId INT, IN p_studentId INT)
BEGIN
    DECLARE v_courseName VARCHAR(100);
    DECLARE v_students TEXT;
    DECLARE v_studentIdStr VARCHAR(50);
    
    SELECT name, students INTO v_courseName, v_students
    FROM courses WHERE id = p_courseId;
    
    SET v_studentIdStr = CAST(p_studentId AS CHAR);
    
    IF v_students LIKE CONCAT('%"', v_studentIdStr, '"%') THEN
        UPDATE courses
        SET students = REPLACE(REPLACE(v_students, CONCAT(',"', v_studentIdStr, '"'), ''), CONCAT('"', v_studentIdStr, '"'), '')
        WHERE id = p_courseId;
        
        SELECT '{"success":true,"message":"退课成功","courseId":' + p_courseId + ',"studentId":' + p_studentId + '}' AS result;
    ELSE
        SELECT '{"success":false,"error":"您未选择此课程","courseId":' + p_courseId + ',"studentId":' + p_studentId + '}' AS result;
    END IF;
END;