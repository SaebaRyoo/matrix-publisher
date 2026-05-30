export interface Account {
  id: number
  name: string
  platform: 'xiaohongshu' | 'douyin'
  status: 'logged_in' | 'logged_out' | 'error'
  created_at: string
}

export interface Post {
  id: number
  title: string
  content: string
  created_at: string
}

export interface Task {
  id: number
  post_id: number
  account_id: number
  status: 'pending' | 'running' | 'success' | 'failed'
  error?: string
  created_at: string
  updated_at: string
}

export interface PublishLog {
  id: number
  task_id: number
  message: string
  level: 'info' | 'warn' | 'error'
  created_at: string
}
