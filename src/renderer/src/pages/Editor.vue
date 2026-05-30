<template>
  <div style="height: 100%; display: flex; gap: 16px">
    <!-- 草稿列表 -->
    <div style="width: 220px; flex-shrink: 0; display: flex; flex-direction: column; gap: 8px">
      <div style="display: flex; justify-content: space-between; align-items: center">
        <span style="color: #cdd6f4; font-weight: 600">草稿</span>
        <el-button size="small" @click="handleNew">新建</el-button>
      </div>
      <div style="flex: 1; overflow-y: auto">
        <div
          v-for="post in posts"
          :key="post.id"
          style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px"
        >
          <div
            @click="loadPost(post)"
            style="flex: 1; padding: 8px 10px; border-radius: 6px; cursor: pointer; font-size: 13px; color: #cdd6f4; word-break: break-all; overflow: hidden; white-space: nowrap; text-overflow: ellipsis"
            :style="currentPost?.id === post.id ? 'background:#313244' : ''"
          >
            {{ post.title || '（无标题）' }}
          </div>
          <el-button
            size="small"
            type="danger"
            text
            :icon="Delete"
            @click.stop="handleDelete(post)"
          />
        </div>
        <el-empty v-if="posts.length === 0" description="暂无草稿" :image-size="60" />
      </div>
    </div>

    <!-- 编辑区 -->
    <div style="flex: 1; display: flex; flex-direction: column; gap: 16px; min-width: 0">
      <div style="display: flex; justify-content: space-between; align-items: center">
        <h2 style="color: #cdd6f4; margin: 0">内容编辑</h2>
        <div style="display: flex; gap: 8px">
          <el-button @click="handleSave" :loading="saving">保存草稿</el-button>
          <el-button type="primary" @click="showPublishDialog = true" :disabled="!currentPost">
            发布
          </el-button>
        </div>
      </div>

      <el-input
        v-model="title"
        placeholder="文章标题（小红书限 20 字）"
        maxlength="20"
        show-word-limit
        style="font-size: 16px"
      />

      <!-- 图片编辑区 -->
      <div class="image-section">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px">
          <span style="color: #cdd6f4; font-weight: 600; font-size: 14px">图片编辑</span>
          <span style="color: #6c7086; font-size: 13px">{{ images.length }}/18</span>
          <el-button
            v-if="images.length > 0"
            size="small"
            type="danger"
            text
            @click="images = []"
            style="margin-left: auto"
          >清空</el-button>
        </div>
        <DragDropProvider @dragEnd="handleDragEnd">
          <div class="image-grid">
            <div
              v-if="images.length < 18"
              class="image-add"
              @click="handleAddImages"
            >
              <span style="font-size: 28px; color: #6c7086">+</span>
            </div>
            <SortableItem
              v-for="(img, index) in images"
              :key="img.id"
              :id="img.id"
              :index="index"
              :image="img"
              @remove="removeImage(index)"
            />
          </div>
        </DragDropProvider>
      </div>

      <MdEditor
        v-model="content"
        theme="dark"
        style="flex: 1; min-height: 300px"
        :toolbars="toolbars"
      />
    </div>

    <!-- 发布弹窗 -->
    <el-dialog v-model="showPublishDialog" title="选择发布账号" width="480px">
      <el-empty v-if="accountStore.accounts.length === 0" description="暂无账号，请先在「账号管理」添加并登录" />
      <el-checkbox-group v-else v-model="selectedAccountIds">
        <div v-for="acc in accountStore.accounts" :key="acc.id" style="margin-bottom: 8px">
          <el-checkbox :label="acc.id" :disabled="acc.status !== 'logged_in'">
            {{ acc.name }}
            <el-tag size="small" :type="acc.status === 'logged_in' ? 'success' : 'info'" style="margin-left: 8px">
              {{ acc.status === 'logged_in' ? '已登录' : '未登录' }}
            </el-tag>
          </el-checkbox>
        </div>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="showPublishDialog = false">取消</el-button>
        <el-button type="primary" :loading="publishing" @click="handlePublish">
          一键发布
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineComponent, h } from 'vue'
import { MdEditor } from 'md-editor-v3'
// @ts-ignore: missing declaration for CSS side-effect import
import 'md-editor-v3/lib/style.css'
import { DragDropProvider } from '@dnd-kit/vue'
import { useSortable } from '@dnd-kit/vue/sortable'
import { Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAccountStore } from '../stores/account'
import type { Post } from '../../../shared/types'

interface ImageItem {
  id: string
  path: string
  base64: string
}

const SortableItem = defineComponent({
  props: {
    id: { type: String, required: true },
    index: { type: Number, required: true },
    image: { type: Object as () => ImageItem, required: true }
  },
  emits: ['remove'],
  setup(props, { emit }) {
    const el = ref<HTMLElement | null>(null)
    const { isDragSource } = useSortable({ id: props.id, index: () => props.index, element: el })

    return () =>
      h('div', {
        ref: el,
        class: 'image-card',
        style: isDragSource.value ? 'opacity: 0.4' : ''
      }, [
        h('span', { class: 'image-index' }, props.index + 1),
        h('img', { src: props.image.base64, class: 'image-thumb' }),
        h('button', {
          class: 'image-remove',
          onClick: (e: Event) => { e.stopPropagation(); emit('remove') }
        }, '×')
      ])
  }
})

