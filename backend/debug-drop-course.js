const mysql = require('mysql');

// 创建数据库连接
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'course selection'
});

console.log('🔍 退课功能调试分析');
console.log('='.repeat(50));

// 获取学生ID和课程ID（从命令行参数或默认值）
const studentId = process.argv[2] || '202501';
const courseId = process.argv[3] || '13';

console.log(`📋 调试参数:`);
console.log(`   学生ID: ${studentId} (类型: ${typeof studentId})`);
console.log(`   课程ID: ${courseId} (类型: ${typeof courseId})`);
console.log('');

// 1. 检查课程是否存在
console.log('🔍 步骤1: 检查课程是否存在');
connection.query(
  'SELECT id, name, students FROM courses WHERE id = ?',
  [courseId],
  (error, results) => {
    if (error) {
      console.error('❌ 查询课程失败:', error);
      connection.end();
      return;
    }

    if (results.length === 0) {
      console.log('❌ 课程不存在');
      connection.end();
      return;
    }

    const course = results[0];
    console.log('✅ 课程存在:', course.name);
    console.log(`   课程ID: ${course.id}`);
    console.log(`   课程名称: ${course.name}`);
    console.log(`   学生字段: ${course.students}`);
    console.log(`   学生字段类型: ${typeof course.students}`);
    console.log('');

    // 2. 解析学生数据
    console.log('🔍 步骤2: 解析课程学生数据');
    let students = [];
    
    try {
      if (typeof course.students === 'string') {
        students = JSON.parse(course.students);
      } else if (Array.isArray(course.students)) {
        students = course.students;
      } else {
        students = [];
      }
      console.log('✅ 学生数据解析成功:', students);
      console.log(`   学生数量: ${students.length}`);
      console.log(`   学生列表: [${students.join(', ')}]`);
    } catch (e) {
      console.error('❌ 学生数据解析失败:', e);
      console.log(`   原始数据: ${course.students}`);
      connection.end();
      return;
    }
    console.log('');

    // 3. 检查学生是否在课程中
    console.log('🔍 步骤3: 检查学生是否在课程中');
    console.log(`   查找学生ID: ${studentId}`);
    
    // 多种查找方式
    const asString = students.map(String);
    const asNumber = students.map(id => parseInt(id) || 0);
    
    const foundAsString = asString.includes(studentId);
    const foundAsNumber = asNumber.includes(parseInt(studentId));
    
    console.log(`   字符串查找: ${foundAsString}`);
    console.log(`   数字查找: ${foundAsNumber}`);
    console.log(`   学生列表(字符串): [${asString.join(', ')}]`);
    console.log(`   学生列表(数字): [${asNumber.join(', ')}]`);
    
    if (!foundAsString && !foundAsNumber) {
      console.log('❌ 学生不在课程中');
      connection.end();
      return;
    }
    
    console.log('✅ 学生在课程中');
    console.log('');

    // 4. 测试存储过程调用
    console.log('🔍 步骤4: 测试存储过程调用');
    connection.query(
      'CALL dropCourse(?, ?)',
      [courseId, parseInt(studentId)],
      (error, results) => {
        if (error) {
          console.error('❌ 存储过程调用失败:', error);
          connection.end();
          return;
        }
        
        console.log('✅ 存储过程调用成功');
        console.log('   返回结果:', JSON.stringify(results, null, 2));
        
        // 解析存储过程结果
        if (results && results.length > 0 && results[0][0]) {
          const result = results[0][0];
          console.log('');
          console.log('📋 存储过程解析结果:');
          console.log(`   success: ${result.success}`);
          console.log(`   message: ${result.message}`);
          console.log(`   error: ${result.error}`);
          console.log(`   code: ${result.code}`);
        }
        
        console.log('');
        
        // 5. 验证更新结果
        console.log('🔍 步骤5: 验证更新结果');
        connection.query(
          'SELECT id, name, students FROM courses WHERE id = ?',
          [courseId],
          (error, results) => {
            if (error) {
              console.error('❌ 验证查询失败:', error);
            } else if (results.length > 0) {
              const updatedCourse = results[0];
              console.log('✅ 验证查询成功');
              console.log(`   更新后的学生字段: ${updatedCourse.students}`);
              
              let updatedStudents = [];
              try {
                if (typeof updatedCourse.students === 'string') {
                  updatedStudents = JSON.parse(updatedCourse.students);
                } else if (Array.isArray(updatedCourse.students)) {
                  updatedStudents = updatedCourse.students;
                }
              } catch (e) {
                console.error('❌ 更新数据解析失败:', e);
              }
              
              console.log(`   更新后学生列表: [${updatedStudents.join(', ')}]`);
              console.log(`   学生是否已被移除: ${!updatedStudents.map(String).includes(studentId)}`);
            }
            
            console.log('');
            console.log('🔍 步骤6: 完整的调试报告');
            console.log('='.repeat(50));
            console.log('📊 问题诊断总结:');
            console.log(`   1. 课程存在: ✓`);
            console.log(`   2. 学生数据格式: ${typeof course.students}`);
            console.log(`   3. 学生原本在课程中: ${foundAsString || foundAsNumber}`);
            console.log(`   4. 存储过程执行: ✓`);
            console.log(`   5. 数据更新结果: ${results ? '✓' : '❌'}`);
            
            connection.end();
          }
        );
      }
    );
  }
);