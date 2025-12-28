const fs = require('fs');
const path = require('path');

console.log('========== 应用最终修复 ==========');
console.log('正在读取 SQL 文件...');

const sqlFilePath = path.join(__dirname, 'FINAL_FIX.sql');

if (!fs.existsSync(sqlFilePath)) {
  console.error('错误: FINAL_FIX.sql 文件不存在');
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log('SQL 文件读取成功，准备执行...');
console.log('请使用以下命令手动执行 SQL 文件：');
console.log('');
console.log('mysql -u root -p course selection < FINAL_FIX.sql');
console.log('');
console.log('或者使用 MySQL 客户工具打开 FINAL_FIX.sql 文件并执行');
console.log('');
console.log('修复内容：');
console.log('1. 删除旧的存储过程和函数');
console.log('2. 创建新的 hasTimeConflict 函数（正确的时间冲突检测）');
console.log('3. 创建新的 selectCourse 存储过程（修复 LEAVE 语句问题）');
console.log('4. 创建新的 dropCourse 存储过程（修复 LEAVE 语句问题）');
