<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="title">选课系统</h2>
      <p class="subtitle">请登录您的账号</p>
      
      <el-form :model="loginForm" :rules="rules" ref="loginForm" class="login-form">
        <el-form-item prop="userid">
          <el-input v-model="loginForm.userid" placeholder="用户ID"></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="密码"></el-input>
        </el-form-item>
        <el-form-item prop="role">
          <el-select v-model="loginForm.role" placeholder="选择角色">
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="教师" value="teacher"></el-option>
            <el-option label="学生" value="student"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <button @click="handleLogin" class="login-btn">登录</button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { Message } from 'element-ui';
import { adminAPI, teacherAPI, studentAPI } from '@/api/user';

export default {
  data() {
    return {
      loginForm: {
        userid: '',
        password: '',
        role: ''
      },
      rules: {
        userid: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
        role: [{ required: true, message: '请选择角色', trigger: 'change' }]
      }
    };
  },
  methods: {
    async handleLogin() {
      this.$refs.loginForm.validate(async valid => {
        if (valid) {
          try {
            let api;
            if (this.loginForm.role === 'admin') api = adminAPI;
            else if (this.loginForm.role === 'teacher') api = teacherAPI;
            else api = studentAPI;

            // 获取所有用户数据
            const response = await api.get();
            const users = response.data || [];
            
            // 查找匹配的用户
            const user = users.find(u => 
              u.id == this.loginForm.userid && 
              u.password === this.loginForm.password
            );
            
            if (user) {
              const userInfo = {
                id: user.id,
                name: user.name,
                role: this.loginForm.role
              };
              
              this.$store.commit('setUserInfo', userInfo);
              this.$router.push(`/${this.loginForm.role}`);
              Message.success('登录成功');
            } else {
              Message.error('用户ID、密码或角色不正确');
            }
          } catch (error) {
            Message.error('登录失败：' + error.message);
          }
        }
      });
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f9f7f7;
}

.login-card {
  background-color: white;
  padding: 2.5rem;
  border-radius: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.title {
  color: #333;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #999;
  margin-bottom: 2rem;
  font-size: 1rem;
}

.login-btn {
  width: 100%;
  padding: 0.8rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-btn:hover {
  background-color: #359e75;
}
</style>