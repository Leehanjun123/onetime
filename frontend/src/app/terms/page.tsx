'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">이용약관</h1>

        <Card variant="default">
          <CardContent className="p-6">
            <div className="prose max-w-none text-gray-700">
              <h2 className="text-xl font-bold mb-4">제1조 (목적)</h2>
              <p className="mb-4">
                이 약관은 일데이(이하 '회사')가 제공하는 일자리 매칭 서비스의 이용과 관련하여
                회사와 이용자의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>

              <h2 className="text-xl font-bold mb-4">제2조 (정의)</h2>
              <p className="mb-4">
                1. "서비스"란 회사가 제공하는 일자리 매칭 플랫폼을 말합니다.<br />
                2. "회원"이란 본 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 개인 또는 기업을 말합니다.<br />
                3. "구직자"란 일자리를 찾는 개인 회원을 말합니다.<br />
                4. "기업회원"이란 구인을 목적으로 하는 기업 회원을 말합니다.
              </p>

              <h2 className="text-xl font-bold mb-4">제3조 (약관의 효력 및 변경)</h2>
              <p className="mb-4">
                1. 이 약관은 회원이 회원가입을 완료한 때부터 효력이 발생합니다.<br />
                2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 약관을 변경할 수 있습니다.<br />
                3. 약관이 변경되는 경우 회사는 서비스 내 공지사항을 통해 회원에게 알릴 것입니다.
              </p>

              <h2 className="text-xl font-bold mb-4">제4조 (개인정보의 보호)</h2>
              <p className="mb-4">
                회사는 회원의 개인정보를 보호하기 위해 노력하며, 개인정보의 수집 및 이용에 대해서는
                별도의 개인정보처리방침을 따릅니다.
              </p>

              <h2 className="text-xl font-bold mb-4">제5조 (회원의 의무)</h2>
              <p className="mb-4">
                1. 회원은 타인의 명예를 손상시키거나 업무를 방해하는 행위를 하지 않아야 합니다.<br />
                2. 회원은 관계법령, 이 약관의 규정 및 이용안내 등 회사가 통지하는 사항을 준수하여야 합니다.<br />
                3. 회원은 아이디, 비밀번호 등 계정 정보를 안전하게 관리해야 합니다.
              </p>

              <h2 className="text-xl font-bold mb-4">제6조 (서비스 이용제한)</h2>
              <p className="mb-4">
                회사는 회원이 다음 각 호에 해당하는 경우 서비스 이용을 제한할 수 있습니다.<br />
                1. 범죄행위에 악용하는 경우<br />
                2. 허위 정보를 등록하는 경우<br />
                3. 타인의 서비스 이용을 방해하는 경우<br />
                4. 기타 관련 법령에 위배되는 경우
              </p>

              <h2 className="text-xl font-bold mb-4">제7조 (책임제한)</h2>
              <p className="mb-4">
                1. 회사는 천재지변, 전쟁, 기간통신사업자의 서비스 장애 등 불가항력적인 사유로 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.<br />
                2. 회사는 회원간 거래에 대한 책임을 지지 않습니다.
              </p>

              <h2 className="text-xl font-bold mb-4">제8조 (분쟁해결)</h2>
              <p className="mb-4">
                1. 회사와 회원간 발생한 분쟁은 상호 협의하에 해결하는 것을 원칙으로 합니다.<br />
                2. 협의로 해결되지 않는 경우 관할 법원에 제소할 수 있습니다.
              </p>

              <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>부칙</strong><br />
                  이 약관은 2025년 1월 1일부터 시행됩니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}