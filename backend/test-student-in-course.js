const { usselect } = require('./mysql');
const _localhost = ['localhost', 'course selection'];

console.log('=== 测试学生选课和退课流程 ===');

async function testFlow() {
  return new Promise((resolve, reject) => {
    console.log('\n1. 先让学生202501选课程19:');
    
    // 先让学生选课
    usselect([_localhost[0], _localhost[1], 'selectCourse', 19, '202501'], function(selectResult) {
      console.log('选课结果:', JSON.stringify(selectResult, null, 2));
      
      setTimeout(() => {
        console.log('\n2. 检查课程19的当前状态:');
        usselect([_localhost[0], _localhost[1], 'getAllCourses'], function(coursesResult) {
          if (coursesResult && coursesResult.data) {
            const course19 = coursesResult.data.find(c => c.id === 19);
            if (course19) {
              console.log('课程19学生列表:', course19.students);
              
              try {
                const students = JSON.parse(course19.students);
                console.log('解析后的学生数组:', students);
                console.log('学生202501是否在列表:', students.includes('202501'));
              } catch (e) {
                console.log('JSON解析失败');
              }
            }
          }
          
          console.log('\n3. 现在测试退课:');
          usselect([_localhost[0], _localhost[1], 'dropCourse', 19, '202501'], function(dropResult) {
            console.log('退课结果:', JSON.stringify(dropResult, null, 2));
            
            setTimeout(() => {
              console.log('\n4. 检查退课后的课程状态:');
              usselect([_localhost[0], _localhost[1], 'getAllCourses'], function(finalResult) {
                if (finalResult && finalResult.data) {
                  const course19 = finalResult.data.find(c => c.id === 19);
                  if (course19) {
                    console.log('退课后课程19学生列表:', course19.students);
                    
                    try {
                      const students = JSON.parse(course19.students);
                      console.log('最终学生数组:', students);
                      console.log('学生202501是否已移除:', !students.includes('202501'));
                    } catch (e) {
                      console.log('最终JSON解析失败');
                    }
                  }
                }
                
                resolve({
                  select: selectResult,
                  drop: dropResult,
                  final: finalResult
                });
              });
            }, 500);
          });
        });
      }, 500);
    });
  });
}

testFlow().then(results => {
  console.log('\n=== 测试流程完成 ===');
  console.log('选课:', results.select);
  console.log('退课:', results.drop);
}).catch(error => {
  console.error('测试失败:', error);
});