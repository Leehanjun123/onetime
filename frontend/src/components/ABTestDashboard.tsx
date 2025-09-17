'use client'

import { useState, useEffect } from 'react';
import { 
  getActiveExperiments, 
  analyzeExperimentResults, 
  resetExperiments,
  Experiment 
} from '@/lib/abtest';

export default function ABTestDashboard() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 개발환경 또는 관리자만 접근
    const isDev = process.env.NODE_ENV === 'development';
    const isAdmin = localStorage.getItem('user_role') === 'admin';
    
    if (isDev || isAdmin) {
      setIsVisible(true);
      loadExperiments();
    }
  }, []);

  const loadExperiments = () => {
    const active = getActiveExperiments();
    setExperiments(active);
    
    if (active.length > 0 && !selectedExperiment) {
      setSelectedExperiment(active[0].id);
      loadResults(active[0].id);
    }
  };

  const loadResults = (experimentId: string) => {
    const analysis = analyzeExperimentResults(experimentId);
    setResults(analysis);
  };

  const handleExperimentSelect = (experimentId: string) => {
    setSelectedExperiment(experimentId);
    loadResults(experimentId);
  };

  const calculateConversionRate = (variant: any, metric: string) => {
    if (!variant.samples || !variant.metrics[metric]) return '0%';
    const rate = (variant.metrics[metric].count / variant.samples) * 100;
    return `${rate.toFixed(1)}%`;
  };

  const calculateLift = (control: any, variant: any, metric: string) => {
    if (!control.metrics[metric] || !variant.metrics[metric]) return null;
    
    const controlRate = control.metrics[metric].average;
    const variantRate = variant.metrics[metric].average;
    
    if (controlRate === 0) return null;
    
    const lift = ((variantRate - controlRate) / controlRate) * 100;
    return lift;
  };

  const getStatisticalSignificance = (samples: number) => {
    // 간단한 샘플 크기 기반 신뢰도 (실제로는 통계 검정 필요)
    if (samples < 100) return '낮음';
    if (samples < 500) return '중간';
    if (samples < 1000) return '높음';
    return '매우 높음';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-96 max-h-[600px] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold">🧪 A/B 테스트 대시보드</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          {/* 실험 선택 */}
          <select
            value={selectedExperiment || ''}
            onChange={(e) => handleExperimentSelect(e.target.value)}
            className="w-full bg-white/20 text-white border border-white/30 rounded px-3 py-1 text-sm"
          >
            {experiments.map(exp => (
              <option key={exp.id} value={exp.id} className="text-gray-900">
                {exp.name}
              </option>
            ))}
          </select>
        </div>

        {/* 실험 정보 */}
        {selectedExperiment && experiments.find(e => e.id === selectedExperiment) && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">시작일:</span>
                <span className="font-medium">
                  {new Date(experiments.find(e => e.id === selectedExperiment)!.startDate).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">주요 지표:</span>
                <span className="font-medium text-purple-600">
                  {experiments.find(e => e.id === selectedExperiment)!.primaryMetric}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 결과 표시 */}
        <div className="p-4 overflow-y-auto max-h-[350px]">
          {results ? (
            <div className="space-y-4">
              {/* 전체 통계 */}
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <div className="flex justify-between mb-1">
                    <span>총 샘플 수:</span>
                    <span className="font-bold">{results.totalSamples}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>통계적 신뢰도:</span>
                    <span className="font-bold">
                      {getStatisticalSignificance(results.totalSamples)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 변형별 결과 */}
              {Object.entries(results.variants).map(([variantId, variant]: [string, any]) => {
                const isControl = variantId === 'control';
                const controlData = results.variants.control;
                
                return (
                  <div 
                    key={variantId}
                    className={`rounded-lg p-3 ${
                      isControl ? 'bg-gray-100' : 'bg-green-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">
                        {variant.name}
                        {isControl && <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-0.5 rounded">대조군</span>}
                      </h4>
                      <span className="text-xs text-gray-600">
                        {variant.samples} 샘플
                      </span>
                    </div>

                    {/* 메트릭별 결과 */}
                    <div className="space-y-2">
                      {Object.entries(variant.metrics).map(([metric, data]: [string, any]) => {
                        const lift = !isControl && controlData 
                          ? calculateLift(controlData, variant, metric)
                          : null;
                        
                        return (
                          <div key={metric} className="text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700">{metric}:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {data.average.toFixed(2)}
                                </span>
                                {lift !== null && (
                                  <span className={`font-bold ${
                                    lift > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {lift > 0 ? '↑' : '↓'} {Math.abs(lift).toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="mt-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  isControl ? 'bg-gray-500' : 'bg-green-500'
                                }`}
                                style={{ 
                                  width: `${Math.min(100, (data.count / variant.samples) * 100)}%` 
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* 승자 선언 (충분한 데이터가 있을 때) */}
              {results.totalSamples >= 100 && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <h4 className="font-semibold text-sm text-yellow-800 mb-2">
                    🏆 현재 선두
                  </h4>
                  {(() => {
                    const experiment = experiments.find(e => e.id === selectedExperiment);
                    if (!experiment) return null;
                    
                    const primaryMetric = experiment.primaryMetric;
                    let winner = null;
                    let maxValue = -Infinity;
                    
                    Object.entries(results.variants).forEach(([id, variant]: [string, any]) => {
                      const value = variant.metrics[primaryMetric]?.average || 0;
                      if (value > maxValue) {
                        maxValue = value;
                        winner = { id, ...variant };
                      }
                    });
                    
                    if (!winner) return null;
                    
                    return (
                      <div className="text-sm">
                        <span className="font-medium">{winner.name}</span>
                        <span className="text-gray-600 ml-2">
                          ({primaryMetric}: {maxValue.toFixed(2)})
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">아직 수집된 데이터가 없습니다</p>
              <p className="text-xs mt-2">사용자 활동이 추적되면 여기에 표시됩니다</p>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={() => {
                loadResults(selectedExperiment!);
              }}
              className="flex-1 bg-purple-600 text-white py-2 rounded text-sm font-medium hover:bg-purple-700"
            >
              🔄 새로고침
            </button>
            <button
              onClick={() => {
                if (confirm('모든 실험 데이터를 초기화하시겠습니까?')) {
                  resetExperiments();
                  loadResults(selectedExperiment!);
                }
              }}
              className="px-4 py-2 bg-red-100 text-red-600 rounded text-sm font-medium hover:bg-red-200"
            >
              초기화
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// A/B 테스트 토글 버튼
export function ABTestDashboardToggle() {
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl + Shift + E로 대시보드 토글
      if (event.ctrlKey && event.shiftKey && event.key === 'E') {
        setShowDashboard(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const isDev = process.env.NODE_ENV === 'development';
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('user_role') === 'admin';

  if (!isDev && !isAdmin) return null;

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setShowDashboard(!showDashboard)}
        className="fixed bottom-4 right-20 z-40 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="A/B 테스트 대시보드 (Ctrl+Shift+E)"
      >
        🧪
      </button>
      
      {/* 대시보드 */}
      {showDashboard && <ABTestDashboard />}
    </>
  );
}