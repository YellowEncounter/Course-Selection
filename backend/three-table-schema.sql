-- 选课系统三表分离架构SQL脚本
CREATE DATABASE IF NOT EXISTS `course selection` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `course selection`;

-- 备份现有数据（如果需要）
CREATE TABLE users_backup AS SELECT * FROM users;

-- 删除旧表（如果存在新的三表结构）
DROP TABLE IF EXISTS course_selections;
DROP TABLE IF EXISTS admin_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS admins;

-- 1. 管理员表
CREATE TABLE admins (
    id INT PRIMARY KEY COMMENT '管理员ID',
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码',
    name VARCHAR(100) NOT NULL COMMENT '姓名',
    email VARCHAR(100) COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '电话',
    department VARCHAR(100) COMMENT '所属部门',
    level ENUM('super', 'normal') DEFAULT 'normal' COMMENT '管理员级别',
    permissions JSON COMMENT '权限配置',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    last_login DATETIME COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_status (status),
    INDEX idx_level (level)
) COMMENT '管理员表';

-- 2. 教师表
CREATE TABLE teachers (
    id INT PRIMARY KEY COMMENT '教师ID',
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码',
    name VARCHAR(100) NOT NULL COMMENT '姓名',
    email VARCHAR(100) COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '电话',
    gender ENUM('male', 'female', 'other') COMMENT '性别',
    birth_date DATE COMMENT '出生日期',
    title VARCHAR(50) COMMENT '职称：教授、副教授、讲师等',
    employment_type ENUM('full_time', 'part_time', 'intern', 'visiting') DEFAULT 'full_time' COMMENT '雇佣类型',
    department VARCHAR(100) NOT NULL COMMENT '所属院系',
    office VARCHAR(100) COMMENT '办公室',
    specialization VARCHAR(200) COMMENT '专业领域',
    education VARCHAR(100) COMMENT '学历',
    max_courses INT DEFAULT 5 COMMENT '最大授课数量',
    status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active' COMMENT '状态',
    hire_date DATE COMMENT '入职日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_department (department),
    INDEX idx_status (status),
    INDEX idx_employment_type (employment_type),
    INDEX idx_title (title)
) COMMENT '教师表';

-- 3. 学生表
CREATE TABLE students (
    id INT PRIMARY KEY COMMENT '学号',
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码',
    name VARCHAR(100) NOT NULL COMMENT '姓名',
    email VARCHAR(100) COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '电话',
    gender ENUM('male', 'female', 'other') COMMENT '性别',
    birth_date DATE COMMENT '出生日期',
    college VARCHAR(100) NOT NULL COMMENT '学院',
    major VARCHAR(100) NOT NULL COMMENT '专业',
    class_name VARCHAR(50) NOT NULL COMMENT '班级',
    grade INT NOT NULL COMMENT '年级',
    enrollment_date DATE NOT NULL COMMENT '入学日期',
    advisor_id INT COMMENT '导师ID',
    dormitory VARCHAR(100) COMMENT '宿舍',
    max_credits INT DEFAULT 30 COMMENT '最大学分',
    current_credits INT DEFAULT 0 COMMENT '当前已选学分',
    gpa DECIMAL(3,2) DEFAULT 0.00 COMMENT '绩点',
    status ENUM('active', 'inactive', 'graduated', 'suspended') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_college (college),
    INDEX idx_major (major),
    INDEX idx_class (class_name),
    INDEX idx_status (status),
    INDEX idx_grade (grade),
    INDEX idx_advisor (advisor_id),
    FOREIGN KEY (advisor_id) REFERENCES teachers(id) ON DELETE SET NULL
) COMMENT '学生表';

-- 4. 更新的课程表（适配三表结构）
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '课程ID',
    course_code VARCHAR(20) UNIQUE NOT NULL COMMENT '课程代码',
    name VARCHAR(100) NOT NULL COMMENT '课程名称',
    credit INT NOT NULL COMMENT '学分',
    hours INT NOT NULL COMMENT '课时',
    time VARCHAR(50) NOT NULL COMMENT '上课时间',
    location VARCHAR(100) COMMENT '上课地点',
    description TEXT COMMENT '课程描述',
    max_students INT NOT NULL DEFAULT 30 COMMENT '最大学生数',
    current_students INT DEFAULT 0 COMMENT '当前学生数',
    teacher_id INT NOT NULL COMMENT '任课教师ID',
    college VARCHAR(100) NOT NULL COMMENT '开课学院',
    semester VARCHAR(20) NOT NULL COMMENT '学期',
    course_type ENUM('required', 'elective', 'major') DEFAULT 'elective' COMMENT '课程类型',
    prerequisites JSON COMMENT '先修课程',
    status ENUM('draft', 'published', 'ongoing', 'completed', 'cancelled') DEFAULT 'draft' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE RESTRICT,
    INDEX idx_course_code (course_code),
    INDEX idx_teacher (teacher_id),
    INDEX idx_college (college),
    INDEX idx_semester (semester),
    INDEX idx_status (status),
    INDEX idx_course_type (course_type)
) COMMENT '课程表';

-- 5. 选课关联表（替代原来的JSON字段）
CREATE TABLE course_selections (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '选课记录ID',
    course_id INT NOT NULL COMMENT '课程ID',
    student_id INT NOT NULL COMMENT '学生ID',
    selection_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '选课时间',
    status ENUM('selected', 'dropped', 'completed') DEFAULT 'selected' COMMENT '状态',
    final_score DECIMAL(5,2) COMMENT '最终成绩',
    grade_point DECIMAL(3,2) COMMENT '绩点',
    UNIQUE KEY unique_selection (course_id, student_id) COMMENT '防止重复选课',
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_course (course_id),
    INDEX idx_status (status),
    INDEX idx_selection_time (selection_time)
) COMMENT '选课记录表';

-- 6. 权限表（可选，用于细粒度权限控制）
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '权限ID',
    name VARCHAR(50) UNIQUE NOT NULL COMMENT '权限名称',
    description VARCHAR(200) COMMENT '权限描述',
    resource VARCHAR(50) NOT NULL COMMENT '资源名称',
    action VARCHAR(50) NOT NULL COMMENT '操作类型',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_resource (resource),
    INDEX idx_action (action)
) COMMENT '权限表';

-- 7. 角色权限关联表
CREATE TABLE admin_permissions (
    admin_id INT NOT NULL COMMENT '管理员ID',
    permission_id INT NOT NULL COMMENT '权限ID',
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '授权时间',
    PRIMARY KEY (admin_id, permission_id) COMMENT '复合主键',
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) COMMENT '管理员权限关联表';

-- 插入默认权限数据
INSERT INTO permissions (name, description, resource, action) VALUES
('manage_admins', '管理员管理', 'admin', 'crud'),
('manage_teachers', '教师管理', 'teacher', 'crud'),
('manage_students', '学生管理', 'student', 'crud'),
('manage_courses', '课程管理', 'course', 'crud'),
('view_reports', '查看报表', 'report', 'read'),
('system_settings', '系统设置', 'system', 'update');