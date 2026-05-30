<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2 style="color: #cdd6f4">发布队列</h2>
      <el-button @click="load" :loading="loading">刷新</el-button>
    </div>

    <el-table :data="tasks" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="post_id" label="文章 ID" width="80" />
      <el-table-column prop="account_id" label="账号 ID" width="80" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="error" label="错误信息" show-overflow-tooltip />
      <el-table-column prop="updated_at" label="更新时间" width="160" />
      <el-table-column label="操作" width="80">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'failed'"
            size="small"
            type="warning"
            @click="retry(row.id)"
          >重试</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { Task } from '../../../shared/types'

const tasks = ref<Task[]>([])
const loading = ref(false)

onMounted(load)

async function load() {
  loading.value = true
  try {
    tasks.value = await window.api.invoke<Task[]>(window.api.IPC.TASK_LIST)
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function retry(id: number) {
  try {
    await window.api.invoke(window.api.IPC.TASK_RETRY, id)
    ElMessage.success('已重新加入队列')
    load()
  } catch (e: any) {
    ElMessage.error(e?.message || '重试失败')
  }
}

function statusType(s: Task['status']) {
  return { pending: 'info', running: 'warning', success: 'success', failed: 'danger' }[s] ?? 'info'
}
function statusLabel(s: Task['status']) {
  return { pending: '等待中', running: '执行中', success: '成功', failed: '失败' }[s] ?? s
}
</script>
