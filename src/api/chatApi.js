import { client } from './client'

export const chatApi = {
  sendMessage: (message, history, userContext) =>
    client.post('/chat/message/', { message, history, user_context: userContext }),
}
