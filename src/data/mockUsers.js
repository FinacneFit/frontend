// 커뮤니티 작성자 및 팔로워/팔로잉 목록에 사용하는 mock 사용자 데이터
// ID 99 = 현재 로그인한 사용자 (authStore에서 관리)
export const mockUsers = [
  {
    id: 1,
    email: 'para@test.com',
    nickname: '파라파라',
    bio: '장기 투자를 추구합니다. 삼성전자 응원해요!',
    investmentType: '안전추구형',
    postCount: 1,
    followerCount: 8,
    followingCount: 3,
  },
  {
    id: 2,
    email: 'someone@test.com',
    nickname: '누군가',
    bio: '수익 극대화가 목표입니다!',
    investmentType: '공격투자형',
    postCount: 1,
    followerCount: 14,
    followingCount: 7,
  },
  {
    id: 3,
    email: 'seo@test.com',
    nickname: '서현짱',
    bio: '균형 잡힌 투자를 지향합니다.',
    investmentType: '위험중립형',
    postCount: 0,
    followerCount: 22,
    followingCount: 15,
  },
  {
    id: 4,
    email: 'happy@test.com',
    nickname: '행복킹',
    bio: '행복하게 투자해요~',
    investmentType: '공격투자형',
    postCount: 0,
    followerCount: 6,
    followingCount: 9,
  },
  {
    id: 5,
    email: 'cheer@test.com',
    nickname: '응원맨',
    bio: '모두를 응원합니다!',
    investmentType: '안전추구형',
    postCount: 0,
    followerCount: 3,
    followingCount: 2,
  },
]

/** id로 사용자 조회 */
export function getUserById(id) {
  return mockUsers.find(u => u.id === id) ?? null
}
