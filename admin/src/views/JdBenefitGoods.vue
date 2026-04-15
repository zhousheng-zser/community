<template>
  <div class="page-wrap">
    <!-- 营销资源星系可视化面板 -->
    <div class="marketing-galaxy">
      <div class="galaxy-header">
        <h3 class="glow-title"><el-icon class="pulse-icon"><MagicStick /></el-icon> 营销矩阵可视化雷达</h3>
        <span class="sync-tag"><el-icon><RefreshRight /></el-icon> 实时聚合</span>
      </div>

      <div class="galaxy-container">
        <!-- CSS Rotating Galaxy -->
        <div class="orbit orbit-1">
          <div class="planet p-1" title="优惠券激活"></div>
        </div>
        <div class="orbit orbit-2">
          <div class="planet p-2" title="爆款推送"></div>
          <div class="planet p-3" title="限时折扣"></div>
        </div>
        <div class="core-sun">
          <span>京东<br/>惠民矩阵</span>
        </div>
        
        <!-- Summary Stats overlay -->
        <div class="stats-overlay left">
          <div class="stat-item"><span class="lbl">活跃策略数</span><span class="val text-blue">24</span></div>
          <div class="stat-item"><span class="lbl">转化效能评估</span><span class="val text-green">A+</span></div>
        </div>
        <div class="stats-overlay right">
          <div class="stat-item"><span class="lbl">拦截异常</span><span class="val text-orange">0</span></div>
          <div class="stat-item"><span class="lbl">当前场景总数</span><span class="val text-purple">{{ total || 0 }}</span></div>
        </div>
      </div>
    </div>

    <!-- 数据表主体 -->
    <div class="content-box">
      <div class="toolbar">
      <el-select v-model="scene" placeholder="场景" style="width: 160px" @change="loadList">
        <el-option label="惠民卡 benefit_card" value="benefit_card" />
      </el-select>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增商品</el-button>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column label="主图" width="100">
        <template #default="{ row }">
          <el-image
            :src="row.image_url"
            fit="cover"
            style="width: 56px; height: 56px; border-radius: 4px"
            :preview-src-list="[row.image_url]"
            preview-teleported
          />
        </template>
      </el-table-column>
      <el-table-column prop="sku_id" label="SKU" width="130" show-overflow-tooltip />
      <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
      <el-table-column prop="price" label="价格" width="88" />
      <el-table-column prop="rebate_amount" label="返利" width="80" />
      <el-table-column prop="sort_order" label="排序" width="72" />
      <el-table-column label="状态" width="88">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="推广链接" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">
          <el-link :href="row.spread_url" target="_blank" type="primary">打开</el-link>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

      <div class="pagination">
        <el-pagination
          class="tech-pager"
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="loadList"
          @size-change="loadList"
        />
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑京东惠民卡商品' : '新增京东惠民卡商品'"
      width="560px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="场景" prop="scene">
          <el-input v-model="form.scene" placeholder="benefit_card" />
        </el-form-item>
        <el-form-item label="京东 SKU" prop="sku_id">
          <el-input v-model="form.sku_id" :disabled="isEdit" placeholder="字符串，勿用科学计数法" />
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="主图 URL" prop="image_url">
          <el-input v-model="form.image_url" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="推广链接" prop="spread_url">
          <el-input v-model="form.spread_url" type="textarea" :rows="2" placeholder="京挑客推广 URL" />
        </el-form-item>
        <el-form-item label="展示价" prop="price">
          <el-input v-model="form.price" placeholder="可选" />
        </el-form-item>
        <el-form-item label="返利金额" prop="rebate_amount">
          <el-input v-model="form.rebate_amount" placeholder="可选" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="form.sort_order" :min="0" :max="99999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">上架</el-radio>
            <el-radio :label="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus, MagicStick, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const scene = ref('benefit_card')

const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)

const form = reactive({
  scene: 'benefit_card',
  sku_id: '',
  title: '',
  image_url: '',
  spread_url: '',
  price: '',
  rebate_amount: '',
  sort_order: 0,
  status: 1
})

const rules = {
  scene: [{ required: true, message: '必填', trigger: 'blur' }],
  sku_id: [{ required: true, message: '必填', trigger: 'blur' }],
  title: [{ required: true, message: '必填', trigger: 'blur' }],
  image_url: [{ required: true, message: '必填', trigger: 'blur' }],
  spread_url: [{ required: true, message: '必填', trigger: 'blur' }]
}

async function loadList() {
  loading.value = true
  try {
    const res = await request.get('/admin/jd-benefit-goods', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        scene: scene.value
      }
    })
    const payload = res.data || {}
    tableData.value = payload.list || []
    total.value = payload.total || 0
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.scene = 'benefit_card'
  form.sku_id = ''
  form.title = ''
  form.image_url = ''
  form.spread_url = ''
  form.price = ''
  form.rebate_amount = ''
  form.sort_order = 0
  form.status = 1
  editId.value = null
  formRef.value?.resetFields?.()
}

