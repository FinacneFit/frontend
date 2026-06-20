export const mockSurveyQuestions = [
  {
    id: 1,
    question: '최근에 투자 경험이 있으신가요?',
    choices: [
      { text: '전혀 없음', score: 1 },
      { text: '있음 (6개월 미만)', score: 3 },
      { text: '있음 (6개월~2년)', score: 6 },
      { text: '있음 (2년 이상)', score: 8 },
    ],
  },
  {
    id: 2,
    question: '투자 손실이 발생했을 때 어떻게 반응하시나요?',
    choices: [
      { text: '즉시 손절하고 안전 자산으로 이동한다', score: 1 },
      { text: '불안하지만 조금 더 기다려본다', score: 3 },
      { text: '추가 매수 기회로 본다', score: 6 },
      { text: '손실은 투자의 일부라고 생각한다', score: 8 },
    ],
  },
  {
    id: 3,
    question: '투자 기간은 어느 정도로 생각하시나요?',
    choices: [
      { text: '6개월 미만', score: 1 },
      { text: '1년 이내', score: 3 },
      { text: '1~3년', score: 6 },
      { text: '3년 이상', score: 8 },
    ],
  },
  {
    id: 4,
    question: '투자 자산에서 어느 정도의 수익률을 기대하시나요?',
    choices: [
      { text: '원금 보전 수준 (0~3%)', score: 1 },
      { text: '안정적 수익 (3~7%)', score: 3 },
      { text: '적정 수익 (7~15%)', score: 6 },
      { text: '고수익 추구 (15% 이상)', score: 8 },
    ],
  },
  {
    id: 5,
    question: '전체 자산 중 투자에 활용하는 비중은?',
    choices: [
      { text: '10% 미만', score: 1 },
      { text: '10~30%', score: 3 },
      { text: '30~50%', score: 6 },
      { text: '50% 이상', score: 8 },
    ],
  },
]
