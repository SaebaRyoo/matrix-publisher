<template>
  <el-container style="height: 100vh">
    <el-aside width="200px" style="background: #1e1e2e; border-right: 1px solid #2d2d3f">
      <div style="padding: 20px 16px; color: #cdd6f4; font-weight: 600; font-size: 14px">
        AI Matrix Publisher
      </div>
      <el-menu
        :default-active="$route.path"
        router
        background-color="#1e1e2e"
        text-color="#a6adc8"
        active-text-color="#cba6f7"
      >
        <el-menu-item index="/accounts">
          <el-icon><User /></el-icon>
          <span>账号管理</span>
        </el-menu-item>
        <el-menu-item index="/editor">
          <el-icon><Edit /></el-icon>
          <span>内容编辑</span>
        </el-menu-item>
        <el-menu-item index="/queue">
          <el-icon><List /></el-icon>
          <span>发布队列</span>
        </el-menu-item>
        <el-menu-item index="/logs">
          <el-icon><Document /></el-icon>
          <span>发布日志</span>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <span>设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main style="background: #181825; padding: 24px">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
</style>
