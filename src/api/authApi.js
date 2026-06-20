const MOCK_USERS = []

export const authApi = {
  async signup({ email, nickname, password }) {
    await new Promise((r) => setTimeout(r, 300))
    if (MOCK_USERS.find((u) => u.email === email)) {
      throw new Error('이미 사용 중인 이메일입니다.')
    }
    const user = { id: 99, email, nickname, bio: '' }
    MOCK_USERS.push({ ...user, password })
    return { user, token: 'mock-token-' + Date.now() }
  },

  async login({ email, password }) {
    await new Promise((r) => setTimeout(r, 300))
    if (!email || !password) {
      throw new Error('이메일과 비밀번호를 입력해주세요.')
    }
    const existing = MOCK_USERS.find((u) => u.email === email)
    if (existing && existing.password !== password) {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
    }
    const user = existing
      ? { id: existing.id, email: existing.email, nickname: existing.nickname, bio: existing.bio ?? '' }
      : { id: 99, email, nickname: email.split('@')[0] || '사용자', bio: '' }
    return { user, token: 'mock-token-' + Date.now() }
  },

  async logout() {
    await new Promise((r) => setTimeout(r, 100))
    return true
  },
}
