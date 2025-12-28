const { usselect } = require('./mysql');

console.log('========== 测试所有存储过程 ==========\n');

async function testAllFunctions() {
  console.log('[1/6] 测试 getAllCourses...\n');
  usselect(['localhost', 'course selection', 'getAllCourses'], (response) => {
    console.log('getAllCourses 响应:', JSON.stringify(response, null, 2));
  });

  setTimeout(() => {
    console.log('\n[2/6] 测试 selectCourse (选课)...\n');
    usselect(['localhost', 'course selection', 'selectCourse', 1, 3], (response) => {
      console.log('selectCourse 响应:', JSON.stringify(response, null, 2));
    });
  }, 2000);

  setTimeout(() => {
    console.log('\n[3/6] 测试 dropCourse (退课)...\n');
    usselect(['localhost', 'course selection', 'dropCourse', 1, 3], (response) => {
      console.log('dropCourse 响应:', JSON.stringify(response, null, 2));
    });
  }, 4000);

  setTimeout(() => {
    console.log('\n[4/6] 测试 getCourseInfo...\n');
    usselect(['localhost', 'course selection', 'getCourseInfo', 1], (response) => {
      console.log('getCourseInfo 响应:', JSON.stringify(response, null, 2));
    });
  }, 6000);

  setTimeout(() => {
    console.log('\n[5/6] 测试 getCourseStudents...\n');
    usselect(['localhost', 'course selection', 'getCourseStudents', 1], (response) => {
      console.log('getCourseStudents 响应:', JSON.stringify(response, null, 2));
    });
  }, 8000);

  setTimeout(() => {
    console.log('\n[6/6] 测试 hasTimeConflict...\n');
    usselect(['localhost', 'course selection', 'SELECT hasTimeConflict("周二第5-6节", "周二第5-6节")'], (response) => {
      console.log('hasTimeConflict 响应:', JSON.stringify(response, null, 2));
    });
  }, 10000);

  setTimeout(() => {
    console.log('\n========== 测试完成 ==========');
  }, 12000);
}

testAllFunctions();
