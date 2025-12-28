USE `course selection`;

-- 检查课程数据和学生字段格式
SELECT 
    id,
    name,
    students,
    JSON_TYPE(students) as students_type,
    JSON_LENGTH(students) as student_count,
    JSON_EXTRACT(students, '$[0]') as first_student,
    JSON_TYPE(JSON_EXTRACT(students, '$[0]')) as first_student_type
FROM courses 
WHERE students IS NOT NULL AND JSON_LENGTH(students) > 0
LIMIT 10;

-- 检查特定学生是否在课程中
SELECT 
    c.id as course_id,
    c.name as course_name,
    c.students,
    JSON_CONTAINS(c.students, '202501') as contains_202501_num,
    JSON_CONTAINS(c.students, '"202501"') as contains_202501_str,
    JSON_SEARCH(c.students, 'one', '202501') as search_202501_num,
    JSON_SEARCH(c.students, 'one', '"202501"') as search_202501_str
FROM courses c
WHERE c.students IS NOT NULL
LIMIT 5;