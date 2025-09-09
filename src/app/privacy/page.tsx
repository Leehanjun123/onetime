'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>

        <Card variant="default">
          <CardContent className="p-6">
            <div className="prose max-w-none text-gray-700">
              <h2 className="text-xl font-bold mb-4">1. 개인정보의 수집 및 이용 목적</h2>
              <p className="mb-4">
                일데이는 다음의 목적을 위하여 개인정보를 수집합니다.
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>회원 가입 및 관리</li>
                <li>일자리 매칭 서비스 제공</li>
                <li>맞춤형 일자리 추천</li>
                <li>고객 상담 및 불만 처리</li>
                <li>서비스 개선 및 신규 서비스 개발</li>
                <li>통계 분석 및 마케팅</li>
              </ul>

              <h2 className="text-xl font-bold mb-4">2. 수집하는 개인정보 항목</h2>
              <p className="mb-4">
                <strong>필수 수집 항목:</strong>
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>이름, 아이디, 비밀번호</li>
                <li>휴대폰 번호, 이메일 주소</li>
                <li>생년월일, 성별</li>
                <li>근무 희망 지역, 희망 직종</li>
              </ul>
              <p className="mb-4">
                <strong>선택 수집 항목:</strong>
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>경력 사항</li>
                <li>학력 사항</li>
                <li>자격증 정보</li>
                <li>프로필 사진</li>
              </ul>

              <h2 className="text-xl font-bold mb-4">3. 개인정보의 보유 및 이용 기간</h2>
              <p className="mb-4">
                원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
                단, 관계 법령에 의하여 보존할 필요가 있는 경우 아래와 같이 관련 법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
                <li>회원 탈퇴 후: 30일 (회원 재가입 방지를 위한 본인확인 정보)</li>
              </ul>

              <h2 className="text-xl font-bold mb-4">4. 개인정보의 제3자 제공</h2>
              <p className="mb-4">
                일데이는 원칙적으로 회원의 동의 없이 개인정보를 외부에 공개하지 않습니다.
                다만, 아래의 경우에는 예외로 합니다.
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>회원이 사전에 제3자 제공에 동의한 경우</li>
                <li>법령에 의한 수사기관의 요청이 있는 경우</li>
                <li>통계작성, 학술연구, 시장조사를 위해 필요한 경우 (특정 개인 식별 불가)</li>
                <li>기타 관계 법령에 의하여 허용되는 경우</li>
              </ul>

              <h2 className="text-xl font-bold mb-4">5. 개인정보의 파기 절차</h2>
              <p className="mb-4">
                개인정보의 파기는 기록재생이 불가능한 방법으로 수행합니다.
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>전자적 파일: 복구가 불가능한 기술적 방법 사용</li>
                <li>종이 문서: 분쇄기로 파쇄 또는 소각</li>
              </ul>

              <h2 className="text-xl font-bold mb-4">6. 회원의 권리</h2>
              <p className="mb-4">
                회원은 언제든지 다음의 권리를 행사할 수 있습니다.
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>개인정보 열람 및 정정 요청</li>
                <li>개인정보 수집 및 이용에 대한 동의 철회</li>
                <li>개인정보 삭제 요청</li>
                <li>개인정보 처리 정지 요청</li>
              </ul>

              <h2 className="text-xl font-bold mb-4">7. 쿠키(Cookie) 운영</h2>
              <p className="mb-4">
                일데이는 서비스 제공을 위해 쿠키를 사용합니다. 쿠키는 웹사이트가 회원의 컴퓨터 브라우저로 전송하는 소량의 정보이며,
                회원은 브라우저 설정을 통해 쿠키 설치를 거부할 수 있습니다.
              </p>

              <h2 className="text-xl font-bold mb-4">8. 개인정보 보호책임자</h2>
              <p className="mb-4">
                <strong>개인정보 보호책임자</strong><br />
                성명: 홍길동<br />
                직책: 개인정보보호 팀장<br />
                연락처: privacy@ilday.co.kr<br />
                전화: 1588-1234
              </p>

              <h2 className="text-xl font-bold mb-4">9. 개인정보처리방침 변경</h2>
              <p className="mb-4">
                이 개인정보처리방침은 2025년 1월 1일부터 적용됩니다.
                법령이나 서비스의 변경사항을 반영하기 위하여 내용의 추가, 삭제 및 수정이 있을 시에는
                시행 7일 전부터 공지사항을 통해 고지할 것입니다.
              </p>

              <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>공고일자:</strong> 2025년 1월 1일<br />
                  <strong>시행일자:</strong> 2025년 1월 1일
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}