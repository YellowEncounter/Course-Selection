<template>
  <div class="admin-container">
    <div class="header">
      <h1>管理员后台</h1>
      <div class="user-info">
        <span>欢迎，{{ userInfo.name }}（管理员）</span>
        <button @click="logout" class="logout-btn">退出</button>
      </div>
    </div>

    <div class="content">
      <div class="card">
        <!-- 密码显示控制 -->
        <div class="password-control">
          <el-checkbox v-model="showAllPasswords">显示所有密码</el-checkbox>
          <el-button @click="togglePasswordVisibility" size="small" type="primary">
            {{ showAllPasswords ? '隐藏全部密码' : '显示全部密码' }}
          </el-button>
        </div>

        <div class="card-header">
          <h2>用户管理</h2>
          <button @click="openAddUserDialog" class="add-btn">新增用户</button>
        </div>

        <!-- 批量操作栏 -->
        <div v-if="selectedUsers.length > 0" class="batch-action-bar">
          <div class="batch-info">
            <i class="el-icon-warning"></i>
            <span>已选择 <strong>{{ selectedUsers.length }}</strong> 个用户</span>
            <span class="batch-role-tip">
              （{{ getSelectedRoleType() }}用户）
            </span>
          </div>
          <div class="batch-actions">
            <button 
              @click="batchChangeStatus" 
              class="batch-status-btn"
              :disabled="selectedUsers.length === 0"
            >
              批量{{ getBatchStatusAction() }}
            </button>
            <button 
              @click="batchDeleteUsers" 
              class="batch-delete-btn"
              :disabled="selectedUsers.length === 0 || hasMixedRoles"
            >
              批量删除
            </button>
            <button @click="clearSelection" class="cancel-batch-btn">
              取消选择
            </button>
          </div>
          <div v-if="hasMixedRoles" class="mixed-role-warning">
            <i class="el-icon-error"></i>
            <span>不能同时删除不同角色的用户，请选择同一类型的用户</span>
          </div>
        </div>

        <!-- 角色标签页 -->
        <div class="role-tabs">
          <button 
            :class="{active: activeRoleTab === 'admin'}" 
            @click="activeRoleTab = 'admin'"
          >
            管理员
          </button>
          <button 
            :class="{active: activeRoleTab === 'teacher'}" 
            @click="activeRoleTab = 'teacher'"
          >
            教师
          </button>
          <button 
            :class="{active: activeRoleTab === 'student'}" 
            @click="activeRoleTab = 'student'"
          >
            学生
          </button>
        </div>

        <!-- 用户列表 -->
        <el-table
          ref="userTable"
          :data="filteredUsers"
          border
          class="user-table"
          v-loading="loading"
          @selection-change="handleSelectionChange"
        >
          <!-- 批量选择列 -->
          <el-table-column 
            type="selection" 
            width="55"
            :selectable="checkSelectable"
          >
          </el-table-column>
          
          <el-table-column prop="id" label="用户ID" min-width="100">
            <template slot-scope="scope">
              <el-tag :type="getIdTagType(scope.row.role)">
                {{ scope.row.id }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="name" label="姓名" min-width="100"></el-table-column>
          
          <!-- 密码列 - 支持单独和全开显示 -->
          <el-table-column label="密码" min-width="150">
            <template slot-scope="scope">
              <el-input 
                v-model="scope.row.password" 
                :type="showAllPasswords || scope.row.showPassword ? 'text' : 'password'" 
                readonly
                class="password-input"
              >
                <template slot="suffix">
                  <i 
                    :class="showAllPasswords || scope.row.showPassword ? 'el-icon-view-off' : 'el-icon-view'" 
                    @click="toggleSinglePassword(scope.row)"
                    style="cursor: pointer"
                    :title="showAllPasswords || scope.row.showPassword ? '隐藏密码' : '显示密码'"
                  ></i>
                </template>
              </el-input>
            </template>
          </el-table-column>
          
          <!-- 状态列 - 新增 -->
          <el-table-column label="状态" width="100">
            <template slot-scope="scope">
              <el-switch
                v-model="scope.row.status"
                active-value="active"
                inactive-value="inactive"
                active-text="启用"
                inactive-text="停用"
                @change="changeUserStatus(scope.row)"
                :disabled="scope.row.id === 1"
              >
              </el-switch>
            </template>
          </el-table-column>
          
          <!-- 学院列 - 仅学生显示 -->
          <el-table-column v-if="activeRoleTab === 'student'" prop="college" label="学院" min-width="120"></el-table-column>
          
          <!-- 班级列 - 仅学生显示 -->
          <el-table-column v-if="activeRoleTab === 'student'" prop="class" label="班级" min-width="120"></el-table-column>
          
          <el-table-column prop="role" label="角色" width="100">
            <template slot-scope="scope">
              <el-tag :type="getRoleTagType(scope.row.role)">
                {{ getRoleName(scope.row.role) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200">
            <template slot-scope="scope">
              <!-- 系统超级管理员（ID=1）不可编辑/删除 -->
              <button 
                @click="editUser(scope.row)" 
                class="edit-btn"
                :disabled="scope.row.id === 1"
              >
                {{ scope.row.id === 1 ? '不可编辑' : '编辑' }}
              </button>
              <button 
                @click="deleteUser(scope.row.id)" 
                class="delete-btn"
                :disabled="scope.row.id === 1"
              >
                {{ scope.row.id === 1 ? '不可删除' : '删除' }}
              </button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 空状态提示 -->
        <div v-if="filteredUsers.length === 0 && !loading" class="empty-state">
          <i class="el-icon-user"></i>
          <p>暂无{{ getRoleName(activeRoleTab) }}用户</p>
        </div>
      </div>
    </div>

    <!-- 新增/编辑用户弹窗 -->
    <el-dialog :visible.sync="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="500px">
      <el-form :model="form" :rules="rules" ref="form" label-width="100px">
        <el-form-item 
          label="用户ID" 
          prop="id"
          :rules="form.role === 'student' ? [] : [{ required: true, message: '请输入用户ID', trigger: 'blur' }]"
        >
          <el-input 
            v-model="form.id" 
            :placeholder="form.role === 'student' ? '留空则自动生成' : '请输入ID'"
            :disabled="isEdit || (form.role === 'student' && !form.id)"
          >
            <template slot="suffix">
              <span v-if="form.role === 'admin'" class="id-tip">仅支持1-10</span>
              <span v-if="form.role === 'teacher'" class="id-tip">仅支持11-999</span>
              <span v-if="form.role === 'student'" class="id-tip">自动生成(1001+)</span>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名"></el-input>
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="form.password" 
            :type="showEditPassword ? 'text' : 'password'" 
            placeholder="请输入密码"
            :disabled="form.id === 1"
          >
            <template slot="suffix">
              <i 
                :class="showEditPassword ? 'el-icon-view-off' : 'el-icon-view'" 
                @click="showEditPassword = !showEditPassword"
                style="cursor: pointer"
              ></i>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" @change="handleRoleChange">
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="教师" value="teacher"></el-option>
            <el-option label="学生" value="student"></el-option>
          </el-select>
        </el-form-item>
        
        <!-- 状态选择 - 仅非管理员可编辑 -->
        <el-form-item label="状态" prop="status" v-if="form.role !== 'admin' || form.id !== 1">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="启用" value="active"></el-option>
            <el-option label="停用" value="inactive"></el-option>
          </el-select>
        </el-form-item>
        
        <!-- 学院和班级 - 仅学生显示 -->
        <el-form-item label="学院" prop="college" v-if="form.role === 'student'">
          <el-input v-model="form.college" placeholder="请输入学院"></el-input>
        </el-form-item>
        
        <el-form-item label="班级" prop="class" v-if="form.role === 'student'">
          <el-input v-model="form.class" placeholder="请输入班级"></el-input>
        </el-form-item>
      </el-form>
      
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import api from '@/axios-config';

export default {
  name: 'AdminDashboard',
  data() {
    return {
      userInfo: {},
      users: [],
      filteredUsers: [],
      loading: false,
      dialogVisible: false,
      isEdit: false,
      activeRoleTab: 'admin',
      selectedUsers: [],
      showAllPasswords: false,
      showEditPassword: false,
      form: {
        id: '',
        name: '',
        password: '',
        role: 'student',
        status: 'active',
        college: '',
        class: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入姓名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ],
        role: [
          { required: true, message: '请选择角色', trigger: 'change' }
        ],
        status: [
          { required: true, message: '请选择状态', trigger: 'change' }
        ]
      }
    };
  },
  
  computed: {
    hasMixedRoles() {
      if (this.selectedUsers.length <= 1) return false;
      const firstRole = this.selectedUsers[0].role;
      return !this.selectedUsers.every(user => user.role === firstRole);
    }
  },
  
  created() {
    this.userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    this.loadUsers();
  },
  
  methods: {
    async loadUsers() {
      this.loading = true;
      try {
        // 使用配置好的axios实例
        const api = require('@/axios-config').default;
        const response = await api.get('/api/pbl/getAllUsers');
        
        if (response.data.success) {
          this.users = response.data.data.map(user => ({
            ...user,
            showPassword: false
          }));
          this.filterUsers();
          console.log(`✅ 成功加载 ${this.users.length} 个用户`);
        } else {
          throw new Error(response.data.message || '加载用户失败');
        }
      } catch (error) {
        console.error('加载用户失败:', error);
        
        // 详细的错误提示
        let errorMessage = '加载用户失败';
        if (error.response) {
          errorMessage += ` (${error.response.status})`;
        } else if (error.solutions) {
          errorMessage += '\n\n请检查：\n' + error.solutions.join('\n');
        }
        
        this.$message.error(errorMessage);
      } finally {
        this.loading = false;
      }
    },
    
    filterUsers() {
      this.filteredUsers = this.users.filter(user => user.role === this.activeRoleTab);
    },
    
    openAddUserDialog() {
      this.isEdit = false;
      this.form = {
        id: '', // 学生ID默认为空（自动生成）
        name: '',
        password: '',
        role: 'student',
        status: 'active',
        college: '',
        class: ''
      };
      this.dialogVisible = true;
      this.showEditPassword = false;
      
      // 延迟执行表单验证更新
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate();
        }
      });
    },
    
    editUser(user) {
      this.isEdit = true;
      this.form = { ...user };
      this.dialogVisible = true;
      this.showEditPassword = false;
    },
    
    async saveUser() {
      try {
        await this.$refs.form.validate();
        
        // 构建提交数据
        const submitData = { ...this.form };
        
        // 如果是新增学生且ID为空，则不传递ID字段（让后端自动生成）
        if (!this.isEdit && submitData.role === 'student' && !submitData.id) {
          delete submitData.id;
        }
        
        // 使用配置化的axios
        const api = require('@/axios-config').default;
        
        if (this.isEdit) {
          // 更新用户
          const response = await api.post('/api/pbl/updateUser', submitData);
          if (response.data.success) {
            this.$message.success('更新用户成功');
            await this.loadUsers();
            this.dialogVisible = false;
          } else {
            throw new Error(response.data.message || '更新用户失败');
          }
        } else {
          // 新增用户
          const response = await api.post('/api/pbl/addUser', submitData);
          if (response.data.success) {
            const successMsg = response.data.data?.id 
              ? `新增用户成功，分配ID: ${response.data.data.id}`
              : '新增用户成功';
            this.$message.success(successMsg);
            await this.loadUsers();
            this.dialogVisible = false;
          } else {
            throw new Error(response.data.message || '新增用户失败');
          }
        }
      } catch (error) {
        console.error('保存用户失败:', error);
        
        // 详细的错误提示
        let errorMessage = '保存用户失败';
        if (error.response) {
          errorMessage += `: ${error.response.data?.message || error.response.statusText}`;
        } else if (error.solutions) {
          errorMessage += '\n\n请检查：\n' + error.solutions.join('\n');
        } else {
          errorMessage += `: ${error.message}`;
        }
        
        this.$message.error(errorMessage);
      }
    },
    
    async deleteUser(userId) {
      if (userId === 1) {
        this.$message.warning('超级管理员不能删除');
        return;
      }
      
      try {
        await this.$confirm('确认删除该用户？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        const api = require('@/axios-config').default;
        const response = await api.post('/api/pbl/deleteUser', { id: userId });
        if (response.data.success) {
          this.$message.success('删除用户成功');
          await this.loadUsers();
        } else {
          throw new Error(response.data.message || '删除用户失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除用户失败:', error);
          this.$message.error('删除用户失败');
        }
      }
    },
    
    async changeUserStatus(user) {
      if (user.id === 1) {
        this.$message.warning('超级管理员状态不能修改');
        return;
      }
      
      try {
        const response = await api.post('/api/pbl/changeUserStatus', {
          id: user.id,
          status: user.status
        });
        
        if (response.data.success) {
          this.$message.success(`用户状态已${user.status === 'active' ? '启用' : '停用'}`);
        } else {
          // 恢复状态
          user.status = user.status === 'active' ? 'inactive' : 'active';
        }
      } catch (error) {
        console.error('修改状态失败:', error);
        // 恢复状态
        user.status = user.status === 'active' ? 'inactive' : 'active';
        this.$message.error('修改状态失败');
      }
    },
    
    handleSelectionChange(selection) {
      this.selectedUsers = selection;
    },
    
    checkSelectable(row) {
      return row.id !== 1; // 超级管理员不可选择
    },
    
    clearSelection() {
      this.$refs.userTable.clearSelection();
    },
    
    async batchDeleteUsers() {
      if (this.selectedUsers.length === 0) return;
      
      try {
        await this.$confirm(`确认删除选中的 ${this.selectedUsers.length} 个用户？`, '批量删除', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        const ids = this.selectedUsers.map(user => user.id);
        const response = await api.post('/api/pbl/batchDeleteUsers', { ids });
        
        if (response.data.success) {
          this.$message.success('批量删除成功');
          await this.loadUsers();
          this.clearSelection();
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量删除失败:', error);
          this.$message.error('批量删除失败');
        }
      }
    },
    
    async batchChangeStatus() {
      if (this.selectedUsers.length === 0) return;
      
      try {
        const targetStatus = this.getBatchTargetStatus();
        const actionText = targetStatus === 'active' ? '启用' : '停用';
        
        await this.$confirm(`确认${actionText}选中的 ${this.selectedUsers.length} 个用户？`, `批量${actionText}`, {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        const ids = this.selectedUsers.map(user => user.id);
        const response = await api.post('/api/pbl/batchChangeStatus', { ids, status: targetStatus });
        
        if (response.data.success) {
          this.$message.success(`批量${actionText}成功`);
          await this.loadUsers();
          this.clearSelection();
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量修改状态失败:', error);
          this.$message.error('批量修改状态失败');
        }
      }
    },
    
    getBatchTargetStatus() {
      const hasActive = this.selectedUsers.some(user => user.status === 'active');
      const hasInactive = this.selectedUsers.some(user => user.status === 'inactive');
      
      // 如果有活跃和非活跃用户，默认设为活跃
      // 如果全是活跃，设为非活跃
      // 如果全是非活跃，设为活跃
      return hasActive && hasInactive ? 'active' : (hasActive ? 'inactive' : 'active');
    },
    
    getBatchStatusAction() {
      const targetStatus = this.getBatchTargetStatus();
      return targetStatus === 'active' ? '启用' : '停用';
    },
    
    togglePasswordVisibility() {
      this.showAllPasswords = !this.showAllPasswords;
      // 如果关闭全局显示，重置所有单独显示状态
      if (!this.showAllPasswords) {
        this.users.forEach(user => {
          this.$set(user, 'showPassword', false);
        });
      }
    },
    
    toggleSinglePassword(user) {
      // 如果全局显示已开启，关闭全局显示并切换单独显示
      if (this.showAllPasswords) {
        this.showAllPasswords = false;
        // 重置所有用户的单独显示状态
        this.users.forEach(u => {
          this.$set(u, 'showPassword', u.id === user.id);
        });
      } else {
        // 切换当前用户的单独显示状态
        this.$set(user, 'showPassword', !user.showPassword);
      }
    },
    
    getSelectedRoleType() {
      if (this.selectedUsers.length === 0) return '';
      const role = this.selectedUsers[0].role;
      const roleNames = {
        admin: '管理员',
        teacher: '教师',
        student: '学生'
      };
      return roleNames[role] || '';
    },
    
    handleRoleChange(role) {
      // 切换角色时处理ID字段
      if (role === 'student') {
        // 学生角色：清空ID，表示自动生成
        this.form.id = '';
        // 为学生设置默认的学院班级提示
        if (!this.form.college) this.form.college = '';
        if (!this.form.class) this.form.class = '';
      } else {
        // 非学生角色：需要手动输入ID
        this.form.id = '';
        // 清空学院班级（只有学生有这些字段）
        this.form.college = '';
        this.form.class = '';
      }
      
      // 触发表单验证更新
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.validateField('id');
        }
      });
    },
    
    getRoleName(role) {
      const roleNames = {
        admin: '管理员',
        teacher: '教师',
        student: '学生'
      };
      return roleNames[role] || '';
    },
    
    getRoleTagType(role) {
      const tagTypes = {
        admin: 'danger',
        teacher: 'warning',
        student: 'primary'
      };
      return tagTypes[role] || '';
    },
    
    getIdTagType(role) {
      if (role === 'admin') return 'danger';
      if (role === 'teacher') return 'warning';
      return '';
    },
    
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      this.$router.push('/login');
    }
  },
  
  watch: {
    activeRoleTab() {
      this.filterUsers();
      this.clearSelection();
    }
  }
};
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 20px 30px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header h1 {
  color: #2c3e50;
  font-size: 28px;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info span {
  color: #666;
  font-size: 14px;
}

.logout-btn {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.logout-btn:hover {
  background: #ff5252;
}

.content {
  max-width: 1400px;
  margin: 0 auto;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.password-control {
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.card-header h2 {
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
}

.add-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.add-btn:hover {
  background: #45a049;
}

.batch-action-bar {
  padding: 15px 20px;
  background: #fff3cd;
  border-bottom: 1px solid #ffeaa7;
}

.batch-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.batch-info span {
  margin-left: 5px;
}

.batch-role-tip {
  color: #666;
  margin-left: 10px;
  font-size: 12px;
}

.batch-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.batch-status-btn,
.batch-delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.batch-status-btn {
  background: #ffc107;
  color: #856404;
}

.batch-status-btn:hover:not(:disabled) {
  background: #e0a800;
}

.batch-delete-btn {
  background: #dc3545;
  color: white;
}

.batch-delete-btn:hover:not(:disabled) {
  background: #c82333;
}

.cancel-batch-btn {
  background: #6c757d;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-batch-btn:hover {
  background: #5a6268;
}

.mixed-role-warning {
  display: flex;
  align-items: center;
  color: #721c24;
  margin-top: 10px;
  font-size: 12px;
}

.mixed-role-warning i {
  margin-right: 5px;
}

.role-tabs {
  display: flex;
  background: #f8f9fa;
}

.role-tabs button {
  flex: 1;
  padding: 15px 20px;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
}

.role-tabs button:hover {
  background: #e9ecef;
}

.role-tabs button.active {
  background: white;
  border-bottom-color: #007bff;
  color: #007bff;
  font-weight: 600;
}

.user-table {
  width: 100%;
}

.user-table .el-input__suffix {
  right: 5px;
}

.password-input {
  font-family: monospace;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 15px;
}

.id-tip {
  font-size: 12px;
  color: #999;
}

.edit-btn,
.delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;
  font-size: 12px;
  transition: all 0.3s;
}

.edit-btn {
  background: #17a2b8;
  color: white;
}

.edit-btn:hover:not(:disabled) {
  background: #138496;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.delete-btn:hover:not(:disabled) {
  background: #c82333;
}

.edit-btn:disabled,
.delete-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>