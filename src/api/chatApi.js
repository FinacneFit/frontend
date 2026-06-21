import { client } from './client'

export const chatApi = {
  sendMessage: (message) => client.post('/chat/message/', { message }),
}
