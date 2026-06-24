import { client } from './client'

export const authApi = {
  signup:   ({ email, nickname, password }) => client.post('/auth/signup/', { email, nickname, password }, false),
  login:    ({ email, password })           => client.post('/auth/login/',  { email, password }, false),
  logout:   ()                              => client.post('/auth/logout/'),
  getMe:    ()                              => client.get('/users/me/'),
  updateMe: (data)                          => client.patch('/users/me/', data),
  uploadProfileImage: (file) => {
    const formData = new FormData()
    formData.append('profile_image', file)
    return client.patch('/users/me/', formData)
  },
  removeProfileImage: () => client.patch('/users/me/', { profile_image: null }),
}
