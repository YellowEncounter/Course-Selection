const { usselect } = require('./mysql');

console.log('========== 最终修复测试 ==========');

async function runTests() {
  console.log('\n【测试1】检查存储过程是否存在\n');

  const checkProcedures = () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT ROUTINE_NAME, ROUTINE_TYPE
        FROM INFORMATION_SCHEMA.ROUTINES
        WHERE ROUTINE_SCHEMA = 'course selection'
        AND ROUTINE_NAME IN ('selectCourse', 'dropCourse', 'hasTimeConflict')
      `;
      usselect(['localhost', 'course selection', query], (response) => {
        if (response.data) {
          console.log('✓ 存储过程列表:');
          response.data.forEach(item => {
            console.log(`  - ${item.ROUTINE_NAME} (${item.ROUTINE_TYPE})`);
          });
          resolve(response.data.length);
        } else {
          console.log('✗ 存储过程检查失败');
          resolve(0);
        }
      });
    });
  };

  const procedureCount = await checkProcedures();
  if (procedureCount < 3) {
    console.log('\n⚠ 警告：缺少存储过程，请先执行 FINAL_FIX.sql\n');
  }

  console.log('\n【测试2】测试退课存储过程\n');

  const testDropCourse = () => {
    return new Promise((resolve) => {
      usselect(['localhost', 'course selection', 'dropCourse', 1, 3], (response) => {
        console.log('退课响应:', JSON.stringify(response, null, 2));
        resolve();
      });
    });
  };

  await testDropCourse();

  console.log('\n【测试3】测试选课存储过程\n');

  const testSelectCourse = () => {
    return new Promise((resolve) => {
      usselect(['localhost', 'course selection', 'selectCourse', 1, 4], (response) => {
        console.log('选课响应:', JSON.stringify(response, null, 2));
        resolve();
      });
    });
  };

  await testSelectCourse();

  console.log('\n【测试4】测试时间冲突检测\n');

  const testTimeConflict = () => {
    return new Promise((resolve) => {
      usselect(['localhost', 'course selection', 'selectCourse', 13, 4], (response) => {
        console.log('冲突检测响应:', JSON.stringify(response, null, 2));
        resolve();
      });
    });
  };

  await testTimeConflict();

  console.log('\n========== 测试完成 ==========');
}

runTests().catch(console.error);
