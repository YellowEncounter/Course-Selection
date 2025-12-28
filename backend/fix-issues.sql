USE `course selection`;

-- ==========================================
-- 问题修复SQL脚本
-- 1. 修复退课操作
-- 2. 优化选课冲突检测
-- 3. 增强错误处理
-- ==========================================

-- 删除旧的存储过程
DROP PROCEDURE IF EXISTS `selectCourse`;
DROP PROCEDURE IF EXISTS `dropCourse`;
DROP PROCEDURE IF EXISTS `getCourseInfo`;

DELIMITER //

-- 1. 改进的选课存储过程（带冲突检测）
CREATE PROCEDURE `selectCourse`(IN p_courseId INT, IN p_studentId INT)
BEGIN
    DECLARE v_courseExists INT DEFAULT 0;
    DECLARE v_courseName VARCHAR(100);
    DECLARE v_courseTime VARCHAR(50);
    DECLARE v_maxStudents INT;
    DECLARE v_currentStudents INT;
    DECLARE v_studentAlreadySelected INT DEFAULT 0;
    DECLARE v_conflictDetected INT DEFAULT 0;
    DECLARE v_conflictCourseId INT;
    DECLARE v_conflictCourseName VARCHAR(100);
    DECLARE v_conflictTime VARCHAR(50);
    DECLARE v_success BOOLEAN DEFAULT FALSE;
    
    -- 1. 检查课程是否存在
    SELECT COUNT(*) INTO v_courseExists FROM courses WHERE id = p_courseId;
    
    IF v_courseExists = 0 THEN
        SELECT JSON_OBJECT(
            'success', FALSE,
            'error', '课程不存在',
            'code', 'COURSE_NOT_FOUND'
        ) AS result;
        LEAVE selectCourse;
    END IF;
    
    -- 2. 获取课程信息
    SELECT name, `time`, maxStudents, 
           JSON_LENGTH(IFNULL(students, JSON_ARRAY()))
    INTO v_courseName, v_courseTime, v_maxStudents, v_currentStudents
    FROM courses 
    WHERE id = p_courseId;
    
    -- 3. 检查学生是否已选该课程
    SELECT COUNT(*) 
    INTO v_studentAlreadySelected
    FROM courses c 
    WHERE c.id = p_courseId 
    AND JSON_CONTAINS(c.students, CAST(p_studentId AS JSON));
    
    IF v_studentAlreadySelected > 0 THEN
        SELECT JSON_OBJECT(
            'success', FALSE,
            'error', CONCAT('您已选择课程《', v_courseName, '》'),
            'code', 'ALREADY_SELECTED'
        ) AS result;
        LEAVE selectCourse;
    END IF;
    
    -- 4. 检查课程人数上限
    IF v_currentStudents >= v_maxStudents THEN
        SELECT JSON_OBJECT(
            'success', FALSE,
            'error', CONCAT('课程《', v_courseName, '》名额已满'),
            'code', 'COURSE_FULL'
        ) AS result;
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
        SELECT JSON_OBJECT(
            'success', FALSE,
            'error', CONCAT('时间冲突：与已选课程《', v_conflictCourseName, '》时间冲突'),
            'details', JSON_OBJECT(
                'conflictCourseId', v_conflictCourseId,
                'conflictCourseName', v_conflictCourseName,
                'conflictTime', v_conflictTime,
                'currentCourseTime', v_courseTime
            ),
            'code', 'TIME_CONFLICT'
        ) AS result;
        LEAVE selectCourse;
    END IF;
    
    -- 6. 所有检查通过，执行选课
    UPDATE courses 
    SET students = JSON_ARRAY_APPEND(IFNULL(students, JSON_ARRAY()), '$', p_studentId) 
    WHERE id = p_courseId;
    
    -- 检查是否成功更新
    SELECT ROW_COUNT() INTO v_success;
    
    IF v_success THEN
        SELECT JSON_OBJECT(
            'success', TRUE,
            'message', CONCAT('成功选择课程《', v_courseName, '》'),
            'data', JSON_OBJECT(
                'courseId', p_courseId,
                'courseName', v_courseName,
                'studentId', p_studentId,
                'currentStudents', v_currentStudents + 1,
                'maxStudents', v_maxStudents
            ),
            'code', 'SUCCESS'
        ) AS result;
    ELSE
        SELECT JSON_OBJECT(
            'success', FALSE,
            'error', '选课失败，请稍后重试',
            'code', 'UPDATE_FAILED'
        ) AS result;
    END IF;
