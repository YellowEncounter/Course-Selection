USE `course selection`;

-- ==========================================
-- 快速修复：退课存储过程（兼容多种数据类型）
-- ==========================================

DROP PROCEDURE IF EXISTS `dropCourse`;

DELIMITER //

CREATE PROCEDURE `dropCourse`(IN p_courseId INT, IN p_studentId INT)
BEGIN
    DECLARE v_courseExists INT DEFAULT 0;
    DECLARE v_courseName VARCHAR(100);
    DECLARE v_canDrop BOOLEAN DEFAULT TRUE;
    DECLARE v_students JSON;
    DECLARE v_newStudents JSON;
    DECLARE v_studentIdStr VARCHAR(50);

    -- 转换为字符串用于搜索
    SET v_studentIdStr = CAST(p_studentId AS CHAR);

    -- 1. 检查课程是否存在
    SELECT COUNT(*) INTO v_courseExists FROM courses WHERE id = p_courseId;

    IF v_courseExists = 0 THEN
        SELECT JSON_OBJECT(
            'success', FALSE,
            'error', '课程不存在',
            'code', 'COURSE_NOT_FOUND'
        ) AS result;
        SET v_canDrop = FALSE;
    END IF;

    IF v_canDrop THEN
        -- 2. 获取课程信息
        SELECT name, IFNULL(students, JSON_ARRAY())
        INTO v_courseName, v_students
        FROM courses
        WHERE id = p_courseId;

        -- 3. 检查学生是否在课程中（使用JSON_CONTAINS，更可靠）
        IF NOT JSON_CONTAINS(v_students, CAST(p_studentId AS JSON)) THEN
            -- 如果数字类型搜索失败，尝试字符串类型
            IF NOT JSON_CONTAINS(v_students, CAST(v_studentIdStr AS JSON)) THEN
                SELECT JSON_OBJECT(
                    'success', FALSE,
                    'error', CONCAT('您未选择课程《', v_courseName, '》'),
                    'code', 'NOT_ENROLLED'
                ) AS result;
                SET v_canDrop = FALSE;
            END IF;
        END IF;
    END IF;

    IF v_canDrop THEN
        -- 4. 执行退课（尝试多种方式）
        -- 方式1: 尝试移除数字ID
        SET v_newStudents = JSON_REMOVE(v_students, JSON_UNQUOTE(JSON_SEARCH(v_students, 'one', p_studentId)));
        
        -- 方式2: 如果方式1没有找到，尝试字符串ID
        IF JSON_LENGTH(v_newStudents) = JSON_LENGTH(v_students) THEN
            SET v_newStudents = JSON_REMOVE(v_students, JSON_UNQUOTE(JSON_SEARCH(v_students, 'one', v_studentIdStr)));
        END IF;
        
        -- 方式3: 如果以上都失败，使用JSON数组重建
        IF JSON_LENGTH(v_newStudents) = JSON_LENGTH(v_students) THEN
            -- 手动构建新的学生数组
            SET v_newStudents = (
                SELECT JSON_ARRAYAGG(id)
                FROM JSON_TABLE(v_students, '$[*]' COLUMNS(id VARCHAR(50) PATH '$')) AS jt
                WHERE jt.id != v_studentIdStr AND jt.id != CAST(p_studentId AS CHAR)
            );
        END IF;

        -- 5. 更新课程
        UPDATE courses
        SET students = v_newStudents
        WHERE id = p_courseId;

        -- 6. 返回成功结果
        SELECT JSON_OBJECT(
            'success', TRUE,
            'message', CONCAT('成功退选课程《', v_courseName, '》'),
            'code', 'SUCCESS',
            'removedStudentId', p_studentId
        ) AS result;
    END IF;
END //

DELIMITER ;

-- ==========================================
-- 验证修复
-- ==========================================
SELECT '✓ 退课存储过程已修复（兼容多种数据类型）' AS status;

SELECT 
    ROUTINE_NAME, 
    ROUTINE_TYPE, 
    CREATED 
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_SCHEMA = 'course selection' 
AND ROUTINE_NAME = 'dropCourse';
