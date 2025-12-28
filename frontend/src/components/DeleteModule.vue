<template>
  <div class="delete-module">
    <!-- 单项删除操作 -->
    <div v-if="showSingleDelete" class="single-delete-section">
      <h3 class="section-title">
        <i class="el-icon-delete"></i>
        单项删除
      </h3>
      <p class="section-description">点击每行数据右侧的删除按钮，逐条删除特定数据项</p>
      
      <!-- 单项删除按钮示例 -->
      <div class="single-delete-demo">
        <div v-for="item in demoData" :key="item.id" class="demo-row">
          <span class="demo-name">{{ item.name }}</span>
          <button 
            @click="handleSingleDelete(item)"
            class="single-delete-btn"
            :disabled="item.id === 1"
          >
            <i class="el-icon-delete"></i>
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 批量删除操作 -->
    <div v-if="showBatchDelete" class="batch-delete-section">
      <h3 class="section-title">
        <i class="el-icon-s-operation"></i>
        批量删除
      </h3>
      <p class="section-description">通过复选框选择多个条目，在顶部操作栏进行批量删除</p>
      
      <!-- 批量删除操作栏 -->
      <div v-if="selectedItems.length > 0" class="batch-action-bar">
        <div class="batch-info">
          <i class="el-icon-warning"></i>
          <span>已选择 <strong>{{ selectedItems.length }}</strong> 个数据项</span>
          <span v-if="hasMixedTypes" class="batch-type-warning">
            （包含不同类型数据，不能混合删除）
          </span>
          <span v-else class="batch-type-info">
            （{{ getSelectedTypeName() }}数据）
          </span>
        </div>
        <div class="batch-actions">
          <button 
            @click="handleBatchDelete" 
            class="batch-delete-btn"
            :disabled="hasMixedTypes"
          >
            <i class="el-icon-delete"></i>
            批量删除 ({{ selectedItems.length }})
          </button>
          <button @click="clearSelection" class="cancel-batch-btn">
            <i class="el-icon-close"></i>
            取消选择
          </button>
        </div>
      </div>

      <!-- 批量删除表格示例 -->
      <div class="batch-delete-demo">
        <div class="demo-table">
          <div class="table-header">
            <div class="header-checkbox">
              <input 
                type="checkbox" 
                :checked="isAllSelected"
                @change="toggleSelectAll"
                :disabled="hasMixedTypes"
              >
            </div>
            <div class="header-name">名称</div>
            <div class="header-type">类型</div>
            <div class="header-actions">操作</div>
          </div>
          
          <div 
            v-for="item in demoData" 
            :key="item.id" 
            class="table-row"
            :class="{ selected: isSelected(item) }"
          >
            <div class="row-checkbox">
              <input 
                type="checkbox" 
                :checked="isSelected(item)"
                @change="toggleSelect(item)"
                :disabled="item.id === 1"
              >
            </div>
            <div class="row-name">{{ item.name }}</div>
            <div class="row-type">
              <span :class="['type-tag', item.type]">{{ item.type }}</span>
            </div>
            <div class="row-actions">
              <button 
                @click="handleSingleDelete(item)"
                class="single-delete-btn"
                :disabled="item.id === 1"
              >
                <i class="el-icon-delete"></i>
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <el-dialog
      :visible.sync="deleteDialogVisible"
      :title="deleteDialogTitle"
      width="400px"
      class="delete-confirm-dialog"
    >
      <div class="dialog-content">
        <i class="el-icon-warning" style="color: #e6a23c; font-size: 24px;"></i>
        <p>{{ deleteDialogMessage }}</p>
        <div v-if="isBatchDelete" class="selected-items-list">
          <p><strong>将删除以下数据：</strong></p>
          <ul>
            <li v-for="item in selectedItems" :key="item.id">
              {{ item.name }} ({{ item.type }})
            </li>
          </ul>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <button @click="deleteDialogVisible = false" class="cancel-btn">
          取消
        </button>
        <button @click="confirmDelete" class="confirm-delete-btn">
          确定删除
        </button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'DeleteModule',
  props: {
    // 显示模式配置
    showSingleDelete: {
      type: Boolean,
      default: true
    },
    showBatchDelete: {
      type: Boolean,
      default: true
    },
    // 数据源
    data: {
      type: Array,
      default: () => []
    },
    // 删除回调函数
    onDelete: {
      type: Function,
      default: () => {}
    }
  },
  data() {
    return {
      selectedItems: [],
      deleteDialogVisible: false,
      currentDeleteItem: null,
      isBatchDelete: false,
      demoData: [
        { id: 1, name: '系统管理员', type: '管理员', disabled: true },
        { id: 2, name: '张老师', type: '教师' },
        { id: 3, name: '李老师', type: '教师' },
        { id: 4, name: '黄同学', type: '学生' },
        { id: 5, name: '王同学', type: '学生' }
      ]
    };
  },
  computed: {
    // 是否全选
    isAllSelected() {
      const selectableItems = this.demoData.filter(item => item.id !== 1);
      return selectableItems.length > 0 && 
             this.selectedItems.length === selectableItems.length;
    },
    // 检查是否选择了不同类型的数据
    hasMixedTypes() {
      if (this.selectedItems.length === 0) return false;
      const types = [...new Set(this.selectedItems.map(item => item.type))];
      return types.length > 1;
    }
  },
  methods: {
    // 单项删除处理
    handleSingleDelete(item) {
      if (item.id === 1) {
        this.$message.warning('系统超级管理员不可删除');
        return;
      }
      
      this.currentDeleteItem = item;
      this.isBatchDelete = false;
      this.deleteDialogTitle = '确认删除';
      this.deleteDialogMessage = `确定要删除"${item.name}"吗？此操作不可撤销。`;
      this.deleteDialogVisible = true;
    },
    
    // 批量删除处理
    handleBatchDelete() {
      if (this.selectedItems.length === 0) {
        this.$message.warning('请选择要删除的数据项');
        return;
      }
      
      if (this.hasMixedTypes) {
        this.$message.error('不能同时删除不同类型的数据项');
        return;
      }
      
      this.isBatchDelete = true;
      this.deleteDialogTitle = '批量删除确认';
      this.deleteDialogMessage = `确定要删除这 ${this.selectedItems.length} 个数据项吗？此操作不可撤销。`;
      this.deleteDialogVisible = true;
    },
    
    // 确认删除
    confirmDelete() {
      if (this.isBatchDelete) {
        // 批量删除
        this.onDelete(this.selectedItems);
        this.clearSelection();
        this.$message.success(`成功删除 ${this.selectedItems.length} 个数据项`);
      } else {
        // 单项删除
        this.onDelete([this.currentDeleteItem]);
        this.$message.success('删除成功');
      }
      
      this.deleteDialogVisible = false;
      this.currentDeleteItem = null;
    },
    
    // 选择单个项目
    toggleSelect(item) {
      if (item.id === 1) return;
      
      const index = this.selectedItems.findIndex(selected => selected.id === item.id);
      if (index > -1) {
        this.selectedItems.splice(index, 1);
      } else {
        this.selectedItems.push(item);
      }
    },
    
    // 全选/取消全选
    toggleSelectAll() {
      const selectableItems = this.demoData.filter(item => item.id !== 1);
      
      if (this.isAllSelected) {
        this.selectedItems = [];
      } else {
        this.selectedItems = [...selectableItems];
      }
    },
    
    // 检查项目是否被选中
    isSelected(item) {
      return this.selectedItems.some(selected => selected.id === item.id);
    },
    
    // 清空选择
    clearSelection() {
      this.selectedItems = [];
    },
    
    // 获取选中数据的类型名称
    getSelectedTypeName() {
      if (this.selectedItems.length === 0) return '';
      const types = [...new Set(this.selectedItems.map(item => item.type))];
      if (types.length === 1) {
        return types[0];
      }
      return '混合';
    }
  }
};
</script>

