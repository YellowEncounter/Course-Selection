USE `course selection`;

-- ==========================================
-- 紧急修复：退课功能（直接SQL操作，避免存储过程问题）
-- ==========================================

-- 删除有问题的存储过程
DROP PROCEDURE IF EXISTS `dropCourse`;
DROP PROCEDURE IF EXISTS `simpleDropCourse`;

DELIMITER //

-- 创建最简单的退课存储过程
CREATE PROCEDURE `dropCourse`(IN p_courseId INT, IN p_studentId INT)
BEGIN
    DECLARE v_courseName VARCHAR(100);
    DECLARE v_students JSON;
    DECLARE v_newStudents JSON;
    DECLARE v_studentFound BOOLEAN DEFAULT FALSE;
    
    -- 1. 检查课程是否存在
    SELECT COUNT(*) INTO @courseExists FROM courses WHERE id = p_courseId;
    
    IF @courseExists = 0 THEN
        SELECT JSON_OBJECT(
            'success', FALSE,
            'error', '课程不存在',
            'code', 'COURSE_NOT_FOUND'
        ) AS result;
    ELSE
        -- 2. 获取课程信息
        SELECT name, students INTO v_courseName, v_students 
        FROM courses WHERE id = p_courseId;
        
        -- 3. 如果students为空，直接返回错误
        IF v_students IS NULL OR JSON_LENGTH(v_students) = 0 THEN
            SELECT JSON_OBJECT(
                'success', FALSE,
                'error', CONCAT('您未选择课程《', v_courseName, '》'),
                'code', 'NOT_ENROLLED'
            ) AS result;
        ELSE
            -- 4. 使用最简单的JSON操作：先转换为字符串，再手动处理
            SET @studentsStr = JSON_UNQUOTE(v_students);
            SET @studentIdStr = CAST(p_studentId AS CHAR);
            
            -- 5. 检查学生是否在数组中（字符串匹配）
            IF LOCATE(@studentIdStr, @studentsStr) > 0 THEN
                SET v_studentFound = TRUE;
                
                -- 6. 手动构建新数组（移除该学生）
                SET @newStudentsStr = REPLACE(
                    REPLACE(
                        REPLACE(@studentsStr, CONCAT(',"', @studentIdStr, '"'), ''),
                        CONCAT('"', @studentIdStr, '",'), ''
                    ),
                    CONCAT('"', @studentIdStr, '"'), ''
                );
                
                -- 7. 如果移除后为空，设置为空数组
                IF TRIM(@newStudentsStr) = '' OR @newStudentsStr = '[]' THEN
                    SET v_newStudents = JSON_ARRAY();
                ELSE
                    -- 确保是有效的JSON数组
                    IF LEFT(@newStudentsStr, 1) != '[' THEN
                        SET @newStudentsStr = CONCAT('[', @newStudentsStr);
                    END IF;
                    IF RIGHT(@newStudentsStr, 1) != ']' THEN
                        SET @newStudentsStr = CONCAT(@newStudentsStr, ']');
                    END IF;
                    SET v_newStudents = CAST(@newStudentsStr AS JSON);
                END IF;
            
                -- 8. 更新课程
                UPDATE courses
                SET students = v_newStudents
                WHERE id = p_courseId;
                
                -- 9. 返回成功结果
                SELECT JSON_OBJECT(
                    'success', TRUE,
                    'message', CONCAT('成功退选课程《', v_courseName, '》'),
                    'code', 'SUCCESS',
                    'courseId', p_courseId,
                    'studentId', p_studentId
                ) AS result;
            ELSE
                -- 学生不在课程中
                SELECT JSON_OBJECT(
                    'success', FALSE,
                    'error', CONCAT('您未选择课程《', v_courseName, '》'),
                    'code', 'NOT_ENROLLED',
                    'courseId', p_courseId,
                    'studentId', p_studentId
                ) AS result;
            END IF;
        END IF;
    END IF;
END //

DELIMITER ;

-- ==========================================
-- 创建备用的直接SQL退课函数（更可靠）
-- ==========================================

DELIMITER //

CREATE PROCEDURE `directDropCourse`(IN p_courseId INT, IN p_studentId INT)
BEGIN
    DECLARE v_courseName VARCHAR(100);
    DECLARE v_affectedRows INT;
    
    -- 直接使用JSON_REMOVE函数，避免复杂的逻辑
    UPDATE courses 
    SET students = JSON_REMOVE(
        students, 
        JSON_UNQUOTE(JSON_SEARCH(students, 'one', CAST(p_studentId AS CHAR)))
    )
    WHERE id = p_courseId 
    AND JSON_SEARCH(students, 'one', CAST(p_studentId AS CHAR)) IS NOT NULL;
    
    -- 获取受影响的行数
    SET v_affectedRows = ROW_COUNT();
    
    -- 获取课程名称
    SELECT name INTO v_courseName FROM courses WHERE id = p_courseId;
    
    IF v_affectedRows > 0 THEN
        SELECT JSON_OBJECT(
            'success', TRUE,
            'message', CONCAT('成功退选课程《', v_courseName, '》'),
            'courseId', p_courseId,
            'studentId', p_studentId
        ) AS result;
    ELSE
        -- 检查是课程不存在还是学生不在课程中
        IF NOT EXISTS (SELECT 1 FROM courses WHERE id = p_courseId) THEN
            SELECT JSON_OBJECT(
                'success', FALSE,
                'error', '课程不存在',
                'code', 'COURSE_NOT_FOUND'
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
SELECT '✓ 退课存储过程已紧急修复' AS status;

SELECT 
    ROUTINE_NAME, 
    ROUTINE_TYPE, 
    CREATED 
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_SCHEMA = 'course selection' 
AND ROUTINE_NAME IN ('dropCourse', 'directDropCourse');