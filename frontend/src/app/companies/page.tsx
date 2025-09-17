'use client'

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const companies = [
    {
      id: 1,
      name: '대한건설',
      industry: '건설/인테리어',
      rating: 4.8,
      reviews: 324,
      jobs: 12,
      description: '30년 전통의 건설 전문 기업',
      verified: true,
    },
    {
      id: 2,
      name: 'CJ대한통운',
      industry: '물류/배송',
      rating: 4.5,
      reviews: 892,
      jobs: 28,
      description: '대한민국 1위 종합물류기업',
      verified: true,
    },
    {
      id: 3,
      name: '청솔도배',
      industry: '인테리어',
      rating: 4.9,
      reviews: 156,
      jobs: 5,
      description: '꼼꼼한 마감, 합리적인 가격',
      verified: true,
    },
  ];

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">기업 정보</h1>

        {/* 검색 */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Input
                placeholder="기업명 또는 업종으로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="default">
                검색
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 기업 목록 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <Card key={company.id} variant="elevated" className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{company.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{company.industry}</p>
                  </div>
                  {company.verified && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      ✅ 인증
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{company.description}</p>
                
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center">
                    <span className="text-yellow-500 mr-1">⭐</span>
                    <span className="font-semibold">{company.rating}</span>
                    <span className="text-gray-500 ml-1">({company.reviews})</span>
                  </div>
                  <div className="text-gray-600">
                    채용중 {company.jobs}건
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" fullWidth>
                    기업정보
                  </Button>
                  <Button variant="default" size="sm" fullWidth>
                    채용공고
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCompanies.length === 0 && (
          <Card variant="default" className="text-center py-12">
            <CardContent>
              <p className="text-gray-500 mb-4">검색 결과가 없습니다</p>
              <Button variant="ghost" onClick={() => setSearchTerm('')}>
                검색 초기화
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}