# Google AdSense 설정 가이드

## 📋 개요
이 프로젝트는 Google AdSense가 완전히 통합되어 있습니다. 실제 광고를 표시하려면 다음 단계를 따라주세요.

## 🚀 AdSense 계정 설정

### 1단계: Google AdSense 계정 생성
1. [Google AdSense](https://www.google.com/adsense) 방문
2. Google 계정으로 로그인
3. 웹사이트 추가: `https://your-domain.com`
4. 결제 정보 및 세금 정보 입력

### 2단계: 사이트 승인 대기
- 일반적으로 1-14일 소요
- 사이트에 충분한 콘텐츠와 트래픽 필요
- Google 정책 준수 필수

### 3단계: 광고 단위 생성
AdSense 승인 후 다음 광고 단위들을 생성하세요:

1. **배너 광고** (Banner Ad)
   - 크기: 반응형 또는 728x90
   - 유형: 디스플레이 광고

2. **사이드바 광고** (Sidebar Ad) 
   - 크기: 300x250 (Medium Rectangle)
   - 유형: 디스플레이 광고

3. **인피드 광고** (In-Feed Ad)
   - 크기: 반응형
   - 유형: 인피드 광고

4. **모바일 하단 광고** (Mobile Bottom Ad)
   - 크기: 320x50 (Mobile Banner)
   - 유형: 디스플레이 광고

5. **네이티브 광고** (Native Ad)
   - 크기: 반응형
   - 유형: 네이티브 광고

## ⚙️ 환경 변수 설정

`.env.local` 파일에서 다음 값들을 실제 AdSense 정보로 교체하세요:

```env
# Google AdSense - 실제 승인받은 AdSense ID로 교체 필요
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-YOUR_REAL_CLIENT_ID

# AdSense 광고 슬롯 ID들 (실제 생성된 슬롯 ID로 교체 필요)
NEXT_PUBLIC_ADSENSE_BANNER_SLOT=YOUR_BANNER_SLOT_ID
NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT=YOUR_SIDEBAR_SLOT_ID
NEXT_PUBLIC_ADSENSE_INFEED_SLOT=YOUR_INFEED_SLOT_ID
NEXT_PUBLIC_ADSENSE_MOBILE_SLOT=YOUR_MOBILE_SLOT_ID
NEXT_PUBLIC_ADSENSE_NATIVE_SLOT=YOUR_NATIVE_SLOT_ID

# AdSense 설정
NEXT_PUBLIC_ADSENSE_ENABLED=true
```

## 📊 광고 배치 위치

현재 광고가 표시되는 위치:

1. **홈페이지**
   - 상단 배너 광고
   - 네이티브 광고 (카테고리 섹션 하단)

2. **구인공고 페이지** 
   - 상단 배너 광고
   - 인피드 광고 (3개 일자리마다 삽입)

3. **프로필 페이지**
   - 사이드바 광고 (우측)

4. **모든 페이지**
   - 모바일 하단 고정 광고 (모바일만)

## 🔧 AdSense 관리

### 관리 대시보드 접근
- 우측 하단 💰 버튼 클릭
- 광고 성과, 수익, CTR 등 확인 가능
- AdBlocker 감지 기능

### 주요 기능
- **실시간 광고 성과 모니터링**
- **광고 차단기 감지**
- **수익 통계**
- **클릭률(CTR) 추적**

## 🎯 최적화 팁

### 1. 광고 배치 최적화
- 사용자 경험을 해치지 않는 선에서 배치
- 스크롤 없이 보이는 영역(Above the fold)에 1-2개
- 콘텐츠와 자연스럽게 어우러지도록

### 2. 성과 모니터링
- AdSense 대시보드에서 정기적으로 성과 확인
- CTR이 낮은 광고는 위치나 크기 조정
- A/B 테스트로 최적 배치 찾기

### 3. 정책 준수
- Google AdSense 정책 철저히 준수
- 클릭 유도 금지
- 적절한 콘텐츠 유지

## 🚨 문제 해결

### 광고가 표시되지 않는 경우
1. AdSense 계정 승인 상태 확인
2. 환경 변수 설정 확인
3. 광고 슬롯 ID 정확성 확인
4. 브라우저 광고 차단기 확인

### 수익이 발생하지 않는 경우
1. 트래픽 양 확인 (최소 일일 방문자 필요)
2. 클릭률 확인
3. 광고 배치 최적화
4. 타겟팅 설정 검토

## 📈 예상 수익

일반적인 AdSense 수익률 (참고용):
- RPM (천 노출당 수익): $0.5 - $5
- CTR (클릭률): 1% - 5%
- CPC (클릭당 비용): $0.1 - $2

실제 수익은 트래픽, 사용자 위치, 콘텐츠 주제에 따라 크게 달라집니다.

## 📞 지원

AdSense 관련 문제가 있으시면:
1. [Google AdSense 고객센터](https://support.google.com/adsense)
2. [Google AdSense 커뮤니티](https://support.google.com/adsense/community)
3. 개발팀 문의

---

**⚠️ 중요사항**: 
- 실제 AdSense ID와 슬롯 ID로 교체하기 전까지는 테스트 광고만 표시됩니다.
- Google AdSense 정책을 반드시 준수해주세요.
- 첫 수익 지급까지 최소 $100 이상 누적되어야 합니다.