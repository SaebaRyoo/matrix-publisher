<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2 style="color: #cdd6f4">账号管理</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon> 添加账号
      </el-button>
    </div>

    <el-table :data="store.accounts" v-loading="store.loading" style="width: 100%">
      <el-table-column prop="name" label="账号名称" />
      <el-table-column prop="platform" label="平台">
        <template #default="{ row }">
          <el-tag :type="row.platform === 'douyin' ? 'danger' : 'success'">
            {{ row.platform === 'douyin' ? '抖音' : '小红书' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="添加时间" />
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button
            v-if="row.status !== 'logged_in'"
            type="primary"
            size="small"
            :loading="loggingIn === row.id"
            @click="handleLogin(row.id)"
          >
            扫码登录
          </el-button>
          <el-button
            v-else
            size="small"
            disabled
          >
            已登录
          </el-button>
          <el-button type="danger" size="small" text @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showAddDialog" title="添加账号" width="400px">
      <el-form @submit.prevent="handleAdd">
        <el-form-item label="平台">
          <el-radio-group v-model="newPlatform">
            <el-radio value="xiaohongshu">小红书</el-radio>
            <el-radio value="douyin">抖音</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="账号名称">
          <el-input v-model="newName" :placeholder="`例如：我的${newPlatform === 'douyin' ? '抖音' : '小红书'}账号`" autofocus />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="adding" @click="handleAdd">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAccountStore } from '../stores/account'
import type { Account } from '../../../shared/types'

const store = useAccountStore()
const showAddDialog = ref(false)
const newName = ref('')
const newPlatform = ref<'xiaohongshu' | 'douyin'>('xiaohongshu')
const adding = ref(false)
const loggingIn = ref<number | null>(null)

onMounted(() => store.fetchAccounts())

function statusType(status: Account['status']) {
  return status === 'logged_in' ? 'success' : status === 'error' ? 'danger' : 'info'
}
function statusLabel(status: Account['status']) {
  return status === 'logged_in' ? '已登录' : status === 'error' ? '登录失败' : '未登录'
}

async function handleAdd() {
  if (!newName.value.trim()) return
  adding.value = true
  try {
    await store.addAccount(newName.value, newPlatform.value)
    ElMessage.success('账号添加成功')
    showAddDialog.value = false
    newName.value = ''
    newPlatform.value = 'xiaohongshu'
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '添加失败')
  } finally {
    adding.value = false
  }
}

async function handleLogin(id: number) {
  loggingIn.value = id
  const acc = store.accounts.find(a => a.id === id)
  const platformName = acc?.platform === 'douyin' ? '抖音' : '小红书'
  ElMessage.info(`浏览器已打开，请在浏览器中扫码登录${platformName}（最多等待 3 分钟）`)
  try {
    const result = await store.loginAccount(id)
    if (result.success) {
      ElMessage.success('登录成功，Cookie 已保存')
    } else {
      ElMessage.error(result.error ?? '登录失败')
    }
  } finally {
    loggingIn.value = null
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除该账号？Cookie 也会一并清除。', '提示', { type: 'warning' })
    await store.deleteAccount(id)
    ElMessage.success('已删除')
  } catch (e: any) {
    if (e === 'cancel' || e?.message?.includes('cancel')) return
    ElMessage.error(e?.message || '删除失败')
  }
}
</script>
