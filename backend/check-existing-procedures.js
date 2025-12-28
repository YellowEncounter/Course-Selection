const { usselect } = require('./mysql');

console.log('========== 检查现有存储过程 ==========\n');

async function checkExistingProcedures() {
  // 检查存储过程是否存在
  usselect(['localhost', 'course selection', `
    SELECT ROUTINE_NAME, ROUTINE_TYPE
    FROM INFORMATION_SCHEMA.ROUTINES
    WHERE ROUTINE_SCHEMA = 'course selection'
    ORDER BY ROUTINE_NAME
  `], (response) => {
    if (response.data) {
      console.log('现有存储过程:');
      response.data.forEach(item => {
        console.log(`  ${item.ROUTINE_NAME} (${item.ROUTINE_TYPE})`);
      });
    }
  });
}

checkExistingProcedures();
