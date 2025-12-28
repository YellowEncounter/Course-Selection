var mysql = require('mysql');

// 数据库连接工具
var us = {
  mysql: mysql,
  sqle: {}
};

// 创建数据库连接池
us.mysqlconnection = function (host, database) {
  if (!us.sqle[host] || !us.sqle[host][database]) {
    let port = 3306;
    us.sqle[host] = us.sqle[host] || {};
    us.sqle[host][database] = us.mysql.createPool({
      connectionLimit: 100000,
      queueLimit: 100000,
      host: host,
      user: "root",
      password: "root",
      charset: 'utf8mb4_general_ci',
      database: database,
      port: port,
    });
  }
  return us.sqle[host][database];
};

// 执行存储过程
function usselect(param, callback) {
  console.log("usselect 函数调用，参数:", param);
  
  if (param.length > 1) {
    var _mysqlconnection = us.mysqlconnection(param[0], param[1]);
    _mysqlconnection.getConnection(function (error, connection) {
      if (error) {
        console.error("数据库连接失败：", error);
        callback({ error: error.message || "数据库连接失败" });
      } else {
        console.log("数据库连接成功");
        
        // 解码参数
        for (let i = 0; i < param.length; i++) {
          param[i] = decodeURIComponent(param[i]);
        }
        console.log("解码后的参数:", param);

        // 构建SQL语句 - 使用反引号包围存储过程名称以支持连字符
        let _sql = "CALL ";
        let _param = [];
        if (param.length > 3) {
          _param = param.slice(3);
          _sql += "`" + (param[2] || "") + "`(?";
          _sql += Array(_param.length).join(",?");
          _sql += ");";
        } else {
          _sql += "`" + param[2] + "`();";
        }
        
        console.log("执行SQL:", _sql);
        console.log("SQL参数:", _param);

        // 执行SQL
        connection.query(_sql, _param, function (error, results) {
          if (error) {
            console.error("SQL执行错误:", error);
            callback({ error: error.message || "SQL执行失败" });
          } else if (results) {
            console.log("SQL执行成功，结果行数:", results.length);
            
            // 处理响应结果
            let response;
            if (results.affectedRows != null) {
              // 增删改返回受影响行数
              response = { affectedRows: results.affectedRows };
              console.log("增删改操作，受影响行数:", results.affectedRows);
            } else {
              // 查询返回数据
              const data = results.length ? results[0] : [];
              response = { data: data };
              console.log("查询操作，返回数据行数:", data.length);
              
              // 如果是getAllCourses，额外记录每个课程的信息
              if (param[2] === 'getAllCourses') {
                data.forEach((course, index) => {
                  console.log(`课程${index + 1}:`, {
                    id: course.id,
                    name: course.name,
                    students: course.students,
                    studentsType: typeof course.students
                  });
                });
              }
            }
            
            callback(response);
          } else {
            console.error("SQL执行返回空结果");
            callback({ error: "SQL执行返回空结果" });
          }
        });

        // 释放连接
        connection.release(function (error) {
          if (error) {
            console.error("连接释放错误", error);
          } else {
            console.log("数据库连接已释放");
          }
        });
      }
    });
  } else {
    console.error("usselect 参数不足");
    callback({ error: "参数不足" });
  }
}

module.exports = { usselect, us };