function openCreate() {
  isEdit.value = false
  resetForm()
  form.scene = scene.value
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  editId.value = row.id
  form.scene = row.scene
  form.sku_id = row.sku_id
  form.title = row.title
  form.image_url = row.image_url
  form.spread_url = row.spread_url
  form.price = row.price || ''
  form.rebate_amount = row.rebate_amount || ''
  form.sort_order = row.sort_order
  form.status = row.status
  dialogVisible.value = true
}

async function submitForm() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const body = {
      scene: form.scene,
      sku_id: form.sku_id,
      title: form.title,
      image_url: form.image_url,
      spread_url: form.spread_url,
      price: form.price,
      rebate_amount: form.rebate_amount,
      sort_order: form.sort_order,
      status: form.status
    }
    if (isEdit.value && editId.value) {
      await request.put(`/admin/jd-benefit-goods/${editId.value}`, body)
      ElMessage.success('已保存')
    } else {
      await request.post('/admin/jd-benefit-goods', body)
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    await loadList()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function onDelete(row) {
  ElMessageBox.confirm(`确定删除「${row.title}」？`, '确认删除', {
    type: 'warning'
  })
    .then(async () => {
      await request.delete(`/admin/jd-benefit-goods/${row.id}`)
      ElMessage.success('已删除')
      await loadList()
    })
    .catch(() => {})
}

onMounted(() => {
  loadList()
})
</script>
<style scoped>
.page-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 400px;
}

/* 宇宙星系可视化面板 */
.marketing-galaxy {
  background: radial-gradient(circle at center, #1b2735 0%, #090a0f 100%);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 0 50px rgba(139, 92, 246, 0.05);
  position: relative;
  overflow: hidden;
}
.galaxy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 10;
}
.glow-title {
  margin: 0;
  font-size: 16px;
  color: #c4b5fd;
  display: flex;
  align-items: center;
  gap: 8px;
  text-shadow: 0 0 10px rgba(196,181,253,0.5);
}
.pulse-icon {
  font-size: 20px;
  color: #fca5a5;
  animation: pulseLight 2s infinite alternate;
}
@keyframes pulseLight { to { transform: scale(1.1); text-shadow: 0 0 15px #fca5a5; } }

.sync-tag {
  font-size: 12px;
  background: rgba(52, 211, 153, 0.1);
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.3);
  padding: 4px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 轨道动画 */
.galaxy-container {
  position: relative;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
}
.core-sun {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, #fcd34d 0%, #fbbf24 60%, transparent 100%);
  box-shadow: 0 0 40px rgba(251,191,36,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 12px;
  font-weight: 900;
  color: #78350f;
  z-index: 2;
  animation: breathing 4s infinite alternate;
}
@keyframes breathing { to { box-shadow: 0 0 60px rgba(251,191,36,0.9); transform: scale(1.05); } }

.orbit {
  position: absolute;
  top: 50%; left: 50%;
  border: 1px dashed rgba(255,255,255,0.15);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: rotate linear infinite;
  z-index: 1;
}
.orbit-1 { width: 140px; height: 140px; animation-duration: 10s; }
.orbit-2 { width: 220px; height: 220px; animation-duration: 20s; animation-direction: reverse; }

@keyframes rotate { 100% { transform: translate(-50%, -50%) rotate(360deg); } }

.planet {
  position: absolute;
  border-radius: 50%;
  top: 0; left: 50%;
  transform: translate(-50%, -50%);
}
.p-1 { width: 14px; height: 14px; background: #60a5fa; box-shadow: 0 0 10px #60a5fa; }
.p-2 { width: 18px; height: 18px; background: #a78bfa; box-shadow: 0 0 15px #a78bfa; left: 80%; top: 10%; }
.p-3 { width: 12px; height: 12px; background: #34d399; box-shadow: 0 0 10px #34d399; left: 20%; top: 90%; }

/* Stats Overlay */
.stats-overlay {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 3;
}
.stats-overlay.left { left: 40px; }
.stats-overlay.right { right: 40px; align-items: flex-end; }

.stat-item { display: flex; flex-direction: column; gap: 4px; }
.stat-item .lbl { font-size: 12px; color: #94a3b8; }
.stat-item .val { font-size: 24px; font-weight: bold; font-family: 'Helvetica Neue', Arial, sans-serif; }
.text-blue { color: #60a5fa; text-shadow: 0 0 10px rgba(96,165,250,0.3); }
.text-green { color: #34d399; text-shadow: 0 0 10px rgba(52,211,153,0.3); }
.text-orange { color: #fbbf24; text-shadow: 0 0 10px rgba(251,191,36,0.3); }
.text-purple { color: #c084fc; text-shadow: 0 0 10px rgba(192,132,252,0.3); }

/* 背景与数据表 */
.content-box {
  background: #fff;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
}
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
