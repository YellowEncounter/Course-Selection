/**
 * 快速诊断工具
 * 检查后端服务启动所需的所有条件
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

console.log('========================================');
console.log('后端服务诊断工具');
console.log('========================================\n');

let allPass = true;

// 1. 检查 Node.js
console.log('1️⃣  检查 Node.js 版本');
const nodeVersion = process.version;
console.log('   ✅ 版本:', nodeVersion);
console.log('');

// 2. 检查工作目录
console.log('2️⃣  检查工作目录');
const cwd = process.cwd();
console.log('   ✅ 目录:', cwd);
console.log('');

// 3. 检查 app.js
console.log('3️⃣  检查 app.js');
const appJsPath = path.join(cwd, 'app.js');
if (fs.existsSync(appJsPath)) {
  console.log('   ✅ app.js 存在');
} else {
  console.log('   ❌ app.js 不存在');
  allPass = false;
}
console.log('');

// 4. 检查 pbl.js
console.log('4️⃣  检查 pbl.js');
const pblJsPath = path.join(cwd, 'pbl.js');
if (fs.existsSync(pblJsPath)) {
  console.log('   ✅ pbl.js 存在');
} else {
  console.log('   ❌ pbl.js 不存在');
  allPass = false;
}
console.log('');

// 5. 检查 mysql.js
console.log('5️⃣  检查 mysql.js');
const mysqlJsPath = path.join(cwd, 'mysql.js');
if (fs.existsSync(mysqlJsPath)) {
  console.log('   ✅ mysql.js 存在');
} else {
  console.log('   ❌ mysql.js 不存在');
  allPass = false;
}
console.log('');

// 6. 检查依赖包
console.log('6️⃣  检查依赖包');
const packageJsonPath = path.join(cwd, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('   ✅ package.json 存在');
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log('   主要依赖:');
  console.log('   - express:', packageJson.dependencies.express || '未定义');
  console.log('   - mysql:', packageJson.dependencies.mysql || '未定义');
  
  const nodeModulesPath = path.join(cwd, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log('   ✅ node_modules 目录存在');
  } else {
    console.log('   ⚠️  node_modules 目录不存在');
    console.log('   解决方案: 运行 npm install');
    allPass = false;
  }
} else {
  console.log('   ❌ package.json 不存在');
  allPass = false;
}
console.log('');

// 7. 检查数据库连接
console.log('7️⃣  检查数据库连接');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'course selection'
});

connection.connect((error) => {
  if (error) {
    console.log('   ❌ 数据库连接失败');
    console.log('   错误:', error.message);
    console.log('');
    console.log('   可能的原因:');
    console.log('   1. MySQL 服务未启动');
    console.log('   2. 数据库配置不正确');
    console.log('   3. 数据库 "course selection" 不存在');
    allPass = false;
  } else {
    console.log('   ✅ 数据库连接成功');
    console.log('   主机: localhost');
    console.log('   数据库: course selection');
    connection.end();
  }
  console.log('');

  // 8. 检查端口
  console.log('8️⃣  检查端口 7005');
  console.log('   ⚠️  需要启动服务后才能检查');
  console.log('   预期端口: 7005');
  console.log('');

  // 总结
  console.log('========================================');
  if (allPass) {
    console.log('✅ 所有检查通过！');
    console.log('========================================\n');
    console.log('下一步操作:');
    console.log('1. 运行: node app.js');
    console.log('2. 或者双击: start-server.bat');
    console.log('3. 访问: http://localhost:7005/api/pbl/getUser-1\n');
  } else {
    console.log('❌ 存在问题，请修复后重试');
    console.log('========================================\n');
    console.log('修复建议:');
    console.log('1. 运行: npm install');
    console.log('2. 检查 MySQL 服务是否运行');
    console.log('3. 检查数据库配置 (mysql.js)\n');
  }
});
