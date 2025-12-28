-- 乱码问题修复：退课功能完全解决方案
-- 解决"鎮ㄦ湭閫夋嫨姝よ?绋?"乱码和JSON匹配问题

-- 先删除旧的存储过程
DROP PROCEDURE IF EXISTS dropCourse;

-- 创建新的退课存储过程 - 使用多层匹配策略
DELIMITER //
CREATE PROCEDURE dropCourse(
    IN p_course_id INT,
    IN p_student_id VARCHAR(20)
)
BEGIN
    DECLARE v_course_exists INT DEFAULT 0;
    DECLARE v_student_in_course INT DEFAULT 0;
    DECLARE v_students_json JSON;
    DECLARE v_students_text TEXT;
    DECLARE v_updated_students JSON;
    DECLARE v_result JSON DEFAULT JSON_OBJECT('success', false, 'message', '');
    DECLARE v_error_msg VARCHAR(500) DEFAULT '退课失败';
    
    -- 记录调试信息
    SELECT CONCAT('开始退课: 课程ID=', p_course_id, ', 学生ID=', p_student_id) as debug_info;
    
    -- 第一步：检查课程是否存在
    SELECT COUNT(*) INTO v_course_exists 
    FROM courses 
    WHERE id = p_course_id;
    
    IF v_course_exists = 0 THEN
        SET v_error_msg = '课程不存在';
        SELECT JSON_OBJECT(
            'success', false,
            'error', v_error_msg,
            'courseId', p_course_id,
            'studentId', p_student_id
        ) as result;
    ELSE
        -- 第二步：获取当前学生列表
        SELECT COALESCE(students, '[]') INTO v_students_text 
        FROM courses 
        WHERE id = p_course_id;
        
        -- 确保JSON格式正确
        IF v_students_text IS NULL OR v_students_text = '' THEN
            SET v_students_text = '[]';
        END IF;
        
        -- 尝试解析为JSON
        BEGIN
            DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
            SET v_students_json = CAST(v_students_text AS JSON);
        END;
        
        -- 第三步：使用多种方法检查学生是否在课程中
        
        -- 方法1：直接字符串包含检查
        IF LOCATE(CONCAT('"', p_student_id, '"'), v_students_text) > 0 THEN
            SET v_student_in_course = 1;
        END IF;
        
        -- 方法2：JSON_CONTAINS检查（如果v_students_json有效）
        IF v_student_in_course = 0 AND v_students_json IS NOT NULL THEN
            BEGIN
                DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
                IF JSON_CONTAINS(v_students_json, CAST(p_student_id AS JSON)) THEN
                    SET v_student_in_course = 1;
                END IF;
            END;
        END IF;
        
        -- 方法3：JSON_SEARCH检查
        IF v_student_in_course = 0 AND v_students_json IS NOT NULL THEN
            BEGIN
                DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
                IF JSON_SEARCH(v_students_json, 'one', p_student_id) IS NOT NULL THEN
                    SET v_student_in_course = 1;
                END IF;
            END;
        END IF;
        
        -- 输出调试信息
        SELECT CONCAT('学生是否存在: ', v_student_in_course) as debug_info;
        SELECT CONCAT('学生列表JSON: ', v_students_text) as debug_info;
        
        IF v_student_in_course = 0 THEN
            -- 学生不在课程中
            SET v_error_msg = '您未选择此课程';
            SELECT JSON_OBJECT(
                'success', false,
                'error', v_error_msg,
                'courseId', p_course_id,
                'studentId', p_student_id
            ) as result;
        ELSE
            -- 第四步：执行退课操作
            
            -- 方法1：字符串替换移除学生
            SET v_students_text = REPLACE(v_students_text, CONCAT('"', p_student_id, '"'), '');
            SET v_students_text = REPLACE(v_students_text, ',,', ',');
            SET v_students_text = REPLACE(v_students_text, '[,', '[');
            SET v_students_text = REPLACE(v_students_text, ',]', ']');
            
            -- 清理后确保是有效的JSON数组
            IF v_students_text = '' THEN
                SET v_students_text = '[]';
            END IF;
            
            -- 方法2：如果JSON有效，使用JSON_REMOVE
            IF v_students_json IS NOT NULL THEN
                BEGIN
                    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
                    SET v_updated_students = JSON_REMOVE(v_students_json, CONCAT('$[', JSON_UNQUOTE(JSON_SEARCH(v_students_json, 'one', p_student_id)), ']'));
                    SET v_students_text = JSON_UNQUOTE(v_updated_students);
                END;
            END IF;
            
            -- 最终清理：确保格式正确
            SET v_students_text = REPLACE(v_students_text, ',,', ',');
            SET v_students_text = REPLACE(v_students_text, '[,', '[');
            SET v_students_text = REPLACE(v_students_text, ',]', ']');
            
            -- 确保是有效的JSON
            IF v_students_text IS NULL OR v_students_text = '' OR v_students_text = '[' THEN
                SET v_students_text = '[]';
            END IF;
            
            -- 第五步：更新课程
            UPDATE courses 
            SET students = v_students_text
            WHERE id = p_course_id;
            
            -- 检查更新是否成功
            IF ROW_COUNT() > 0 THEN
                SELECT JSON_OBJECT(
                    'success', true,
                    'message', '退课成功',
                    'courseId', p_course_id,
                    'studentId', p_student_id
                ) as result;
            ELSE
                SET v_error_msg = '退课失败：数据库更新失败';
                SELECT JSON_OBJECT(
                    'success', false,
                    'error', v_error_msg,
                    'courseId', p_course_id,
                    'studentId', p_student_id
                ) as result;
            END IF;
        END IF;
    END IF;