END //

-- 2. 改进的退课存储过程
CREATE PROCEDURE `dropCourse`(IN p_courseId INT, IN p_studentId INT)
BEGIN
    DECLARE v_courseExists INT DEFAULT 0;
    DECLARE v_courseName VARCHAR(100);
    DECLARE v_studentInCourse INT DEFAULT 0;
    DECLARE v_success BOOLEAN DEFAULT FALSE;
    DECLARE v_students_count INT;
    
    -- 1. 检查课程是否存在
    SELECT COUNT(*) INTO v_courseExists FROM courses WHERE id = p_courseId;
    
    IF v_courseExists = 0 THEN
        SELECT JSON_OBJECT(
            'success', FALSE,
            'error', '课程不存在',
            'code', 'COURSE_NOT_FOUND'
        ) AS result;
        LEAVE dropCourse;
    END IF;
    
    -- 2. 获取课程信息
    SELECT name 
    INTO v_courseName
    FROM courses 
    WHERE id = p_courseId;
    
    -- 3. 检查学生是否在课程中
    SELECT COUNT(*) 
    INTO v_studentInCourse
    FROM courses c 
    WHERE c.id = p_courseId 
    AND JSON_CONTAINS(c.students, CAST(p_studentId AS JSON));
    
    IF v_studentInCourse = 0 THEN
        SELECT JSON_OBJECT(
            'success', FALSE,
            'error', CONCAT('您未选择课程《', v_courseName, '》'),
            'code', 'NOT_ENROLLED'
        ) AS result;
        LEAVE dropCourse;
    END IF;
    
    -- 4. 执行退课
    UPDATE courses 
    SET students = JSON_REMOVE(students, JSON_UNQUOTE(JSON_SEARCH(students, 'one', p_studentId))) 
    WHERE id = p_courseId;
    
    -- 检查是否成功更新
    SELECT ROW_COUNT() INTO v_success;
    
    -- 获取更新后的学生数量
    SELECT JSON_LENGTH(IFNULL(students, JSON_ARRAY())) 
    INTO v_students_count
    FROM courses 
    WHERE id = p_courseId;
    
    IF v_success THEN
        SELECT JSON_OBJECT(
            'success', TRUE,
            'message', CONCAT('成功退选课程《', v_courseName, '》'),
            'data', JSON_OBJECT(
                'courseId', p_courseId,
                'courseName', v_courseName,
                'studentId', p_studentId,
                'currentStudents', v_students_count
            ),
            'code', 'SUCCESS'
        ) AS result;
    ELSE
        SELECT JSON_OBJECT(
            'success', FALSE,
            'error', '退课失败，请稍后重试',
            'code', 'UPDATE_FAILED'
        ) AS result;
    END IF;
END //

-- 3. 获取课程信息辅助存储过程
CREATE PROCEDURE `getCourseInfo`(IN p_courseId INT)
BEGIN
    SELECT 
        c.id,
        c.name,
        c.credit,
        c.time,
        c.description,
        c.maxStudents,
        c.teacherId,
        IFNULL(c.students, JSON_ARRAY()) as students,
        JSON_LENGTH(IFNULL(c.students, JSON_ARRAY())) as studentCount,
        u.name as teacherName
    FROM courses c
    LEFT JOIN users u ON c.teacherId = u.id
    WHERE c.id = p_courseId;
END //

DELIMITER ;

-- ==========================================
-- 时间冲突检测函数（保持不变，因为已经很好）
-- ==========================================

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

-- ==========================================
-- 验证创建
-- ==========================================

SELECT '存储过程和函数创建完成' AS status;

SELECT 
    ROUTINE_NAME,
    ROUTINE_TYPE,
    CREATED
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_SCHEMA = 'course selection' 
AND ROUTINE_NAME IN ('selectCourse', 'dropCourse', 'getCourseInfo', 'hasTimeConflict')
ORDER BY ROUTINE_TYPE, ROUTINE_NAME;
