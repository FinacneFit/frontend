import { client } from './client'

export const surveyApi = {
  getQuestions: ()        => client.get('/survey/questions/', false),
  submit:       (answers) => client.post('/survey/submit/', { answers }),
}
