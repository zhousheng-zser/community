<template>
  <div class="sp-container">
    <div class="header-box">
      <h3>🏪 直约服务商管理</h3>
      <el-alert title="管理直约服务商档案、服务项目及订单。参考本地集市管理逻辑。" type="info" show-icon />
    </div>

    <el-tabs v-model="activeTab" @tab-change="onTabChange">

      <!-- ===== 服务商档案 ===== -->
      <el-tab-pane label="服务商档案" name="profiles">
        <div class="toolbar">
          <el-select v-model="profileFilter.status" placeholder="状态筛选" clearable style="width:130px" @change="fetchProfiles">
            <el-option label="启用" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
          <el-button type="primary" @click="openCreateProfile">+ 新建服务商</el-button>
        </div>

        <el-table :data="profileList" border stripe v-loading="profileLoading" style="width:100%">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column label="店铺封面" width="90">
            <template #default="s">
              <el-image v-if="s.row.shop_front_url" :src="img(s.row.shop_front_url)"
                style="width:60px;height:60px;border-radius:4px" fit="cover"
                :preview-src-list="[img(s.row.shop_front_url)]" />
              <span v-else class="empty">无图</span>
            </template>
          </el-table-column>
          <el-table-column prop="shop_name" label="店铺名称" min-width="160" />
          <el-table-column prop="contact_name" label="联系人" width="110" />
          <el-table-column prop="phone" label="手机" width="130" />
          <el-table-column prop="community_id" label="小区ID" width="85" />
          <el-table-column prop="service_count" label="服务数" width="80" />
          <el-table-column label="状态" width="90">
            <template #default="s">
              <el-tag :type="s.row.status === 'active' ? 'success' : 'info'">
                {{ s.row.status === 'active' ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="230" fixed="right">
            <template #default="s">
              <el-button size="small" @click="openProfileDetail(s.row)">详情</el-button>
              <el-button size="small" type="primary" @click="openEditProfile(s.row)">编辑</el-button>
              <el-button size="small" @click="goManageServices(s.row)">服务项目</el-button>
              <el-button size="small" :type="s.row.status === 'active' ? 'danger' : 'success'"
                @click="toggleProfileStatus(s.row)">
                {{ s.row.status === 'active' ? '停用' : '启用' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="profilePage" v-model:page-size="profilePageSize"
          :total="profileTotal" layout="prev, pager, next, sizes, total" :page-sizes="[10, 20, 50]"
          @current-change="fetchProfiles" @size-change="fetchProfiles" style="margin-top:14px" />
      </el-tab-pane>

      <!-- ===== 服务项目 ===== -->
      <el-tab-pane label="服务项目" name="services">
        <div class="toolbar">
          <el-select v-model="selectedProviderId" placeholder="选择服务商" clearable filterable
            style="width:220px" @change="fetchServices">
            <el-option v-for="p in allProviders" :key="p.id" :label="p.shop_name" :value="p.id" />
          </el-select>
          <el-button type="primary" :disabled="!selectedProviderId" @click="openCreateService">+ 新增服务</el-button>
        </div>
        <el-table :data="serviceList" border stripe v-loading="serviceLoading" style="width:100%">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column label="封面" width="80">
            <template #default="s">
              <el-image v-if="s.row.cover_image" :src="img(s.row.cover_image)"
                style="width:55px;height:55px;border-radius:4px" fit="cover"
                :preview-src-list="[img(s.row.cover_image)]" />
              <span v-else class="empty">无图</span>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="服务名称" min-width="160" />
          <el-table-column prop="sub_title" label="副标题" min-width="130" show-overflow-tooltip />
          <el-table-column prop="price" label="价格(元)" width="100" />
          <el-table-column prop="unit" label="单位" width="70" />
          <el-table-column prop="category_key" label="分类" width="110" />
          <el-table-column label="上架" width="80">
            <template #default="s">
              <el-tag :type="s.row.is_published ? 'success' : 'info'">
                {{ s.row.is_published ? '已上架' : '已下架' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="s">
              <el-button size="small" type="primary" @click="openEditService(s.row)">编辑</el-button>
              <el-button size="small" :type="s.row.is_published ? 'warning' : 'success'"
                @click="toggleServicePublish(s.row)">
                {{ s.row.is_published ? '下架' : '上架' }}
              </el-button>
              <el-button size="small" type="danger" plain @click="confirmDeleteService(s.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ===== 订单管理 ===== -->
      <el-tab-pane label="服务订单" name="orders">
        <div class="toolbar">
          <el-select v-model="orderFilter.status" placeholder="订单状态" clearable style="width:160px" @change="fetchOrders">
            <el-option label="待接单" value="pending_accept" />
            <el-option label="待上门" value="paid_pending_dispatch" />
            <el-option label="服务中" value="in_service" />
            <el-option label="待确认" value="pending_user_confirm" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
          <el-button @click="fetchOrders">刷新</el-button>
        </div>

        <el-table :data="orderList" border stripe v-loading="orderLoading" style="width:100%">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="order_no" label="订单号" width="160" show-overflow-tooltip />
          <el-table-column label="服务" width="160">
            <template #default="s">{{ (s.row.service && s.row.service.title) || s.row.goods_name || '-' }}</template>
          </el-table-column>
          <el-table-column label="用户" width="130">
            <template #default="s">{{ (s.row.buyer && (s.row.buyer.nickname || s.row.buyer.phone)) || '-' }}</template>
          </el-table-column>
          <el-table-column prop="amount" label="金额(元)" width="100" />
          <el-table-column label="预约时间" width="160">
            <template #default="s">{{ fmt(s.row.appointment_time) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="130">
            <template #default="s">
              <el-tag :type="statusTagType(s.row.status)">{{ statusLabel(s.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="下单时间" width="160">
            <template #default="s">{{ fmt(s.row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="s">
              <el-button size="small" @click="openOrderDetail(s.row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="orderPage" v-model:page-size="orderPageSize"
          :total="orderTotal" layout="prev, pager, next, sizes, total" :page-sizes="[10, 20, 50]"
          @current-change="fetchOrders" @size-change="fetchOrders" style="margin-top:14px" />
      </el-tab-pane>

    </el-tabs>

    <!-- ===== 新建/编辑服务商 弹窗 ===== -->
    <el-dialog v-model="profileDialogVisible" :title="editingProfile ? '编辑服务商' : '新建服务商'" width="560px">
      <el-form :model="profileForm" label-width="100px">
        <el-form-item label="店铺名称" required>
          <el-input v-model="profileForm.shop_name" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="profileForm.contact_name" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="profileForm.phone" />
        </el-form-item>
        <el-form-item label="绑定小区ID">
          <el-input v-model="profileForm.community_id" placeholder="如 1（合川路地铁站）" />
        </el-form-item>
        <el-form-item label="绑定用户ID">
          <el-input v-model="profileForm.user_id" placeholder="工作台登录的用户ID" />
        </el-form-item>
        <el-form-item label="店铺封面URL">
          <el-input v-model="profileForm.shop_front_url" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="profileForm.description" type="textarea" rows="2" />
        </el-form-item>
        <el-form-item label="状态" v-if="editingProfile">
          <el-select v-model="profileForm.status">
            <el-option label="启用" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="profileDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>

    <!-- ===== 服务商详情 弹窗 ===== -->
    <el-dialog v-model="profileDetailVisible" title="服务商详情" width="600px">
      <el-descriptions :column="1" border v-if="detailProfile">
        <el-descriptions-item label="ID">{{ detailProfile.id }}</el-descriptions-item>
        <el-descriptions-item label="店铺名称">{{ detailProfile.shop_name }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ detailProfile.contact_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机">{{ detailProfile.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="小区ID">{{ detailProfile.community_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="绑定用户">
          {{ (detailProfile.user && (detailProfile.user.nickname || detailProfile.user.phone)) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailProfile.status === 'active' ? 'success' : 'info'">
            {{ detailProfile.status === 'active' ? '启用' : '停用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="店铺封面">
          <el-image v-if="detailProfile.shop_front_url" :src="img(detailProfile.shop_front_url)"
            style="width:200px" fit="contain" :preview-src-list="[img(detailProfile.shop_front_url)]" />
          <span v-else>未上传</span>
        </el-descriptions-item>
        <el-descriptions-item label="营业执照">
          <el-image v-if="detailProfile.license_url" :src="img(detailProfile.license_url)"
            style="width:200px" fit="contain" :preview-src-list="[img(detailProfile.license_url)]" />
          <span v-else>未上传</span>
        </el-descriptions-item>
        <el-descriptions-item label="简介">{{ detailProfile.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="服务数">{{ detailProfile.service_count ?? '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- ===== 新建/编辑服务 弹窗 ===== -->
    <el-dialog v-model="serviceDialogVisible" :title="editingService ? '编辑服务项目' : '新增服务项目'" width="560px">
      <el-form :model="serviceForm" label-width="100px">
        <el-form-item label="服务名称" required>
          <el-input v-model="serviceForm.title" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="serviceForm.sub_title" />
        </el-form-item>
        <el-form-item label="详细描述">
          <el-input v-model="serviceForm.description" type="textarea" rows="3" />
        </el-form-item>
        <el-form-item label="价格(元)" required>
          <el-input v-model="serviceForm.price" type="number" />
        </el-form-item>
        <el-form-item label="计价单位">
          <el-input v-model="serviceForm.unit" placeholder="次/平米/小时…" />
        </el-form-item>
        <el-form-item label="分类Key">
          <el-input v-model="serviceForm.category_key" placeholder="如 clean/repair/green…" />
        </el-form-item>
        <el-form-item label="封面图URL">
          <el-input v-model="serviceForm.cover_image" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="上架状态">
          <el-switch v-model="serviceForm.is_published" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="serviceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveService">保存</el-button>
      </template>
    </el-dialog>

    <!-- ===== 订单详情 弹窗 ===== -->
    <el-dialog v-model="orderDetailVisible" title="订单详情" width="580px">
      <el-descriptions :column="1" border v-if="detailOrder">
        <el-descriptions-item label="订单号">{{ detailOrder.order_no || detailOrder.id }}</el-descriptions-item>
        <el-descriptions-item label="服务项目">
          {{ (detailOrder.service && detailOrder.service.title) || detailOrder.goods_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="用户">
          {{ (detailOrder.buyer && (detailOrder.buyer.nickname || detailOrder.buyer.phone)) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="联系人">{{ detailOrder.contact_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detailOrder.contact_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="金额">¥{{ detailOrder.amount }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ detailOrder.qty || 1 }}</el-descriptions-item>
        <el-descriptions-item label="预约时间">{{ fmt(detailOrder.appointment_time) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType(detailOrder.status)">{{ statusLabel(detailOrder.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付状态">{{ detailOrder.pay_status || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detailOrder.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ fmt(detailOrder.created_at) }}</el-descriptions-item>
        <el-descriptions-item v-if="detailOrder.fulfillment_meta" label="完工照片">
          <div v-if="proofImages(detailOrder).length">
            <el-image v-for="(u, i) in proofImages(detailOrder)" :key="i" :src="img(u)"
              style="width:100px;margin-right:6px" fit="cover"
              :preview-src-list="proofImages(detailOrder).map(img)" />
          </div>
          <span v-else>无</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request.js'

// ---- tab ----
const activeTab = ref('profiles')

// ---- utils ----
function fmt(d) {
  if (!d) return '-'
  const s = new Date(d).toLocaleString('zh-CN', { hour12: false })
  return s === 'Invalid Date' ? String(d) : s
}
function img(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const base = import.meta.env.VITE_API_BASE || '/api/v1'
  return base.replace(/\/api\/v1$/, '') + url
}
function proofImages(order) {
  try {
    const m = order.fulfillment_meta
    const obj = typeof m === 'string' ? JSON.parse(m) : (m || {})
    return Array.isArray(obj.proof_images) ? obj.proof_images : []
  } catch { return [] }
}

const STATUS_MAP = {
  pending_pay: { label: '待支付', type: 'info' },
  pending_accept: { label: '待接单', type: 'warning' },
  paid_pending_dispatch: { label: '待上门', type: 'warning' },
  dispatched: { label: '已派单', type: 'warning' },
  in_service: { label: '服务中', type: 'primary' },
  pending_user_confirm: { label: '待确认', type: 'primary' },
  completed: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'danger' },
  closed: { label: '已关闭', type: 'info' },
  refunded: { label: '已退款', type: 'danger' }
}
function statusLabel(s) { return (STATUS_MAP[s] || {}).label || s }
function statusTagType(s) { return (STATUS_MAP[s] || {}).type || 'info' }

// ======= 服务商档案 =======
const profileList = ref([])
const profileTotal = ref(0)
const profilePage = ref(1)
const profilePageSize = ref(20)
const profileLoading = ref(false)
const profileFilter = ref({ status: '' })

async function fetchProfiles() {
  profileLoading.value = true
  try {
    const res = await request.get('/admin/service-providers', {
      params: { status: profileFilter.value.status || undefined, page: profilePage.value, limit: profilePageSize.value }
    })
    const d = res.data || res
    profileList.value = d.data || []
    profileTotal.value = d.total || 0
  } catch (e) { ElMessage.error(e.message || '加载失败') }
  finally { profileLoading.value = false }
}

// 所有服务商（供服务项目tab选择）
const allProviders = ref([])
async function fetchAllProviders() {
  try {
    const res = await request.get('/admin/service-providers', { params: { limit: 100 } })
    const d = res.data || res
    allProviders.value = (d.data || []).map(p => ({ id: p.id, shop_name: p.shop_name }))
  } catch {}
}

// 新建/编辑弹窗
const profileDialogVisible = ref(false)
const editingProfile = ref(null)
const profileForm = ref({})
const profileDetailVisible = ref(false)
const detailProfile = ref(null)

function openCreateProfile() {
  editingProfile.value = null
  profileForm.value = { shop_name: '', contact_name: '', phone: '', community_id: 1, user_id: '', shop_front_url: '', description: '' }
  profileDialogVisible.value = true
}
function openEditProfile(row) {
  editingProfile.value = row
  profileForm.value = { ...row }
  profileDialogVisible.value = true
}
function openProfileDetail(row) {
  detailProfile.value = row
  profileDetailVisible.value = true
}
async function saveProfile() {
  if (!profileForm.value.shop_name) { ElMessage.warning('请填写店铺名称'); return }
  try {
    if (editingProfile.value) {
      await request.put(`/admin/service-providers/${editingProfile.value.id}`, profileForm.value)
      ElMessage.success('更新成功')
    } else {
      await request.post('/admin/service-providers', profileForm.value)
      ElMessage.success('创建成功')
    }
    profileDialogVisible.value = false
    fetchProfiles()
    fetchAllProviders()
  } catch (e) { ElMessage.error(e.message || '保存失败') }
}
async function toggleProfileStatus(row) {
  const newStatus = row.status === 'active' ? 'inactive' : 'active'
  const label = newStatus === 'active' ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(`确认${label}【${row.shop_name}】？`, '确认', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' })
    await request.put(`/admin/service-providers/${row.id}`, { status: newStatus })
    ElMessage.success(`已${label}`)
    fetchProfiles()
  } catch {}
}
function goManageServices(row) {
  selectedProviderId.value = row.id
  activeTab.value = 'services'
  fetchServices()
}

// ======= 服务项目 =======
const serviceList = ref([])
const serviceLoading = ref(false)
const selectedProviderId = ref(null)
const serviceDialogVisible = ref(false)
const editingService = ref(null)
const serviceForm = ref({})

async function fetchServices() {
  if (!selectedProviderId.value) return
  serviceLoading.value = true
  try {
    const res = await request.get(`/admin/service-providers/${selectedProviderId.value}/services`)
    const d = res.data || res
    serviceList.value = d.data || []
  } catch (e) { ElMessage.error(e.message || '加载失败') }
  finally { serviceLoading.value = false }
}
function openCreateService() {
  editingService.value = null
  serviceForm.value = { title: '', sub_title: '', description: '', price: '', unit: '次', category_key: 'general', cover_image: '', is_published: 1 }
  serviceDialogVisible.value = true
}
function openEditService(row) {
  editingService.value = row
  serviceForm.value = { ...row }
  serviceDialogVisible.value = true
}
async function saveService() {
  if (!serviceForm.value.title) { ElMessage.warning('请填写服务名称'); return }
  if (!serviceForm.value.price) { ElMessage.warning('请填写价格'); return }
  try {
    if (editingService.value) {
      await request.put(`/admin/service-providers/${selectedProviderId.value}/services/${editingService.value.id}`, serviceForm.value)
      ElMessage.success('更新成功')
    } else {
      await request.post(`/admin/service-providers/${selectedProviderId.value}/services`, serviceForm.value)
      ElMessage.success('创建成功')
    }
    serviceDialogVisible.value = false
    fetchServices()
  } catch (e) { ElMessage.error(e.message || '保存失败') }
}
async function toggleServicePublish(row) {
  const newVal = row.is_published ? 0 : 1
  try {
    await request.put(`/admin/service-providers/${selectedProviderId.value}/services/${row.id}`, { is_published: newVal })
    ElMessage.success(newVal ? '已上架' : '已下架')
    fetchServices()
  } catch (e) { ElMessage.error(e.message || '操作失败') }
}
async function confirmDeleteService(row) {
  try {
    await ElMessageBox.confirm(`确认下架并删除【${row.title}】？`, '确认', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' })
    await request.delete(`/admin/service-providers/${selectedProviderId.value}/services/${row.id}`)
    ElMessage.success('已删除')
    fetchServices()
  } catch {}
}

// ======= 订单 =======
const orderList = ref([])
const orderTotal = ref(0)
const orderPage = ref(1)
const orderPageSize = ref(20)
const orderLoading = ref(false)
const orderFilter = ref({ status: '' })
const orderDetailVisible = ref(false)
const detailOrder = ref(null)

async function fetchOrders() {
  orderLoading.value = true
  try {
    const res = await request.get('/admin/sp-orders', {
      params: { status: orderFilter.value.status || undefined, page: orderPage.value, limit: orderPageSize.value }
    })
    const d = res.data || res
    orderList.value = d.data || []
    orderTotal.value = d.total || 0
  } catch (e) { ElMessage.error(e.message || '加载失败') }
  finally { orderLoading.value = false }
}
function openOrderDetail(row) {
  detailOrder.value = row
  orderDetailVisible.value = true
}

// ======= tab 切换 =======
function onTabChange(name) {
  if (name === 'profiles') fetchProfiles()
  else if (name === 'services') { fetchAllProviders(); if (selectedProviderId.value) fetchServices() }
  else if (name === 'orders') fetchOrders()
}

onMounted(() => {
  fetchProfiles()
  fetchAllProviders()
})
</script>

<style scoped>
.sp-container {
  background: white;
  padding: 20px 30px;
  border-radius: 8px;
  min-height: calc(100vh - 120px);
}
.header-box { margin-bottom: 20px; }
.header-box h3 { margin-top: 0; color: #303133; }
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.empty { color: #ccc; font-size: 12px; }
</style>
