USE `course selection`;

-- 删除旧的selectCourse存储过程
DROP PROCEDURE IF EXISTS `selectCourse`;

DELIMITER //

CREATE PROCEDURE `selectCourse`(IN p_courseId INT, IN p_studentId INT)
BEGIN
    DECLARE v_courseExists INT DEFAULT 0;
    DECLARE v_courseTime VARCHAR(50);
    DECLARE v_maxStudents INT;
    DECLARE v_currentStudents INT;
    DECLARE v_studentAlreadySelected INT DEFAULT 0;
    DECLARE v_conflictDetected INT DEFAULT 0;
    DECLARE v_conflictCourseId INT;
    DECLARE v_conflictCourseName VARCHAR(100);
    DECLARE v_conflictTime VARCHAR(50);
    DECLARE v_error_message VARCHAR(200);
    
    -- 1. 检查课程是否存在
    SELECT COUNT(*) INTO v_courseExists FROM courses WHERE id = p_courseId;
    
    IF v_courseExists = 0 THEN
        SELECT '{"error": "课程不存在"}' AS result;
        LEAVE selectCourse;
    END IF;
    
    -- 2. 获取课程信息
    SELECT `time`, maxStudents, 
           JSON_LENGTH(IFNULL(students, JSON_ARRAY())) 
    INTO v_courseTime, v_maxStudents, v_currentStudents
    FROM courses 
    WHERE id = p_courseId;
    
    -- 3. 检查学生是否已选该课程
    SELECT COUNT(*) 
    INTO v_studentAlreadySelected
    FROM courses c 
    WHERE c.id = p_courseId 
    AND JSON_CONTAINS(c.students, CAST(p_studentId AS JSON));
    
    IF v_studentAlreadySelected > 0 THEN
        SELECT '{"error": "您已选择此课程"}' AS result;
        LEAVE selectCourse;
    END IF;
    
    -- 4. 检查课程人数上限
    IF v_currentStudents >= v_maxStudents THEN
        SELECT '{"error": "课程名额已满"}' AS result;
        LEAVE selectCourse;
    END IF;
    
    -- 5. 检查时间冲突
    SELECT c.id, c.name, c.`time`
    INTO v_conflictCourseId, v_conflictCourseName, v_conflictTime
    FROM courses c
    WHERE JSON_CONTAINS(c.students, CAST(p_studentId AS JSON))
    AND c.id != p_courseId
    AND hasTimeConflict(c.`time`, v_courseTime)
    LIMIT 1;
    
    IF v_conflictCourseId IS NOT NULL THEN
        SELECT CONCAT('{"error": "时间冲突：与已选课程《', v_conflictCourseName, '》时间冲突 (', v_conflictTime, ')"}') AS result;
        LEAVE selectCourse;
    END IF;
    
    -- 6. 所有检查通过，执行选课
    UPDATE courses 
    SET students = JSON_ARRAY_APPEND(IFNULL(students, JSON_ARRAY()), '$', p_studentId) 
    WHERE id = p_courseId;
    
    SELECT '{"success": true, "message": "选课成功"}' AS result;
END //

DELIMITER ;

-- 删除旧的函数（如果存在）
DROP FUNCTION IF EXISTS hasTimeConflict;

DELIMITER //

