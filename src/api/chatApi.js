import { client } from './client'

export const chatApi = {
  sendMessage: (message, history) => client.post('/chat/message/', { message, history }),
}