const accountStore = useAccountStore()
const title = ref('')
const content = ref('# 标题\n\n在这里写你的内容...')
const saving = ref(false)
const publishing = ref(false)
const showPublishDialog = ref(false)
const selectedAccountIds = ref<number[]>([])
const currentPost = ref<Post | null>(null)
const posts = ref<Post[]>([])
const images = ref<ImageItem[]>([])

const toolbars: any = [
  'bold', 'italic', 'strikeThrough', '-',
  'title', 'quote', 'unorderedList', 'orderedList', '-',
  'code', 'codeRow', 'link', 'image', '-',
  'preview'
]

async function fetchPosts() {
  posts.value = await window.api.invoke<Post[]>(window.api.IPC.POST_LIST)
}

function loadPost(post: Post) {
  currentPost.value = post
  title.value = post.title
  content.value = post.content
  images.value = []
}

function handleNew() {
  currentPost.value = null
  title.value = ''
  content.value = '# 标题\n\n在这里写你的内容...'
  images.value = []
}

async function handleDelete(post: Post) {
  try {
    await ElMessageBox.confirm(`删除草稿「${post.title}」？`, '确认删除', { type: 'warning' })
    await window.api.invoke(window.api.IPC.POST_DELETE, post.id)
    if (currentPost.value?.id === post.id) handleNew()
    await fetchPosts()
    ElMessage.success('草稿已删除')
  } catch (e: any) {
    if (e === 'cancel' || e?.message?.includes('cancel')) return
    ElMessage.error(e?.message || '删除失败')
  }
}

async function handleAddImages() {
  const remaining = 18 - images.value.length
  if (remaining <= 0) return ElMessage.warning('最多 18 张图片')
  const selected = await window.api.invoke<ImageItem[]>(window.api.IPC.IMAGE_SELECT)
  if (!selected || selected.length === 0) return
  const toAdd = selected.slice(0, remaining)
  images.value.push(...toAdd)
  if (selected.length > remaining) {
    ElMessage.warning(`最多 18 张，已添加前 ${remaining} 张`)
  }
}

function removeImage(index: number) {
  images.value.splice(index, 1)
}

function handleDragEnd(event: any) {
  const { operation } = event
  const source = operation?.source
  const target = operation?.target
  if (!source || !target) return

  const oldIndex = images.value.findIndex((img) => img.id === source.id)
  const newIndex = images.value.findIndex((img) => img.id === target.id)
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

  const item = images.value.splice(oldIndex, 1)[0]
  images.value.splice(newIndex, 0, item)
}

onMounted(() => {
  accountStore.fetchAccounts()
  fetchPosts()
})

async function handleSave() {
  if (!title.value.trim()) return ElMessage.warning('请输入标题')
  saving.value = true
  try {
    if (currentPost.value) {
      await window.api.invoke(window.api.IPC.POST_UPDATE, currentPost.value.id, title.value, content.value)
      currentPost.value = { ...currentPost.value, title: title.value, content: content.value }
      ElMessage.success('已更新')
    } else {
      currentPost.value = await window.api.invoke<Post>(window.api.IPC.POST_CREATE, title.value, content.value)
      ElMessage.success('草稿已保存')
    }
    await fetchPosts()
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handlePublish() {
  if (images.value.length === 0) return ElMessage.warning('请先上传图片')
  if (selectedAccountIds.value.length === 0) return ElMessage.warning('请至少选择一个账号')
  if (!currentPost.value) {
    await handleSave()
    if (!currentPost.value) return
  }
  const imagePaths = images.value.map((img) => img.path)
  publishing.value = true
  try {
    await window.api.invoke(
      window.api.IPC.PUBLISH_CREATE,
      currentPost.value!.id,
      [...selectedAccountIds.value],
      imagePaths
    )
    ElMessage.success('任务已加入队列，请在"发布队列"查看进度')
    showPublishDialog.value = false
  } catch (e: any) {
    ElMessage.error(e?.message || '发布失败')
  } finally {
    publishing.value = false
  }
}
</script>

<style scoped>
.image-section {
  border: 1px solid #45475a;
  border-radius: 8px;
  padding: 12px;
  background: #1e1e2e;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.image-add {
  width: 120px;
  height: 120px;
  border: 2px dashed #45475a;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.image-add:hover {
  border-color: #cba6f7;
}
</style>

<style>
.image-card {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  cursor: grab;
  flex-shrink: 0;
}

.image-card:active {
  cursor: grabbing;
}

.image-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-index {
  position: absolute;
  top: 4px;
  left: 4px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 11px;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.image-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border: none;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.image-card:hover .image-remove {
  display: flex;
}
</style>
