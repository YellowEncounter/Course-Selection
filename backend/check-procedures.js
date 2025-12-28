const { usselect } = require('./mysql');

console.log('========== 数据库存储过程诊断 ==========');

async function checkProcedures() {
  console.log('\n1. 检查存储过程是否存在...\n');

  const query1 = `
    SELECT ROUTINE_NAME, ROUTINE_TYPE, CREATED
    FROM INFORMATION_SCHEMA.ROUTINES
    WHERE ROUTINE_SCHEMA = 'course selection'
    AND ROUTINE_NAME IN ('selectCourse', 'dropCourse', 'getCourseInfo', 'hasTimeConflict')
    ORDER BY ROUTINE_TYPE, ROUTINE_NAME
  `;

  usselect(['localhost', 'course selection', query1], (response) => {
    console.log('存储过程列表:', response);
  });

  // 延迟2秒后测试调用
  setTimeout(() => {
    console.log('\n2. 测试 dropCourse 存储过程...\n');

    usselect(['localhost', 'course selection', 'dropCourse', 1, 3], (response) => {
      console.log('dropCourse 测试结果:', response);
    });
  }, 2000);

  setTimeout(() => {
    console.log('\n3. 测试 selectCourse 存储过程...\n');

    usselect(['localhost', 'course selection', 'selectCourse', 1, 4], (response) => {
      console.log('selectCourse 测试结果:', response);
    });
  }, 4000);
}

checkProcedures();