END //
DELIMITER ;

-- 添加学生到课程的存储过程（确保一致性）
DROP PROCEDURE IF EXISTS selectCourse;

DELIMITER //
CREATE PROCEDURE selectCourse(
    IN p_course_id INT,
    IN p_student_id VARCHAR(20)
)
BEGIN
    DECLARE v_course_exists INT DEFAULT 0;
    DECLARE v_max_students INT DEFAULT 0;
    DECLARE v_current_students INT DEFAULT 0;
    DECLARE v_student_already_in INT DEFAULT 0;
    DECLARE v_students_text TEXT;
    DECLARE v_updated_text TEXT;
    DECLARE v_conflict_count INT DEFAULT 0;
    
    -- 检查课程是否存在
    SELECT COUNT(*) INTO v_course_exists FROM courses WHERE id = p_course_id;
    
    IF v_course_exists = 0 THEN
        SELECT JSON_OBJECT('success', false, 'error', '课程不存在') as result;
    ELSE
        -- 获取课程信息
        SELECT maxStudents, COALESCE(students, '[]') INTO v_max_students, v_students_text
        FROM courses WHERE id = p_course_id;
        
        -- 确保JSON格式正确
        IF v_students_text IS NULL OR v_students_text = '' THEN
            SET v_students_text = '[]';
        END IF;
        
        -- 计算当前学生数量
        SET v_current_students = (JSON_LENGTH(v_students_text));
        
        -- 检查学生是否已在课程中
        IF LOCATE(CONCAT('"', p_student_id, '"'), v_students_text) > 0 THEN
            SET v_student_already_in = 1;
        END IF;
        
        -- 检查课程是否已满
        IF v_current_students >= v_max_students THEN
            SELECT JSON_OBJECT('success', false, 'error', '课程已满') as result;
        ELSE IF v_student_already_in = 1 THEN
            SELECT JSON_OBJECT('success', false, 'error', '您已选择此课程') as result;
        ELSE
            -- 添加学生到JSON数组
            IF v_students_text = '[]' THEN
                SET v_updated_text = CONCAT('["', p_student_id, '"]');
            ELSE
                SET v_updated_text = CONCAT(SUBSTRING(v_students_text, 1, LENGTH(v_students_text) - 1), ',"', p_student_id, '"]');
            END IF;
            
            -- 更新课程
            UPDATE courses SET students = v_updated_text WHERE id = p_course_id;
            
            IF ROW_COUNT() > 0 THEN
                SELECT JSON_OBJECT('success', true, 'message', '选课成功') as result;
            ELSE
                SELECT JSON_OBJECT('success', false, 'error', '选课失败') as result;
            END IF;
        END IF;
    END IF;
END //
DELIMITER ;

-- 测试退课功能的查询
SELECT '退课存储过程已创建，现在测试功能...' as status;

-- 检查课程19的当前状态
SELECT id, name, students FROM courses WHERE id = 19;

-- 测试退课（学生202501从课程19退课）
-- CALL dropCourse(19, '202501');

-- 检查课程19退课后的状态
-- SELECT id, name, students FROM courses WHERE id = 19;