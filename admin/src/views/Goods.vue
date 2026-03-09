<template>
  <div class="goods-container">
    <div class="header-action">
      <el-button type="primary" icon="Plus" @click="dialogVisible = true">发布新产品</el-button>
      <div class="search-box">
        <el-input placeholder="搜索商品名称/店名..." v-model="searchKey" class="w-250 m-2">
          <template #prefix>
            <el-icon class="el-input__icon"><search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 演示数据表格 -->
    <el-table :data="tableData" border style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="货号" width="80" />
      <el-table-column label="商品封面" width="120">
        <template #default="scope">
          <el-image 
            style="width: 80px; height: 80px" 
            :src="scope.row.cover" 
            fit="cover" 
            class="cover-radius"
          />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="商品名称" min-width="180" />
      <el-table-column prop="price" label="零售价(￥)" width="100" />
      <el-table-column prop="commission" label="推销返佣(￥)" width="120" />
      <el-table-column prop="stock" label="库存" width="100" />
      <el-table-column prop="category" label="分类" width="120" />
      
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === '在售' ? 'success' : 'info'">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="180" fixed="right">
        <template #default="scope">
          <el-button size="small" type="primary" link>编辑规格</el-button>
          <el-button size="small" type="danger" link>下架</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器 -->
    <div class="pagination-block">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="10"
        background
        layout="prev, pager, next, total"
        :total="80"
      />
    </div>

    <!-- 新建商品对话框模拟 -->
    <el-dialog v-model="dialogVisible" title="🌟 极速发布上架" width="50%">
      <el-form label-width="100px">
        <el-form-item label="商品名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="分类选项卡">
          <el-select v-model="form.category" placeholder="请选择瀑布流出现位置">
            <el-option label="高佣推荐" value="hot" />
            <el-option label="健康食品" value="food" />
          </el-select>
        </el-form-item>
        <el-row>
          <el-col :span="11">
            <el-form-item label="售价 (￥)">
              <el-input-number v-model="form.price" :precision="2" :step="0.1" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="11" :offset="2">
            <el-form-item label="返佣 (￥)">
              <el-input-number v-model="form.commission" :precision="2" :step="0.1" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="顶图照">
          <el-upload
            class="upload-demo"
            drag
            action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
            multiple
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽商品主图到这儿，或 <em>点击选取</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                限 jpg/png 文件，请勿超过 2MB 大小 (将自动直传云端)
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="dialogVisible = false">
            全网发布
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Plus, Search, UploadFilled } from '@element-plus/icons-vue'

const dialogVisible = ref(false)
const searchKey = ref('')
const loading = ref(false)
const currentPage = ref(1)

const form = ref({
  name: '',
  category: '',
  price: 0,
  commission: 0
})

// 展示用的演示假数据
const tableData = ref([
  { id: 10001, cover: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80', title: '特级新疆阿克苏冰糖心苹果10斤装', price: '49.90', commission: '8.50', stock: 1250, category: '健康食品', status: '在售' },
  { id: 10002, cover: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=200&q=80', title: '智利进口原切西冷牛排 5片尝鲜', price: '99.00', commission: '25.00', stock: 50, category: '高佣推荐', status: '在售' },
  { id: 10003, cover: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=200&q=80', title: 'Apple Watch Series 9 智能手表', price: '2999.00', commission: '150.00', stock: 12, category: '高佣推荐', status: '售罄' }
])
</script>

<style scoped>
.goods-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
}
.header-action {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
.w-250 { width: 250px; }
.cover-radius { border-radius: 4px; }
.pagination-block { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