CREATE FUNCTION hasTimeConflict(time1 VARCHAR(50), time2 VARCHAR(50))
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE weekday1 INT DEFAULT -1;
    DECLARE weekday2 INT DEFAULT -1;
    DECLARE startHour1 INT DEFAULT -1;
    DECLARE endHour1 INT DEFAULT -1;
    DECLARE startHour2 INT DEFAULT -1;
    DECLARE endHour2 INT DEFAULT -1;
    DECLARE temp VARCHAR(50);
    DECLARE weekdayChar VARCHAR(1);
    DECLARE periodStartStr VARCHAR(2);
    DECLARE periodEndStr VARCHAR(2);
    
    -- 解析time1
    SET temp = time1;
    
    -- 提取星期: "周二第5-6节" 或 "周二 第5-6节" -> "周二"
    IF INSTR(temp, '周') > 0 THEN
        SET weekdayChar = SUBSTRING(temp, LOCATE('周', temp) + 1, 1);
        
        CASE weekdayChar
            WHEN '一' THEN SET weekday1 = 1;
            WHEN '二' THEN SET weekday1 = 2;
            WHEN '三' THEN SET weekday1 = 3;
            WHEN '四' THEN SET weekday1 = 4;
            WHEN '五' THEN SET weekday1 = 5;
            WHEN '六' THEN SET weekday1 = 6;
            WHEN '日' THEN SET weekday1 = 0;
        END CASE;
    END IF;
    
    -- 提取节次: "周二第5-6节" -> "5" 和 "6"
    IF INSTR(temp, '第') > 0 AND INSTR(temp, '-') > 0 AND INSTR(temp, '节') > 0 THEN
        -- 提取 "5-6" 部分
        SET temp = SUBSTRING(temp, LOCATE('第', temp) + 1);
        SET temp = SUBSTRING(temp, 1, LOCATE('节', temp) - 1);
        
        -- 提取起始节次
        SET periodStartStr = SUBSTRING(temp, 1, LOCATE('-', temp) - 1);
        SET periodEndStr = SUBSTRING(temp, LOCATE('-', temp) + 1);
        
        -- 转换为数字
        SET startHour1 = CAST(periodStartStr AS UNSIGNED);
        SET endHour1 = CAST(periodEndStr AS UNSIGNED);
        
        -- 将节次转换为小时
        CASE startHour1
            WHEN 1 THEN SET startHour1 = 8;
            WHEN 3 THEN SET startHour1 = 10;
            WHEN 5 THEN SET startHour1 = 14;
            WHEN 7 THEN SET startHour1 = 16;
            WHEN 9 THEN SET startHour1 = 19;
            ELSE SET startHour1 = -1;
        END CASE;
        
        CASE endHour1
            WHEN 2 THEN SET endHour1 = 10;
            WHEN 4 THEN SET endHour1 = 12;
            WHEN 6 THEN SET endHour1 = 16;
            WHEN 8 THEN SET endHour1 = 18;
            WHEN 10 THEN SET endHour1 = 21;
            ELSE SET endHour1 = -1;
        END CASE;
    END IF;
    
    -- 解析time2 (相同逻辑)
    SET temp = time2;
    
    IF INSTR(temp, '周') > 0 THEN
        SET weekdayChar = SUBSTRING(temp, LOCATE('周', temp) + 1, 1);
        
        CASE weekdayChar
            WHEN '一' THEN SET weekday2 = 1;
            WHEN '二' THEN SET weekday2 = 2;
            WHEN '三' THEN SET weekday2 = 3;
            WHEN '四' THEN SET weekday2 = 4;
            WHEN '五' THEN SET weekday2 = 5;
            WHEN '六' THEN SET weekday2 = 6;
            WHEN '日' THEN SET weekday2 = 0;
        END CASE;
    END IF;
    
    IF INSTR(temp, '第') > 0 AND INSTR(temp, '-') > 0 AND INSTR(temp, '节') > 0 THEN
        SET temp = SUBSTRING(temp, LOCATE('第', temp) + 1);
        SET temp = SUBSTRING(temp, 1, LOCATE('节', temp) - 1);
        
        SET periodStartStr = SUBSTRING(temp, 1, LOCATE('-', temp) - 1);
        SET periodEndStr = SUBSTRING(temp, LOCATE('-', temp) + 1);
        
        SET startHour2 = CAST(periodStartStr AS UNSIGNED);
        SET endHour2 = CAST(periodEndStr AS UNSIGNED);
        
        CASE startHour2
            WHEN 1 THEN SET startHour2 = 8;
            WHEN 3 THEN SET startHour2 = 10;
            WHEN 5 THEN SET startHour2 = 14;
            WHEN 7 THEN SET startHour2 = 16;
            WHEN 9 THEN SET startHour2 = 19;
            ELSE SET startHour2 = -1;
        END CASE;
        
        CASE endHour2
            WHEN 2 THEN SET endHour2 = 10;
            WHEN 4 THEN SET endHour2 = 12;
            WHEN 6 THEN SET endHour2 = 16;
            WHEN 8 THEN SET endHour2 = 18;
            WHEN 10 THEN SET endHour2 = 21;
            ELSE SET endHour2 = -1;
        END CASE;
    END IF;
    
    -- 检查是否冲突
    -- 如果解析失败，视为安全（不冲突）
    IF weekday1 = -1 OR weekday2 = -1 OR startHour1 = -1 OR endHour1 = -1 OR startHour2 = -1 OR endHour2 = -1 THEN
        RETURN FALSE;
    END IF;
    
    -- 不同星期不冲突
    IF weekday1 != weekday2 THEN
        RETURN FALSE;
    END IF;
    
    -- 检查时间段重叠
    IF (startHour1 < endHour2) AND (endHour1 > startHour2) THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END //

DELIMITER ;

-- 显示创建的存储过程和函数
SELECT '存储过程和函数创建完成' AS status;

-- 验证selectCourse存储过程
SELECT 
    ROUTINE_NAME,
    ROUTINE_TYPE
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_SCHEMA = 'course selection' 
AND ROUTINE_NAME IN ('selectCourse', 'hasTimeConflict');
