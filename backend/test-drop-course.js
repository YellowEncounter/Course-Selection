/**
 * 退课功能测试脚本
 */

const { usselect } = require('./mysql');

// 测试参数
const testCourseId = 13;  // 替换为实际的课程ID
const testStudentId = 202501;  // 替换为实际的学生ID

console.log('========================================');
console.log('   退课功能测试脚本');
console.log('========================================\n');

async function testDropCourse() {
  console.log('📌 测试退课功能');
  console.log(`   课程ID: ${testCourseId}`);
  console.log(`   学生ID: ${testStudentId}\n`);

  try {
    // 1. 先查看课程当前状态
    console.log('【步骤1】查看课程当前状态');
    console.log('----------------------------------------');
    
    const checkCourse = () => new Promise((resolve, reject) => {
      usselect(['localhost', 'course selection', 'SELECT id, name, students, JSON_LENGTH(IFNULL(students, JSON_ARRAY())) as student_count FROM courses WHERE id = ?', testCourseId], (response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
    });

    const courseInfo = await checkCourse();
    console.log('课程信息:', JSON.stringify(courseInfo, null, 2));
    console.log('');

    // 2. 执行退课操作
    console.log('【步骤2】执行退课操作');
    console.log('----------------------------------------');

    const dropCourse = () => new Promise((resolve, reject) => {
      console.log('调用 dropCourse 存储过程...');
      usselect(['localhost', 'course selection', 'dropCourse', testCourseId, testStudentId], (response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
    });

    const dropResult = await dropCourse();
    console.log('退课结果:', JSON.stringify(dropResult, null, 2));
    console.log('');

    // 3. 验证退课后的课程状态
    console.log('【步骤3】验证退课后的课程状态');
    console.log('----------------------------------------');

    const checkAfterDrop = await checkCourse();
    console.log('退课后课程信息:', JSON.stringify(checkAfterDrop, null, 2));
    console.log('');

    // 4. 判断测试结果
    console.log('【测试结果】');
    console.log('----------------------------------------');
    
    if (dropResult.success) {
      console.log('✅ 退课成功！');
    } else {
      console.log('❌ 退课失败！');
      console.log('   错误信息:', dropResult.error);
      console.log('   错误代码:', dropResult.code);
      
      if (dropResult.debug) {
        console.log('   调试信息:', JSON.stringify(dropResult.debug, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }

  console.log('\n========================================');
  console.log('   测试完成');
  console.log('========================================');
}

// 执行测试
testDropCourse()
  .then(() => {
    console.log('\n✓ 测试脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ 测试脚本执行失败:', error);
    process.exit(1);
  });
