/**
 * 快速部署和测试脚本
 * 自动执行数据库修复并测试功能
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

console.log('========================================');
console.log('   选课系统快速修复部署脚本');
console.log('========================================\n');

async function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  console.log(`命令: ${command}\n`);
  
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`✅ ${description} 完成\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} 失败:`, error.message);
    return false;
  }
}

async function main() {
  try {
    // 1. 更新数据库
    console.log('\n========================================');
    console.log('   步骤 1: 更新数据库');
    console.log('========================================');
    
    const dbSuccess = await runCommand(
      'mysql -u root -proot "course selection" < quick-fix.sql',
      '执行数据库修复脚本'
    );
    
    if (!dbSuccess) {
      console.error('\n❌ 数据库更新失败，请检查：');
      console.log('1. MySQL 服务是否运行');
      console.log('2. 用户名和密码是否正确（root/root）');
      console.log('3. 数据库 "course selection" 是否存在\n');
      return;
    }

    // 2. 验证存储过程
    console.log('\n========================================');
    console.log('   步骤 2: 验证存储过程');
    console.log('========================================');
    
    await runCommand(
      'mysql -u root -proot -e "SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = \'course selection\' AND ROUTINE_NAME IN (\'dropCourse\', \'selectCourse\');"',
      '验证存储过程创建'
    );

    // 3. 测试功能
    console.log('\n========================================');
    console.log('   步骤 3: 测试功能');
    console.log('========================================');
    
    console.log('\n📋 测试清单：');
    console.log('1. 退课功能测试');
    console.log('2. 冲突检测测试');
    console.log('3. 数据同步测试\n');
    
    console.log('💡 请手动执行以下测试：');
    console.log('');
    console.log('【测试1: 退课功能】');
    console.log('  a. 选择一门课程');
    console.log('  b. 进入"已选课程"标签页');
    console.log('  c. 点击"退选"按钮');
    console.log('  d. ✅ 验证：课程从列表中消失');
    console.log('  e. ✅ 验证：刷新页面数据一致');
    console.log('');
    console.log('【测试2: 冲突检测】');
    console.log('  a. 选择一门课程（如：周一第1-2节）');
    console.log('  b. 尝试选择另一门同时段课程（不同老师）');
    console.log('  c. ✅ 验证：显示冲突提示');
    console.log('  d. ✅ 验证：选择按钮被禁用');
    console.log('');
    console.log('【测试3: 数据同步】');
    console.log('  a. 选课后立即刷新页面');
    console.log('  b. ✅ 验证：已选课程显示正确');
    console.log('  c. 退课后立即刷新页面');
    console.log('  d. ✅ 验证：课程确实被删除');

    // 4. 完成提示
    console.log('\n========================================');
    console.log('   ✅ 部署完成');
    console.log('========================================\n');
    
    console.log('📝 后续步骤：');
    console.log('1. 重启后端服务（如果正在运行）');
    console.log('   - 按 Ctrl+C 停止服务');
    console.log('   - 执行: node app.js\n');
    
    console.log('2. 刷新前端页面');
    console.log('   - 按 Ctrl+F5 强制刷新\n');
    
    console.log('3. 打开浏览器控制台（F12）');
    console.log('   - 查看 Console 标签');
    console.log('   - 确认无错误信息\n');
    
    console.log('🎉 现在可以开始测试了！\n');

  } catch (error) {
    console.error('\n❌ 部署过程中发生错误:', error);
    console.log('\n请手动执行以下步骤：');
    console.log('1. mysql -u root -proot "course selection" < quick-fix.sql');
    console.log('2. node app.js');
    console.log('3. 在浏览器中刷新页面\n');
  }
}

// 运行部署
main();
