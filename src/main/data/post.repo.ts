import { getDb } from './db'
import type { Post } from '../../shared/types'

export const postRepo = {
  list(): Post[] {
    return getDb().prepare('SELECT * FROM posts ORDER BY created_at DESC').all() as Post[]
  },

  create(title: string, content: string): Post {
    return getDb()
      .prepare('INSERT INTO posts (title, content) VALUES (?, ?) RETURNING *')
      .get(title, content) as Post
  },

  update(id: number, title: string, content: string): void {
    getDb()
      .prepare('UPDATE posts SET title=?, content=? WHERE id=?')
      .run(title, content, id)
  },

  delete(id: number): void {
    getDb().prepare('DELETE FROM posts WHERE id=?').run(id)
  }
}
