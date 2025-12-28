USE `course selection`;

-- ==========================================
-- 退课功能调试和修复脚本
-- ==========================================

-- 1. 查看当前courses表的数据结构
SELECT '=== 课程表数据检查 ===' AS info;
SELECT id, name, teacherId, students, JSON_LENGTH(IFNULL(students, JSON_ARRAY())) as student_count
FROM courses
ORDER BY id;

-- 2. 测试JSON搜索功能
SELECT '=== JSON搜索测试 ===' AS info;

-- 测试1：检查数字ID的搜索
SELECT '测试1: 数字ID 202501' AS test;
SELECT JSON_SEARCH('[202501,202502]', 'one', 202501) as search_result;

-- 测试2：检查字符串ID的搜索
SELECT '测试2: 字符串ID "202501"' AS test;
SELECT JSON_SEARCH('[202501,202502]', 'one', '202501') as search_result;

-- 测试3：检查当前courses表中的students字段
SELECT '测试3: 实际数据搜索' AS test;
SELECT id, name,
       students,
       JSON_SEARCH(students, 'one', 202501) as search_with_number,
       JSON_SEARCH(students, 'one', '202501') as search_with_string,
       JSON_CONTAINS(students, CAST(202501 AS JSON)) as contains_number,
       JSON_CONTAINS(students, CAST('202501' AS JSON)) as contains_string
FROM courses
WHERE JSON_LENGTH(IFNULL(students, JSON_ARRAY())) > 0
LIMIT 5;

-- ==========================================
-- 修复退课存储过程
-- ==========================================

DROP PROCEDURE IF EXISTS `dropCourse`;

DELIMITER //

CREATE PROCEDURE `dropCourse`(IN p_courseId INT, IN p_studentId INT)
BEGIN
    DECLARE v_courseExists INT DEFAULT 0;
    DECLARE v_courseName VARCHAR(100);
    DECLARE v_studentInCourse INT DEFAULT 0;
    DECLARE v_canDrop BOOLEAN DEFAULT TRUE;
    DECLARE v_students JSON;
    DECLARE v_studentIndex VARCHAR(50);

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

        -- 3. 调试：输出当前students数据
        SELECT JSON_OBJECT(
            'debug', TRUE,
            'courseId', p_courseId,
            'courseName', v_courseName,
            'studentId', p_studentId,
            'currentStudents', v_students
        ) AS debug_info;

        -- 4. 检查学生是否在课程中 - 尝试多种方式
        -- 方式1: JSON_SEARCH（推荐）
        SET v_studentIndex = JSON_SEARCH(v_students, 'one', CAST(p_studentId AS CHAR));
        
        IF v_studentIndex IS NOT NULL THEN
            SET v_studentInCourse = 1;
        ELSE
            -- 方式2: 尝试数字搜索
            SET v_studentIndex = JSON_SEARCH(v_students, 'one', p_studentId);
            IF v_studentIndex IS NOT NULL THEN
                SET v_studentInCourse = 1;
            END IF;
        END IF;
        
        -- 方式3: JSON_CONTAINS（作为备选）
        IF v_studentInCourse = 0 THEN
            SELECT JSON_CONTAINS(v_students, CAST(p_studentId AS JSON)) INTO v_studentInCourse;
        END IF;

        -- 5. 调试：输出检查结果
        SELECT JSON_OBJECT(
            'debug', TRUE,
            'studentId', p_studentId,
            'searchResult', v_studentIndex,
            'studentInCourse', v_studentInCourse
        ) AS check_result;

        IF v_studentInCourse = 0 THEN
            SELECT JSON_OBJECT(
                'success', FALSE,
                'error', CONCAT('您未选择课程《', v_courseName, '》'),
                'code', 'NOT_ENROLLED',
                'debug', JSON_OBJECT(
                    'courseId', p_courseId,
                    'studentId', p_studentId,
                    'currentStudents', v_students
                )
            ) AS result;
            SET v_canDrop = FALSE;
        END IF;
    END IF;

    IF v_canDrop THEN
        -- 6. 执行退课
        UPDATE courses
        SET students = JSON_REMOVE(v_students, JSON_UNQUOTE(v_studentIndex))
        WHERE id = p_courseId;

        -- 7. 验证退课结果
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
-- 验证存储过程
-- ==========================================
SELECT 'dropCourse 存储过程已修复' AS status;
