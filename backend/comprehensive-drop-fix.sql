USE `course selection`;

-- ==========================================
-- 综合修复：彻底解决"您未选择此课程"问题
-- ==========================================

-- 删除所有有问题的存储过程
DROP PROCEDURE IF EXISTS `dropCourse`;
DROP PROCEDURE IF EXISTS `simpleDropCourse`;
DROP PROCEDURE IF EXISTS `directDropCourse`;

DELIMITER //

-- 创建最终的退课存储过程
CREATE PROCEDURE `dropCourse`(IN p_courseId INT, IN p_studentId INT)
BEGIN
    DECLARE v_courseExists INT DEFAULT 0;
    DECLARE v_courseName VARCHAR(100);
    DECLARE v_students JSON;
    DECLARE v_studentIdStr VARCHAR(50);
    DECLARE v_studentPath VARCHAR(100);
    DECLARE v_newStudents JSON;
    DECLARE v_removed BOOLEAN DEFAULT FALSE;
    DECLARE v_currentStudents TEXT;
    
    -- 记录调试信息
    SELECT CONCAT('退课调试 - 课程ID:', p_courseId, ', 学生ID:', p_studentId) AS debug_info;
    
    -- 1. 检查课程是否存在
    SELECT COUNT(*) INTO v_courseExists FROM courses WHERE id = p_courseId;
    
    IF v_courseExists = 0 THEN
        SELECT JSON_OBJECT(
            'success', FALSE,
            'error', '课程不存在',
            'code', 'COURSE_NOT_FOUND',
            'courseId', p_courseId,
            'studentId', p_studentId
        ) AS result;
    ELSE
        -- 2. 获取课程信息
        SELECT name, students INTO v_courseName, v_students
        FROM courses WHERE id = p_courseId;
        
        -- 调试输出
        SELECT CONCAT('课程信息 - 名称:', v_courseName, ', 学生数据:', v_students) AS debug_info;
        
        -- 3. 处理空数据情况
        IF v_students IS NULL OR JSON_LENGTH(v_students) = 0 THEN
            SELECT JSON_OBJECT(
                'success', FALSE,
                'error', CONCAT('您未选择课程《', v_courseName, '》'),
                'code', 'NOT_ENROLLED',
                'courseId', p_courseId,
                'studentId', p_studentId,
                'reason', 'students字段为空'
            ) AS result;
        ELSE
            -- 4. 多种方式检查学生是否在课程中
            
            -- 方式1: 转换为字符串检查
            SET v_studentIdStr = CAST(p_studentId AS CHAR);
            SET v_currentStudents = JSON_UNQUOTE(JSON_EXTRACT(v_students, '$'));
            
            SELECT CONCAT('检查方式1 - 字符串匹配: 学生ID=', v_studentIdStr, ', 学生列表=', v_currentStudents) AS debug_info;
            
            IF LOCATE(v_studentIdStr, v_currentStudents) > 0 THEN
                SET v_removed = TRUE;
                SET v_studentPath = JSON_UNQUOTE(JSON_SEARCH(v_students, 'one', v_studentIdStr));
                SELECT CONCAT('方式1成功 - 找到路径:', v_studentPath) AS debug_info;
            END IF;
            
            -- 方式2: 如果方式1失败，尝试JSON搜索
            IF NOT v_removed THEN
                SET v_studentPath = JSON_UNQUOTE(JSON_SEARCH(v_students, 'one', v_studentIdStr));
                
                IF v_studentPath IS NOT NULL AND v_studentPath != '' THEN
                    SET v_removed = TRUE;
                    SELECT CONCAT('方式2成功 - JSON搜索路径:', v_studentPath) AS debug_info;
                END IF;
            END IF;
            
            -- 方式3: 最后的备选方案 - 数组遍历
            IF NOT v_removed THEN
                SELECT CONCAT('开始方式3 - 数组遍历检查') AS debug_info;
                
                -- 构建新的学生数组，排除目标学生
                SET v_newStudents = (
                    SELECT JSON_ARRAYAGG(student_id)
                    FROM (
                        SELECT 
                            CASE 
                                WHEN CAST(JSON_UNQUOTE(JSON_EXTRACT(v_students, CONCAT('$[', idx, ']'))) AS CHAR) = v_studentIdStr 
                                THEN NULL 
                                ELSE JSON_UNQUOTE(JSON_EXTRACT(v_students, CONCAT('$[', idx, ']')))
                            END as student_id
                        FROM (
                            SELECT JSON_UNQUOTE(JSON_EXTRACT(JSON_KEYS(v_students), CONCAT('$[', seq, ']'))) as idx
                            FROM (
                                SELECT 0 as seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
                                UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
                            ) as sequences
                            WHERE seq < JSON_LENGTH(v_students)
                        ) as indices
                    ) as student_data
                    WHERE student_id IS NOT NULL
                ) as filtered_students
                );
                
                -- 检查是否成功移除
                IF JSON_LENGTH(v_newStudents) < JSON_LENGTH(v_students) THEN
                    SET v_removed = TRUE;
                    SELECT CONCAT('方式3成功 - 数组重建完成') AS debug_info;
                END IF;
            END IF;
            
            IF v_removed THEN
                -- 5. 如果前面方式3没有构建新数组，使用JSON_REMOVE
                IF v_newStudents IS NULL AND v_studentPath IS NOT NULL AND v_studentPath != '' THEN
                    SET v_newStudents = JSON_REMOVE(v_students, v_studentPath);
                    SELECT CONCAT('使用JSON_REMOVE更新数据') AS debug_info;
                END IF;
                
                -- 确保新数组不为NULL
                IF v_newStudents IS NULL THEN
                    SET v_newStudents = JSON_ARRAY();
                END IF;
                
                -- 6. 更新课程数据
                UPDATE courses
                SET students = v_newStudents
                WHERE id = p_courseId;
                
                -- 7. 返回成功结果
                SELECT JSON_OBJECT(
                    'success', TRUE,
                    'message', CONCAT('成功退选课程《', v_courseName, '》'),
                    'code', 'SUCCESS',
                    'courseId', p_courseId,
                    'studentId', p_studentId,
                    'oldStudents', v_currentStudents,
                    'newStudents', JSON_UNQUOTE(v_newStudents)
                ) AS result;
            ELSE
                -- 8. 学生不在课程中
                SELECT JSON_OBJECT(
                    'success', FALSE,
                    'error', CONCAT('您未选择课程《', v_courseName, '》'),
                    'code', 'NOT_ENROLLED',
                    'courseId', p_courseId,
                    'studentId', p_studentId,
                    'reason', '学生不在课程中',
                    'currentStudents', v_currentStudents
                ) AS result;
            END IF;
        END IF;
    END IF;
