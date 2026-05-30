import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Account } from '../../../shared/types'

export const useAccountStore = defineStore('account', () => {
  const accounts = ref<Account[]>([])
  const loading = ref(false)

  async function fetchAccounts() {
    loading.value = true
    try {
      accounts.value = await window.api.invoke<Account[]>(window.api.IPC.ACCOUNT_LIST)
    } finally {
      loading.value = false
    }
  }

  async function addAccount(name: string, platform: Account['platform'] = 'xiaohongshu') {
    const account = await window.api.invoke<Account>(window.api.IPC.ACCOUNT_ADD, name, platform)
    accounts.value.unshift(account)
    return account
  }

  async function deleteAccount(id: number) {
    await window.api.invoke(window.api.IPC.ACCOUNT_DELETE, id)
    accounts.value = accounts.value.filter((a) => a.id !== id)
  }

  async function loginAccount(id: number): Promise<{ success: boolean; error?: string }> {
    const result = await window.api.invoke<{ success: boolean; error?: string }>(
      window.api.IPC.ACCOUNT_LOGIN,
      id
    )
    if (result.success) {
      const acc = accounts.value.find((a) => a.id === id)
      if (acc) acc.status = 'logged_in'
    }
    return result
  }

  return { accounts, loading, fetchAccounts, addAccount, deleteAccount, loginAccount }
})
