'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import { companyAPI } from '@/lib/api';

interface Company {
  id?: string;
  businessName: string;
  businessNumber: string;
  ceoName: string;
  businessType?: string;
  businessAddress?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  establishedDate?: string;
  employeeCount?: number;
  description?: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
  verifiedAt?: string;
  rejectedReason?: string;
  verificationDocs?: VerificationDocument[];
}

interface VerificationDocument {
  id: string;
  type: 'BUSINESS_LICENSE' | 'CORPORATE_SEAL' | 'BANK_ACCOUNT' | 'TAX_INVOICE' | 'COMPANY_PROFILE' | 'OTHER';
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
}

export default function CompanyVerificationPage() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'status'>('info');
  
  const [company, setCompany] = useState<Company>({
    businessName: '',
    businessNumber: '',
    ceoName: '',
    businessType: '',
    businessAddress: '',
    phoneNumber: '',
    email: '',
    website: '',
    establishedDate: '',
    employeeCount: undefined,
    description: '',
    verificationStatus: 'PENDING',
    verificationDocs: []
  });

  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.userType !== 'EMPLOYER') {
      router.push('/');
      return;
    }
    fetchCompanyInfo();
  }, [isAuthenticated, user, router]);

  const fetchCompanyInfo = async () => {
    setLoading(true);
    try {
      const response = await companyAPI.getCompany();
      if (response.data) {
        setCompany(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch company info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompanyInfo = async () => {
    if (!company.businessName || !company.businessNumber || !company.ceoName) {
      alert('사업자명, 사업자번호, 대표자명은 필수입니다.');
      return;
    }

    setSaving(true);
    try {
      const response = await companyAPI.saveCompany({
        businessName: company.businessName,
        businessNumber: company.businessNumber,
        ceoName: company.ceoName,
        businessType: company.businessType,
        businessAddress: company.businessAddress,
        phoneNumber: company.phoneNumber,
        email: company.email,
        website: company.website,
        establishedDate: company.establishedDate,
        employeeCount: company.employeeCount,
        description: company.description
      });
      setCompany(response.data);
      alert('회사 정보가 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save company info:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (type: VerificationDocument['type'], file: File) => {
    setUploadingFile(type);
    try {
      // 실제 파일 업로드 구현은 추후 필요 (예: AWS S3, 로컬 스토리지 등)
      // 현재는 임시로 파일 정보만 저장
      const mockFilePath = `/uploads/${file.name}`;
      
      const response = await companyAPI.uploadDocument({
        type,
        fileName: file.name,
        filePath: mockFilePath,
        fileSize: file.size,
        mimeType: file.type
      });

      // 문서 목록 업데이트
      setCompany(prev => ({
        ...prev,
        verificationDocs: prev.verificationDocs ? 
          [...prev.verificationDocs.filter(doc => doc.type !== type), response.data] :
          [response.data]
      }));

      alert('파일이 업로드되었습니다.');
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setUploadingFile(null);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('이 문서를 삭제하시겠습니까?')) return;

    try {
      await companyAPI.deleteDocument(id);
      setCompany(prev => ({
        ...prev,
        verificationDocs: prev.verificationDocs?.filter(doc => doc.id !== id) || []
      }));
      alert('문서가 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleSubmitVerification = async () => {
    if (!confirm('인증을 신청하시겠습니까? 신청 후에는 취소할 수 없습니다.')) return;

    try {
      const response = await companyAPI.submitVerification();
      setCompany(response.data);
      alert('인증 신청이 완료되었습니다. 검토까지 2-3일 소요됩니다.');
    } catch (error: any) {
      console.error('Failed to submit verification:', error);
      alert(error.response?.data?.error || '인증 신청에 실패했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-gray-100 text-gray-800',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      PENDING: '인증 대기',
      UNDER_REVIEW: '검토 중',
      APPROVED: '인증 완료',
      REJECTED: '인증 거절'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getDocumentTypeName = (type: string) => {
    const names = {
      BUSINESS_LICENSE: '사업자등록증',
      CORPORATE_SEAL: '법인인감증명서',
      BANK_ACCOUNT: '통장사본',
      TAX_INVOICE: '부가세신고서',
      COMPANY_PROFILE: '회사소개서',
      OTHER: '기타'
    };
    return names[type as keyof typeof names] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">회사 인증</h1>
                <p className="text-gray-600 mt-2">회사 정보를 등록하고 인증을 받아보세요</p>
              </div>
              <div>
                {getStatusBadge(company.verificationStatus)}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'info', label: '회사 정보' },
                { key: 'documents', label: '인증 서류' },
                { key: 'status', label: '인증 상태' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Company Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      사업자명 *
                    </label>
                    <input
                      type="text"
                      value={company.businessName}
                      onChange={(e) => setCompany(prev => ({ ...prev, businessName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="주식회사 원타임"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      사업자번호 *
                    </label>
                    <input
                      type="text"
                      value={company.businessNumber}
                      onChange={(e) => setCompany(prev => ({ ...prev, businessNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="123-45-67890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      대표자명 *
                    </label>
                    <input
                      type="text"
                      value={company.ceoName}
                      onChange={(e) => setCompany(prev => ({ ...prev, ceoName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="홍길동"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      업종
                    </label>
                    <input
                      type="text"
                      value={company.businessType || ''}
                      onChange={(e) => setCompany(prev => ({ ...prev, businessType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="IT 서비스업"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      회사 전화번호
                    </label>
                    <input
                      type="tel"
                      value={company.phoneNumber || ''}
                      onChange={(e) => setCompany(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="02-1234-5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      회사 이메일
                    </label>
                    <input
                      type="email"
                      value={company.email || ''}
                      onChange={(e) => setCompany(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="info@onetime.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      웹사이트
                    </label>
                    <input
                      type="url"
                      value={company.website || ''}
                      onChange={(e) => setCompany(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://www.onetime.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      설립일
                    </label>
                    <input
                      type="date"
                      value={company.establishedDate || ''}
                      onChange={(e) => setCompany(prev => ({ ...prev, establishedDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      직원수
                    </label>
                    <input
                      type="number"
                      value={company.employeeCount || ''}
                      onChange={(e) => setCompany(prev => ({ ...prev, employeeCount: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사업장 주소
                  </label>
                  <input
                    type="text"
                    value={company.businessAddress || ''}
                    onChange={(e) => setCompany(prev => ({ ...prev, businessAddress: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="서울시 강남구 역삼동 123-45"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    회사 소개
                  </label>
                  <textarea
                    value={company.description || ''}
                    onChange={(e) => setCompany(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="회사에 대한 간단한 소개를 입력하세요"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveCompanyInfo}
                    disabled={saving}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">인증 서류 안내</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>• 사업자등록증은 필수 서류입니다.</p>
                        <p>• 파일 형식: PDF, JPG, PNG (최대 10MB)</p>
                        <p>• 모든 정보가 명확하게 보이도록 선명한 파일을 업로드해주세요.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {[
                  { type: 'BUSINESS_LICENSE', label: '사업자등록증', required: true },
                  { type: 'CORPORATE_SEAL', label: '법인인감증명서', required: false },
                  { type: 'BANK_ACCOUNT', label: '통장사본', required: false },
                  { type: 'TAX_INVOICE', label: '부가세신고서', required: false },
                  { type: 'COMPANY_PROFILE', label: '회사소개서', required: false },
                  { type: 'OTHER', label: '기타 서류', required: false }
                ].map(({ type, label, required }) => {
                  const existingDoc = company.verificationDocs?.find(doc => doc.type === type);
                  
                  return (
                    <div key={type} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">
                          {label} {required && <span className="text-red-500">*</span>}
                        </h3>
                        {existingDoc && (
                          <button
                            onClick={() => handleDeleteDocument(existingDoc.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                      
                      {existingDoc ? (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {existingDoc.fileName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {existingDoc.fileSize && formatFileSize(existingDoc.fileSize)} • {formatDate(existingDoc.uploadedAt)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 10 * 1024 * 1024) {
                                  alert('파일 크기는 10MB를 초과할 수 없습니다.');
                                  return;
                                }
                                handleFileUpload(type as VerificationDocument['type'], file);
                              }
                            }}
                            disabled={uploadingFile === type}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                          {uploadingFile === type && (
                            <p className="text-sm text-indigo-600 mt-1">업로드 중...</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Status Tab */}
            {activeTab === 'status' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    {company.verificationStatus === 'APPROVED' ? (
                      <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : company.verificationStatus === 'REJECTED' ? (
                      <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : company.verificationStatus === 'UNDER_REVIEW' ? (
                      <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {getStatusBadge(company.verificationStatus)}
                  </h2>
                  
                  {company.verificationStatus === 'APPROVED' && company.verifiedAt && (
                    <p className="text-gray-600">
                      {formatDate(company.verifiedAt)}에 인증 완료
                    </p>
                  )}
                  
                  {company.verificationStatus === 'REJECTED' && company.rejectedReason && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm font-medium text-red-800">거절 사유:</p>
                      <p className="text-sm text-red-700 mt-1">{company.rejectedReason}</p>
                    </div>
                  )}
                  
                  {company.verificationStatus === 'UNDER_REVIEW' && (
                    <p className="text-gray-600">
                      검토가 진행 중입니다. 2-3일 내에 결과를 알려드립니다.
                    </p>
                  )}
                </div>

                {(company.verificationStatus === 'PENDING' || company.verificationStatus === 'REJECTED') && (
                  <div className="text-center">
                    <button
                      onClick={handleSubmitVerification}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 font-medium"
                    >
                      인증 신청하기
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      회사 정보와 필수 서류를 모두 등록한 후 신청해주세요.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}