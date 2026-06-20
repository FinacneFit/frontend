export const chatApi = {
  async sendMessage(text) {
    await new Promise(r => setTimeout(r, 700))
    return { reply: '' }
  },
}
