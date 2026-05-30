<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2 style="color: #cdd6f4">发布日志</h2>
      <el-button @click="load" :loading="loading">刷新</el-button>
    </div>

    <el-table :data="logs" v-loading="loading" style="width: 100%">
      <el-table-column prop="task_id" label="任务 ID" width="80" />
      <el-table-column prop="level" label="级别" width="80">
        <template #default="{ row }">
          <el-tag :type="row.level === 'error' ? 'danger' : row.level === 'warn' ? 'warning' : 'info'" size="small">
            {{ row.level }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="message" label="消息" show-overflow-tooltip />
      <el-table-column prop="created_at" label="时间" width="160" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { PublishLog } from '../../../shared/types'

const logs = ref<PublishLog[]>([])
const loading = ref(false)

onMounted(load)

async function load() {
  loading.value = true
  try {
    logs.value = await window.api.invoke<PublishLog[]>(window.api.IPC.LOG_LIST)
  } finally {
    loading.value = false
  }
}
</script>
