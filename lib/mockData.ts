export const mockData = {
  app: {
    name: "카카오뱅크",
    developer: "Kakao Bank Corp.",
    icon: "https://play-lh.googleusercontent.com/HBx3d3Dl9GJY0SJAX5HFVqZFNNvIIE9YjHE0yuAPYl8r60WpjUOFqmtJGYIPVZjU_w",
    store: "Google Play",
    category: "금융",
    url: "https://play.google.com/store/apps/details?id=com.kakaobank.channel"
  },
  summary: {
    avgRating: 4.2,
    totalReviews: 48320,
    recentReviews: 1240,
    negativeRatio: 18,
    positiveRatio: 67,
    neutralRatio: 15,
  },
  ratingDistribution: [
    { star: 5, count: 28990, percent: 60 },
    { star: 4, count: 9664, percent: 20 },
    { star: 3, count: 4832, percent: 10 },
    { star: 2, count: 2416, percent: 5 },
    { star: 1, count: 2418, percent: 5 },
  ],
  topics: [
    { name: "로그인", count: 342, positive: 20, negative: 72, neutral: 8, trend: "up" },
    { name: "송금", count: 289, positive: 65, negative: 25, neutral: 10, trend: "stable" },
    { name: "속도", count: 218, positive: 30, negative: 58, neutral: 12, trend: "up" },
    { name: "UI/디자인", count: 195, positive: 78, negative: 14, neutral: 8, trend: "stable" },
    { name: "알림", count: 167, positive: 22, negative: 65, neutral: 13, trend: "down" },
    { name: "보안", count: 143, positive: 55, negative: 32, neutral: 13, trend: "stable" },
  ],
  trendData: {
    "7d": [
      { date: "3/13", rating: 4.1, negative: 20 },
      { date: "3/14", rating: 4.0, negative: 22 },
      { date: "3/15", rating: 3.9, negative: 25 },
      { date: "3/16", rating: 4.1, negative: 19 },
      { date: "3/17", rating: 4.2, negative: 17 },
      { date: "3/18", rating: 4.3, negative: 15 },
      { date: "3/19", rating: 4.2, negative: 18 },
    ],
    "30d": [
      { date: "2/18", rating: 4.3, negative: 15 },
      { date: "2/23", rating: 4.1, negative: 20 },
      { date: "2/28", rating: 3.8, negative: 28 },
      { date: "3/5", rating: 3.9, negative: 25 },
      { date: "3/10", rating: 4.0, negative: 22 },
      { date: "3/15", rating: 4.1, negative: 19 },
      { date: "3/19", rating: 4.2, negative: 18 },
    ],
    "90d": [
      { date: "12/19", rating: 4.4, negative: 12 },
      { date: "1/3", rating: 4.3, negative: 14 },
      { date: "1/18", rating: 4.2, negative: 17 },
      { date: "2/2", rating: 4.0, negative: 21 },
      { date: "2/17", rating: 3.9, negative: 26 },
      { date: "3/4", rating: 4.0, negative: 23 },
      { date: "3/19", rating: 4.2, negative: 18 },
    ],
  },
  recentNegativeIssues: [
    { title: "로그인 오류 급증", description: "최근 30일 동안 '로그인이 안 된다', '인증 오류' 관련 불만이 42% 증가했습니다.", count: 156, trend: "up" },
    { title: "앱 속도 저하", description: "최근 업데이트 이후 로딩 속도가 느리다는 언급이 증가하고 있습니다.", count: 98, trend: "up" },
    { title: "알림 미수신", description: "이체 및 결제 알림이 오지 않는다는 신고가 반복되고 있습니다.", count: 67, trend: "stable" },
  ],
  insights: {
    summary: "최근 사용자들은 로그인 오류와 느린 로딩에 가장 큰 불만을 보이고 있습니다. 반면 UI 가독성과 송금 편의성은 지속적으로 긍정 평가를 받고 있습니다.",
    positivePoints: ["직관적인 UI/디자인", "간편한 송금 기능", "높은 보안 신뢰도"],
    negativePoints: ["로그인 인증 오류", "앱 로딩 속도 저하", "알림 미수신 문제"],
    actions: ["로그인 인증 플로우 점검 (최우선)", "네트워크 요청 최적화 검토", "푸시 알림 서버 안정성 확인"],
  },
  representativeReviews: {
    positive: [
      { author: "kim****", rating: 5, date: "2024-03-18", text: "송금이 너무 편해요. 공인인증서 없이 이렇게 빠르게 되는 게 신기해요. UI도 깔끔하고 직관적입니다." },
      { author: "park***", rating: 5, date: "2024-03-17", text: "다른 은행 앱 쓰다가 넘어왔는데 진짜 쓰기 편해요. 금리도 좋고 이자 자동으로 붙는 것도 좋습니다." },
    ],
    negative: [
      { author: "lee****", rating: 1, date: "2024-03-19", text: "로그인이 갑자기 안 돼요. 비밀번호 맞게 입력했는데 계속 오류 납니다. 급하게 송금해야 하는데 너무 불편해요." },
      { author: "choi***", rating: 2, date: "2024-03-18", text: "업데이트 이후로 앱이 너무 느려졌어요. 메인 화면 뜨는 데만 10초가 걸립니다. 개선 부탁드려요." },
    ],
  },
};
