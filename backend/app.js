// call the packages we need
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var request = require("request");
const edurouter = require('./pbl');
const morgan = require('morgan');
var path = require("path");
var port = "7005";        // set our port

app.use(morgan('dev'));  // 日志中间件

// 配置body-parser解析请求体
app.use(bodyParser.urlencoded({ extended: true, limit: '3mb' }));
app.use(bodyParser.json({ limit: '3mb' }));

// 跨域配置
app.use(function (req, res, next) {
  var origin = req.headers.origin || "*";
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Credentials', true);
  res.header('X-Powered-By', '3.2.1');
  res.header('Content-Type', 'application/json;charset=utf-8');
  next();
});

// 路由配置：所有/api/pbl开头的请求由edurouter处理
app.use('/api/pbl', edurouter);

// 添加课程选课退课API路由（选课系统核心功能）
try {
  const courseRouter = require('./course-api');
  app.use('/api/course', courseRouter);
  console.log('✅ course-api 模块已加载');
} catch (error) {
  console.log('⚠️  course-api 模块未找到，跳过加载');
}

// // 添加新的课程API路由（可选）
// try {
//   const newCourseRouter = require('./new-course-api');
//   app.use('/pbl', newCourseRouter);
//   console.log('✅ new-course-api 模块已加载');
// } catch (error) {
//   console.log('⚠️  new-course-api 模块未找到，跳过加载');
// }

// // 添加管理员优化API路由（可选）
// try {
//   const adminOptimizationRouter = require('./admin-optimization-api');
//   app.use('/api/admin', adminOptimizationRouter);
//   console.log('✅ admin-optimization-api 模块已加载');
// } catch (error) {
//   console.log('⚠️  admin-optimization-api 模块未找到，跳过加载');
// }

// 文件下载接口
app.all('/download', function (req, res, next) {
  request({
    url: req.body.url,
    method: "GET",
    encoding: null,
    headers: {
      'Accept-Encoding': 'gzip, deflate'
    }
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.setHeader('Content-Type', 'application/force-download');
      res.setHeader('Content-Disposition', 'attachment; filename=' + path.basename(req.body.url));
      res.setHeader('Content-Length', body.length);
      res.send(body);
    } else {
      res.status(400).send({ error: "下载失败" });
    }
  });
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error("未处理的异常：", error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝：', promise, '原因：', reason);
});

// 启动服务器
app.listen(port, '0.0.0.0');
console.log('服务器运行在端口 ' + port);