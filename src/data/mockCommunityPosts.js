let _nextPostId = 4
let _nextCommentId = 10

export function nextPostId() { return _nextPostId++ }
export function nextCommentId() { return _nextCommentId++ }

export const mockCommunityPosts = [
  {
    id: 1,
    title: '대형주 중심 포트폴리오',
    content: '저는 이번에 31만에 삼전 추매했어요 ~  이전까지 수익률 20만원이었는데 현재 100만원 넘었어요  장기적 관점에서 투자하려고 하는데 SK 하이닉스는 지금 들어가도 괜찮을까요 ?',
    author: '파라파라',
    authorInitial: '파',
    riskType: '안전추구형',
    likes: 10,
    liked: false,
    comments: [
      { id: 1, author: '서현짱', authorInitial: '서', text: '네, 들어가십쇼.' },
      { id: 2, author: '행복킹', authorInitial: '행', text: '돈 있음 ㄱㄱ' },
    ],
    createdAt: '2025-01-15',
  },
  {
    id: 2,
    title: '중견 기업 중심 포트폴리오',
    content: '돈 많이많이많이 벌고 싶다아',
    author: '누군가',
    authorInitial: '누',
    riskType: '공격투자형',
    likes: 14,
    liked: false,
    comments: [
      { id: 3, author: '응원맨', authorInitial: '응', text: '화이팅입니다!' },
    ],
    createdAt: '2025-01-14',
  },
  {
    id: 3,
    title: '안녕안녕',
    content: '안녕하세요. 반갑습니다.',
    author: '이서현',
    authorInitial: '이',
    riskType: '안전추구형',
    likes: 10,
    liked: false,
    comments: [],
    createdAt: '2025-01-13',
  },
]
