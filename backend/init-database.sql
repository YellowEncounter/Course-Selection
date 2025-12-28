-- 选课系统数据库初始化脚本

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `course selection` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `course selection`;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(50) NOT NULL,
    role ENUM('admin', 'teacher', 'student') NOT NULL
);

-- 创建课程表
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    credit INT NOT NULL,
    time VARCHAR(50) NOT NULL,
    description TEXT,
    maxStudents INT NOT NULL DEFAULT 30,
    teacherId INT NOT NULL,
    students JSON,
    FOREIGN KEY (teacherId) REFERENCES users(id) ON DELETE CASCADE
);

-- 插入初始数据
INSERT INTO users (id, name, password, role) VALUES 
(1, '系统管理员', 'admin123', 'admin'),
(11, '张老师', 'teacher123', 'teacher'),
(202301, '黄同学', 'student123', 'student'),
(202302, '李同学', 'student123', 'student')
ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password), role = VALUES(role);

-- 用户管理存储过程
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS `addUser-1`(IN id INT, IN name VARCHAR(100), IN password VARCHAR(50))
BEGIN
    INSERT INTO users (id, name, password, role) VALUES (id, name, password, 'admin');
END //

CREATE PROCEDURE IF NOT EXISTS `addUser-2`(IN id INT, IN name VARCHAR(100), IN password VARCHAR(50))
BEGIN
    INSERT INTO users (id, name, password, role) VALUES (id, name, password, 'teacher');
END //

CREATE PROCEDURE IF NOT EXISTS `addUser-3`(IN id INT, IN name VARCHAR(100), IN password VARCHAR(50))
BEGIN
    INSERT INTO users (id, name, password, role) VALUES (id, name, password, 'student');
END //

CREATE PROCEDURE IF NOT EXISTS `getUser-1`()
BEGIN
    SELECT * FROM users WHERE role = 'admin';
END //

CREATE PROCEDURE IF NOT EXISTS `getUser-2`()
BEGIN
    SELECT * FROM users WHERE role = 'teacher';
END //

CREATE PROCEDURE IF NOT EXISTS `getUser-3`()
BEGIN
    SELECT * FROM users WHERE role = 'student';
END //

CREATE PROCEDURE IF NOT EXISTS `deleteUser-1`(IN id INT)
BEGIN
    DELETE FROM users WHERE id = id AND role = 'admin';
END //

CREATE PROCEDURE IF NOT EXISTS `deleteUser-2`(IN id INT)
BEGIN
    DELETE FROM users WHERE id = id AND role = 'teacher';
END //

CREATE PROCEDURE IF NOT EXISTS `deleteUser-3`(IN id INT)
BEGIN
    DELETE FROM users WHERE id = id AND role = 'student';
END //

CREATE PROCEDURE IF NOT EXISTS `updateUser-1`(IN id INT, IN name VARCHAR(100), IN password VARCHAR(50))
BEGIN
    UPDATE users u SET u.name = name, u.password = password WHERE u.id = id AND u.role = 'admin';
END //

CREATE PROCEDURE IF NOT EXISTS `updateUser-2`(IN id INT, IN name VARCHAR(100), IN password VARCHAR(50))
BEGIN
    UPDATE users u SET u.name = name, u.password = password WHERE u.id = id AND u.role = 'teacher';
END //

CREATE PROCEDURE IF NOT EXISTS `updateUser-3`(IN id INT, IN name VARCHAR(100), IN password VARCHAR(50))
BEGIN
    UPDATE users u SET u.name = name, u.password = password WHERE u.id = id AND u.role = 'student';
END //

-- 课程管理存储过程
CREATE PROCEDURE IF NOT EXISTS `getAllCourses`()
BEGIN
    SELECT c.*, u.name as teacherName FROM courses c 
    LEFT JOIN users u ON c.teacherId = u.id;
END //

CREATE PROCEDURE IF NOT EXISTS `getTeacherCourses`(IN teacherId INT)
BEGIN
    SELECT * FROM courses WHERE teacherId = teacherId;
END //

CREATE PROCEDURE IF NOT EXISTS `addCourse`(IN name VARCHAR(100), IN credit INT, IN time VARCHAR(50), IN desc TEXT, IN maxStudents INT, IN teacherId INT)
BEGIN
    INSERT INTO courses (name, credit, time, description, maxStudents, teacherId, students) 
    VALUES (name, credit, time, desc, maxStudents, teacherId, JSON_ARRAY());
END //

CREATE PROCEDURE IF NOT EXISTS `updateCourse`(IN id INT, IN name VARCHAR(100), IN credit INT, IN time VARCHAR(50), IN desc TEXT, IN maxStudents INT)
BEGIN
    UPDATE courses SET name = name, credit = credit, time = time, description = desc, maxStudents = maxStudents WHERE id = id;
END //

CREATE PROCEDURE IF NOT EXISTS `deleteCourse`(IN id INT)
BEGIN
    DELETE FROM courses WHERE id = id;
END //

CREATE PROCEDURE IF NOT EXISTS `selectCourse`(IN courseId INT, IN studentId INT)
BEGIN
    UPDATE courses SET students = JSON_ARRAY_APPEND(students, '$', studentId) WHERE id = courseId;
END //

CREATE PROCEDURE IF NOT EXISTS `dropCourse`(IN courseId INT, IN studentId INT)
BEGIN
    UPDATE courses SET students = JSON_REMOVE(students, JSON_UNQUOTE(JSON_SEARCH(students, 'one', studentId))) WHERE id = courseId;
END //

CREATE PROCEDURE IF NOT EXISTS `getCourseStudents`(IN courseId INT)
BEGIN
    SELECT u.* FROM users u 
    JOIN courses c ON JSON_CONTAINS(c.students, CAST(u.id AS JSON))
    WHERE c.id = courseId AND u.role = 'student';
END //

DELIMITER ;

-- 插入示例课程
INSERT INTO courses (name, credit, time, description, maxStudents, teacherId) VALUES 
('高等数学', 5, '周一第1-2节', '高等数学基础课程', 50, 11),
('大学英语', 4, '周三第3-4节', '大学英语进阶', 40, 11);