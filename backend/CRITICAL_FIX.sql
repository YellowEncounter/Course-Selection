USE `course selection`;

-- ==========================================
-- 关键修复脚本
-- 1. 创建 getCourseInfo 存储过程
-- 2. 创建 updateCourseStudents 存储过程
-- 3. 创建 getAllCourses 存储过程（带教师名称）
-- ==========================================

DROP PROCEDURE IF EXISTS `getCourseInfo`;
DROP PROCEDURE IF EXISTS `updateCourseStudents`;
DROP PROCEDURE IF EXISTS `getAllCourses`;

DELIMITER //

-- 1. 获取课程信息存储过程
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

-- 2. 更新课程学生列表存储过程
CREATE PROCEDURE `updateCourseStudents`(IN p_courseId INT, IN p_students JSON)
BEGIN
    UPDATE courses
    SET students = p_students
    WHERE id = p_courseId;

    SELECT
        'success' as result,
        JSON_LENGTH(IFNULL(p_students, JSON_ARRAY())) as studentCount;
END //

-- 3. 获取所有课程（带教师名称）
CREATE PROCEDURE `getAllCourses`()
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
    ORDER BY c.id;
END //

DELIMITER ;

-- ==========================================
-- 验证创建
-- ==========================================

SELECT '存储过程创建完成' AS status;

SELECT
    ROUTINE_NAME,
    ROUTINE_TYPE,
    CREATED
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_SCHEMA = 'course selection'
AND ROUTINE_NAME IN ('getCourseInfo', 'updateCourseStudents', 'getAllCourses', 'selectCourse', 'dropCourse')
ORDER BY ROUTINE_TYPE, ROUTINE_NAME;