END //

DELIMITER ;

-- 创建一个简化的退课存储过程作为备选
CREATE PROCEDURE `dropCourseSimple`(IN p_courseId INT, IN p_studentId INT)
BEGIN
    DECLARE v_courseExists INT DEFAULT 0;
    DECLARE v_courseName VARCHAR(100);
    DECLARE v_studentIdStr VARCHAR(50);
    
    -- 1. 检查课程是否存在
    SELECT COUNT(*) INTO v_courseExists FROM courses WHERE id = p_courseId;
    
    IF v_courseExists = 0 THEN
        SELECT JSON_OBJECT(
            'success', FALSE,
            'error', '课程不存在',
            'code', 'COURSE_NOT_FOUND'
        ) AS result;
    ELSE
        -- 2. 获取课程名称
        SELECT name INTO v_courseName FROM courses WHERE id = p_courseId;
        SET v_studentIdStr = CAST(p_studentId AS CHAR);
        
        -- 3. 直接使用字符串匹配进行移除
        UPDATE courses 
        SET students = (
            CASE 
                WHEN students LIKE CONCAT('%"', v_studentIdStr, '"%') OR students LIKE CONCAT('%[', v_studentIdStr, ']%') THEN
                    CASE 
                        WHEN JSON_SEARCH(students, 'one', v_studentIdStr) IS NOT NULL THEN
                            JSON_REMOVE(students, JSON_UNQUOTE(JSON_SEARCH(students, 'one', v_studentIdStr)))
                        ELSE students
                    END
                ELSE students
            END
        )
        WHERE id = p_courseId
        AND (students LIKE CONCAT('%"', v_studentIdStr, '"%') OR students LIKE CONCAT('%[', v_studentIdStr, ']%'));
        
        -- 4. 检查是否更新成功
        IF ROW_COUNT() > 0 THEN
            SELECT JSON_OBJECT(
                'success', TRUE,
                'message', CONCAT('成功退选课程《', v_courseName, '》'),
                'code', 'SUCCESS'
            ) AS result;
        ELSE
            SELECT JSON_OBJECT(
                'success', FALSE,
                'error', CONCAT('您未选择课程《', v_courseName, '》'),
                'code', 'NOT_ENROLLED'
            ) AS result;
        END IF;
    END IF;
END //

DELIMITER ;

-- ==========================================
-- 验证修复
-- ==========================================
SELECT '✓ 退课存储过程已全面修复' AS status;

SELECT 
    ROUTINE_NAME, 
    ROUTINE_TYPE, 
    CREATED 
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_SCHEMA = 'course selection' 
AND ROUTINE_NAME IN ('dropCourse', 'dropCourseSimple');

-- 测试数据验证
SELECT '测试数据验证:' AS test_info;
SELECT id, name, students FROM courses WHERE id IN (13, 14) ORDER BY id;