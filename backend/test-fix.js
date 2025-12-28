/**
 * 测试修复后的功能
 */

const mysql = require('mysql');

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'course selection'
};

// 创建数据库连接
const connection = mysql.createConnection(dbConfig);

console.log('========================================');
console.log('   功能测试脚本');
console.log('========================================\n');

// 测试函数
async function testDropCourse(courseId, studentId) {
  console.log(`\n📌 测试退课：课程ID ${courseId}, 学生ID ${studentId}`);
  
  try {
    const result = await new Promise((resolve, reject) => {
      connection.query(`CALL dropCourse(?, ?)`, [courseId, studentId], (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });
    
    console.log('返回结果:', result[0]);
    
    if (result[0] && result[0][0] && result[0][0].result) {
      const parsedResult = JSON.parse(result[0][0].result);
      console.log('✅ 解析后的结果:', parsedResult);
      return parsedResult;
    }
    
    return result;
  } catch (error) {
    console.error('❌ 退课失败:', error.message);
    throw error;
  }
}

async function testSelectCourse(courseId, studentId) {
  console.log(`\n📌 测试选课：课程ID ${courseId}, 学生ID ${studentId}`);
  
  try {
    const result = await new Promise((resolve, reject) => {
      connection.query(`CALL selectCourse(?, ?)`, [courseId, studentId], (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });
    
    console.log('返回结果:', result[0]);
    
    if (result[0] && result[0][0] && result[0][0].result) {
      const parsedResult = JSON.parse(result[0][0].result);
      console.log('✅ 解析后的结果:', parsedResult);
      return parsedResult;
    }
    
    return result;
  } catch (error) {
    console.error('❌ 选课失败:', error.message);
    throw error;
  }
}

async function testGetAllCourses() {
  console.log('\n📌 测试获取所有课程');
  
  try {
    const result = await new Promise((resolve, reject) => {
      connection.query(`CALL getAllCourses()`, (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });
    
    console.log('✅ 课程列表:', result[0]);
    return result[0];
  } catch (error) {
    console.error('❌ 获取课程失败:', error.message);
    throw error;
  }
}

// 主测试流程
async function runTests() {
  try {
    // 1. 连接数据库
    console.log('1. 连接数据库...');
    await new Promise((resolve, reject) => {
      connection.connect((error) => {
        if (error) reject(error);
        else {
          console.log('✅ 数据库连接成功\n');
          resolve();
        }
      });
    });

    // 2. 获取所有课程
    console.log('2. 获取所有课程...');
    const courses = await testGetAllCourses();
    
    if (courses && courses.length >= 2) {
      // 使用前两门课程进行测试
      const course1 = courses[0];
      const course2 = courses[1];
      const testStudentId = 202501;
      
      console.log('\n测试课程1:', course1.name, `(ID:${course1.id}, 时间:${course1.time}, 教师:${course1.teacherId})`);
      console.log('测试课程2:', course2.name, `(ID:${course2.id}, 时间:${course2.time}, 教师:${course2.teacherId})`);
      console.log('测试学生ID:', testStudentId);

      // 3. 测试选课
      console.log('\n3. 测试选课功能...');
      console.log('----------------------------------------');
      console.log('3.1 选择课程1');
      const select1 = await testSelectCourse(course1.id, testStudentId);
      
      if (select1.success) {
        console.log('✅ 选课1成功\n');
        
        // 4. 测试重复选课
        console.log('3.2 重复选择课程1（应该失败）');
        const selectDuplicate = await testSelectCourse(course1.id, testStudentId);
        
        if (!selectDuplicate.success) {
          console.log('✅ 重复选课被正确拒绝\n');
        } else {
          console.log('❌ 重复选课没有被拒绝（有问题）\n');
        }
        
        // 5. 测试退课
        console.log('3.3 退选课程1');
        console.log('----------------------------------------');
        const drop1 = await testDropCourse(course1.id, testStudentId);
        
        if (drop1.success) {
          console.log('✅ 退课1成功\n');
          
          // 6. 测试重复退课
          console.log('3.4 重复退选课程1（应该失败）');
          const dropDuplicate = await testDropCourse(course1.id, testStudentId);
          
          if (!dropDuplicate.success) {
            console.log('✅ 重复退课被正确拒绝\n');
          } else {
            console.log('❌ 重复退课没有被拒绝（有问题）\n');
          }
          
          // 7. 再次选择课程1
          console.log('3.5 再次选择课程1');
          console.log('----------------------------------------');
          const selectAgain = await testSelectCourse(course1.id, testStudentId);
          
          if (selectAgain.success) {
            console.log('✅ 选课1成功\n');
            
            // 8. 选择课程2（如果时间不同）
            console.log('3.6 选择课程2');
            const select2 = await testSelectCourse(course2.id, testStudentId);
            
            if (select2.success) {
              console.log('✅ 选课2成功\n');
              
              // 9. 退课课程2
              console.log('3.7 退选课程2');
              const drop2 = await testDropCourse(course2.id, testStudentId);
              
              if (drop2.success) {
                console.log('✅ 退课2成功\n');
              }
            } else {
              console.log('⚠️ 选课2失败（可能是时间冲突或名额已满）：', select2.error, '\n');
            }
            
            // 10. 清理：退课课程1
            console.log('3.8 清理：退选课程1');
            await testDropCourse(course1.id, testStudentId);
          }
        } else {
          console.log('❌ 退课1失败：', drop1.error, '\n');
        }
      } else {
        console.log('❌ 选课1失败：', select1.error, '\n');
      }
    } else {
      console.log('⚠️ 数据库中课程数量不足2门，无法进行完整测试\n');
      console.log('当前课程数:', courses ? courses.length : 0);
    }

    console.log('\n========================================');
    console.log('   ✅ 测试完成');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
  } finally {
    // 关闭数据库连接
    connection.end();
    console.log('数据库连接已关闭');
    process.exit(0);
  }
}

// 运行测试
console.log('开始测试...\n');
runTests();
