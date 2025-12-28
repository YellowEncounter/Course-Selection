const { usselect } = require('./mysql');
const _localhost = ['localhost', 'course selection'];

console.log('=== 测试修复后的退课功能 ===');
console.log('测试参数: courseId=19, studentId=202501');

usselect([_localhost[0], _localhost[1], 'dropCourse', 19, '202501'], function(ret) {
  console.log('\n退课结果:');
  console.log(JSON.stringify(ret, null, 2));
  
  // 检查课程19的当前状态
  console.log('\n=== 检查课程19的当前状态 ===');
  usselect([_localhost[0], _localhost[1], 'getAllCourses'], function(ret2) {
    const course19 = ret2.data.find(c => c.id === 19);
    if (course19) {
      console.log('课程19信息:', {
        id: course19.id,
        name: course19.name,
        students: course19.students,
        studentsCount: course19.students ? JSON.parse(course19.students).length : 0
      });
    }
  });
});