<style scoped>
.delete-module {
  max-width: 800px;
  margin: 0 auto;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.section-title i {
  color: #ff9800;
}

.section-description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

/* 单项删除样式 */
.single-delete-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.single-delete-demo {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.demo-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #f5f5f5;
}

.demo-row:last-child {
  border-bottom: none;
}

.demo-name {
  font-weight: 500;
}

.single-delete-btn {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.3s;
}

.single-delete-btn:hover:not(:disabled) {
  background: #ffcdd2;
}

.single-delete-btn:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

/* 批量删除样式 */
.batch-delete-section {
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.batch-action-bar {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border: 1px solid #ffb74d;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  position: relative;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e65100;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.batch-info i {
  font-size: 1.1rem;
}

.batch-type-warning {
  color: #f44336;
  font-size: 0.9rem;
}

.batch-type-info {
  color: #ff9800;
  font-size: 0.9rem;
}

.batch-actions {
  display: flex;
  gap: 0.8rem;
}

.batch-delete-btn {
  background: #f44336;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
}

.batch-delete-btn:hover:not(:disabled) {
  background: #d32f2f;
  transform: translateY(-1px);
}

.batch-delete-btn:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
}

.cancel-batch-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
}

.cancel-batch-btn:hover {
  background: #e0e0e0;
}

/* 表格样式 */
.demo-table {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.table-header, .table-row {
  display: grid;
  grid-template-columns: 60px 1fr 100px 120px;
  align-items: center;
  padding: 0.8rem 1rem;
}

.table-header {
  background: #f5f5f5;
  font-weight: 600;
  border-bottom: 1px solid #e0e0e0;
}

.table-row {
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.3s;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: #f9f9f9;
}

.table-row.selected {
  background: #e3f2fd;
}

.header-checkbox, .row-checkbox {
  text-align: center;
}

.type-tag {
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.type-tag.管理员 {
  background: #ffebee;
  color: #c62828;
}

.type-tag.教师 {
  background: #e3f2fd;
  color: #1565c0;
}

.type-tag.学生 {
  background: #e8f5e9;
  color: #2e7d32;
}

/* 对话框样式 */
.dialog-content {
  text-align: center;
  padding: 1rem 0;
}

.dialog-content p {
  margin: 1rem 0;
  line-height: 1.5;
}

.selected-items-list {
  text-align: left;
  margin-top: 1rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
}

.selected-items-list ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.selected-items-list li {
  margin: 0.3rem 0;
}

.dialog-footer {
  text-align: center;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  padding: 0.6rem 1.5rem;
  border-radius: 20px;
  cursor: pointer;
  margin-right: 0.8rem;
  transition: all 0.3s;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.confirm-delete-btn {
  background: #f44336;
  color: white;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.confirm-delete-btn:hover {
  background: #d32f2f;
}
</style>