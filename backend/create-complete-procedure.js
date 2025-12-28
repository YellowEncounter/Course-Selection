/**
 * 创建完整的带时间冲突检测的存储过程
 */

const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'course selection',
  multipleStatements: true
});

console.log('========================================');
console.log('开始创建完整的存储过程');
console.log('========================================\n');

connection.connect((error) => {
  if (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }

  console.log('✅ 数据库连接成功\n');

  // 第1步：删除旧的存储过程
  console.log('1️⃣  删除旧的存储过程...\n');
  
  connection.query('DROP PROCEDURE IF EXISTS selectCourse', (error) => {
    if (error) {
      console.error('❌ 删除失败:', error);
      connection.end();
      process.exit(1);
    }
    
    console.log('✅ 旧存储过程已删除\n');

    // 第2步：创建新的selectCourse存储过程（带冲突检测）
    console.log('2️⃣  创建新的selectCourse存储过程（带冲突检测）...\n');

    const selectCourseSQL = `
CREATE PROCEDURE selectCourse(IN p_courseId INT, IN p_studentId INT)
BEGIN
    DECLARE v_courseExists INT;
    DECLARE v_courseTime VARCHAR(50);
    DECLARE v_maxStudents INT;
    DECLARE v_currentStudents INT;
    DECLARE v_studentAlreadySelected INT;
    DECLARE v_conflictCourseId INT;
    DECLARE v_conflictCourseName VARCHAR(100);
    DECLARE v_conflictTime VARCHAR(50);
    DECLARE v_day1 INT;
    DECLARE v_day2 INT;
    DECLARE v_startHour1 INT;
    DECLARE v_endHour1 INT;
    DECLARE v_startHour2 INT;
    DECLARE v_endHour2 INT;
    DECLARE v_temp VARCHAR(50);
    DECLARE v_periodChar VARCHAR(2);
    DECLARE v_dayChar VARCHAR(1);
    DECLARE v_canSelect INT DEFAULT 1;
    
    -- 1. 检查课程是否存在
    SELECT COUNT(*) INTO v_courseExists FROM courses WHERE id = p_courseId;
    
    IF v_courseExists = 0 THEN
        SELECT '{"error": "课程不存在"}' AS result;
        SET v_canSelect = 0;
    ELSE
        -- 2. 获取课程信息
        SELECT \`time\`, maxStudents, JSON_LENGTH(IFNULL(students, JSON_ARRAY())) 
        INTO v_courseTime, v_maxStudents, v_currentStudents
        FROM courses WHERE id = p_courseId;
        
        -- 3. 检查学生是否已选该课程
        SELECT COUNT(*) INTO v_studentAlreadySelected
        FROM courses c 
        WHERE c.id = p_courseId 
        AND JSON_CONTAINS(c.students, CAST(p_studentId AS JSON));
        
        IF v_studentAlreadySelected > 0 THEN
            SELECT '{"error": "您已选择此课程"}' AS result;
            SET v_canSelect = 0;
        ELSE
            -- 4. 检查课程人数上限
            IF v_currentStudents >= v_maxStudents THEN
                SELECT '{"error": "课程名额已满"}' AS result;
                SET v_canSelect = 0;
            END IF;
        END IF;
    END IF;
    
    -- 5. 检查时间冲突（仅当可以选课时）
    IF v_canSelect = 1 THEN
        -- 先解析待选课程的时间
        SET v_temp = v_courseTime;
        
        IF INSTR(v_temp, '周') > 0 THEN
            SET v_dayChar = SUBSTRING(v_temp, LOCATE('周', v_temp) + 1, 1);
            
            CASE v_dayChar
                WHEN '一' THEN SET v_day1 = 1;
                WHEN '二' THEN SET v_day1 = 2;
                WHEN '三' THEN SET v_day1 = 3;
                WHEN '四' THEN SET v_day1 = 4;
                WHEN '五' THEN SET v_day1 = 5;
                WHEN '六' THEN SET v_day1 = 6;
                WHEN '日' THEN SET v_day1 = 0;
                ELSE SET v_day1 = -1;
            END CASE;
        ELSE
            SET v_day1 = -1;
        END IF;
        
        -- 解析节次
        IF INSTR(v_temp, '第') > 0 AND INSTR(v_temp, '-') > 0 AND INSTR(v_temp, '节') > 0 THEN
            SET v_temp = SUBSTRING(v_temp, LOCATE('第', v_temp) + 1);
            SET v_temp = SUBSTRING(v_temp, 1, LOCATE('节', v_temp) - 1);
            
            SET v_periodChar = SUBSTRING(v_temp, 1, LOCATE('-', v_temp) - 1);
            SET v_startHour1 = CAST(v_periodChar AS UNSIGNED);
            
            SET v_periodChar = SUBSTRING(v_temp, LOCATE('-', v_temp) + 1);
            SET v_endHour1 = CAST(v_periodChar AS UNSIGNED);
            
            -- 将节次转换为小时
            CASE v_startHour1
                WHEN 1 THEN SET v_startHour1 = 8;
                WHEN 3 THEN SET v_startHour1 = 10;
                WHEN 5 THEN SET v_startHour1 = 14;
                WHEN 7 THEN SET v_startHour1 = 16;
                WHEN 9 THEN SET v_startHour1 = 19;
                ELSE SET v_startHour1 = -1;
            END CASE;
            
            CASE v_endHour1
                WHEN 2 THEN SET v_endHour1 = 10;
                WHEN 4 THEN SET v_endHour1 = 12;
                WHEN 6 THEN SET v_endHour1 = 16;
                WHEN 8 THEN SET v_endHour1 = 18;
                WHEN 10 THEN SET v_endHour1 = 21;
                ELSE SET v_endHour1 = -1;
            END CASE;
        END IF;
        
        -- 查询学生已选的课程，检查时间冲突
        SELECT c.id, c.name, c.\`time\`
        INTO v_conflictCourseId, v_conflictCourseName, v_conflictTime
        FROM courses c
        WHERE JSON_CONTAINS(c.students, CAST(p_studentId AS JSON))
        AND c.id != p_courseId
        LIMIT 1;
        
        -- 如果有已选课程，检查时间冲突
        IF v_conflictCourseId IS NOT NULL THEN
            -- 解析已选课程的时间
            SET v_temp = v_conflictTime;
            
            IF INSTR(v_temp, '周') > 0 THEN
                SET v_dayChar = SUBSTRING(v_temp, LOCATE('周', v_temp) + 1, 1);
                
                CASE v_dayChar
                    WHEN '一' THEN SET v_day2 = 1;
                    WHEN '二' THEN SET v_day2 = 2;
                    WHEN '三' THEN SET v_day2 = 3;
                    WHEN '四' THEN SET v_day2 = 4;
                    WHEN '五' THEN SET v_day2 = 5;
                    WHEN '六' THEN SET v_day2 = 6;
                    WHEN '日' THEN SET v_day2 = 0;
                    ELSE SET v_day2 = -1;
                END CASE;
            ELSE
                SET v_day2 = -1;
            END IF;
            
            -- 解析节次
            IF INSTR(v_temp, '第') > 0 AND INSTR(v_temp, '-') > 0 AND INSTR(v_temp, '节') > 0 THEN
                SET v_temp = SUBSTRING(v_temp, LOCATE('第', v_temp) + 1);
                SET v_temp = SUBSTRING(v_temp, 1, LOCATE('节', v_temp) - 1);
                
                SET v_periodChar = SUBSTRING(v_temp, 1, LOCATE('-', v_temp) - 1);
                SET v_startHour2 = CAST(v_periodChar AS UNSIGNED);
                
                SET v_periodChar = SUBSTRING(v_temp, LOCATE('-', v_temp) + 1);
                SET v_endHour2 = CAST(v_periodChar AS UNSIGNED);
                
                -- 将节次转换为小时
                CASE v_startHour2
                    WHEN 1 THEN SET v_startHour2 = 8;
                    WHEN 3 THEN SET v_startHour2 = 10;
                    WHEN 5 THEN SET v_startHour2 = 14;
                    WHEN 7 THEN SET v_startHour2 = 16;
                    WHEN 9 THEN SET v_startHour2 = 19;
                    ELSE SET v_startHour2 = -1;
                END CASE;
                
                CASE v_endHour2
                    WHEN 2 THEN SET v_endHour2 = 10;
                    WHEN 4 THEN SET v_endHour2 = 12;
                    WHEN 6 THEN SET v_endHour2 = 16;
                    WHEN 8 THEN SET v_endHour2 = 18;
                    WHEN 10 THEN SET v_endHour2 = 21;
                    ELSE SET v_endHour2 = -1;
                END CASE;
            END IF;
            
            -- 检查是否冲突
            -- 同一天且时间段重叠
            IF v_day1 = v_day2 AND v_day1 != -1 AND v_startHour1 != -1 AND v_endHour1 != -1 AND v_startHour2 != -1 AND v_endHour2 != -1 THEN
                IF (v_startHour1 < v_endHour2) AND (v_endHour1 > v_startHour2) THEN
                    SELECT CONCAT('{"error": "时间冲突：与已选课程《', v_conflictCourseName, '》时间冲突 (', v_conflictTime, ')"}') AS result;
                    SET v_canSelect = 0;
                END IF;
            END IF;
        END IF;
    END IF;
    
    -- 6. 所有检查通过，执行选课
    IF v_canSelect = 1 THEN
        UPDATE courses 
        SET students = JSON_ARRAY_APPEND(IFNULL(students, JSON_ARRAY()), '$', p_studentId) 
        WHERE id = p_courseId;
        
        SELECT '{"success": true, "message": "选课成功"}' AS result;
    END IF;
END
`;

    connection.query(selectCourseSQL, (error) => {
      if (error) {
        console.error('❌ 创建失败:', error);
        connection.end();
        process.exit(1);
      }

      console.log('✅ selectCourse存储过程创建成功（带时间冲突检测）\n');

      // 验证存储过程
      console.log('3️⃣  验证存储过程...\n');

      connection.query(`
        SELECT ROUTINE_NAME, ROUTINE_TYPE
        FROM INFORMATION_SCHEMA.ROUTINES
        WHERE ROUTINE_SCHEMA = 'course selection'
        AND ROUTINE_NAME = 'selectCourse'
      `, (verifyError, verifyResults) => {
        if (verifyError) {
          console.error('❌ 验证失败:', verifyError);
        } else {
          console.log('✅ 验证成功\n');
          console.table(verifyResults);
        }

        connection.end(() => {
          console.log('\n========================================');
          console.log('存储过程创建完成');
          console.log('========================================');
          console.log('\n下一步操作:');
          console.log('1. 运行测试脚本: node test-conflict-detection.js');
          console.log('2. 重启后端服务');
          console.log('3. 清空浏览器缓存');
          console.log('4. 测试选课功能\n');
        });
      });
    });
  });
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  connection.end();
  process.exit(1);
});
