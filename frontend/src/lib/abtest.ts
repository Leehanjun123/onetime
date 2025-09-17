// A/B 테스트 프레임워크
import { trackEvent } from '@/components/Analytics';

// 실험 타입 정의
export interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: Variant[];
  targetAudience?: TargetAudience;
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'running' | 'paused' | 'completed';
  primaryMetric: string;
  secondaryMetrics?: string[];
}

export interface Variant {
  id: string;
  name: string;
  weight: number; // 0-100 트래픽 비율
  changes: Record<string, any>;
  isControl?: boolean;
}

export interface TargetAudience {
  userType?: 'JOB_SEEKER' | 'EMPLOYER';
  device?: 'mobile' | 'desktop';
  location?: string[];
  newUser?: boolean;
}

// 실험 결과 타입
export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  userId: string;
  timestamp: number;
  metrics: Record<string, any>;
}

// 현재 활성 실험들
const ACTIVE_EXPERIMENTS: Experiment[] = [
  {
    id: 'homepage_hero_v2',
    name: '홈페이지 히어로 섹션 최적화',
    description: '건설 근로자 대상 CTA 문구 및 이미지 테스트',
    status: 'running',
    startDate: new Date('2025-09-01'),
    primaryMetric: 'registration_rate',
    secondaryMetrics: ['bounce_rate', 'time_on_page'],
    variants: [
      {
        id: 'control',
        name: '기존 버전',
        weight: 50,
        isControl: true,
        changes: {
          headline: '오늘 일하고 오늘 받자',
          cta: '일자리 찾기',
          image: 'construction-worker-1.jpg'
        }
      },
      {
        id: 'variant_a',
        name: '긴급성 강조',
        weight: 50,
        changes: {
          headline: '지금 바로 오늘 일자리!',
          cta: '즉시 지원하기',
          image: 'construction-worker-urgent.jpg'
        }
      }
    ]
  },
  {
    id: 'job_card_layout',
    name: '일자리 카드 레이아웃 테스트',
    description: '정보 표시 방식 및 CTA 버튼 최적화',
    status: 'running',
    startDate: new Date('2025-09-05'),
    primaryMetric: 'application_rate',
    variants: [
      {
        id: 'control',
        name: '현재 레이아웃',
        weight: 33,
        isControl: true,
        changes: {
          layout: 'card',
          ctaButton: 'call',
          showSalary: true
        }
      },
      {
        id: 'variant_a',
        name: '리스트 뷰',
        weight: 33,
        changes: {
          layout: 'list',
          ctaButton: 'call',
          showSalary: true
        }
      },
      {
        id: 'variant_b',
        name: '큰 카드 + 빠른 지원',
        weight: 34,
        changes: {
          layout: 'large_card',
          ctaButton: 'quick_apply',
          showSalary: true
        }
      }
    ]
  },
  {
    id: 'registration_flow',
    name: '회원가입 플로우 간소화',
    description: '단계 축소 및 소셜 로그인 테스트',
    status: 'running',
    startDate: new Date('2025-09-07'),
    primaryMetric: 'registration_completion_rate',
    targetAudience: {
      newUser: true,
      device: 'mobile'
    },
    variants: [
      {
        id: 'control',
        name: '3단계 가입',
        weight: 50,
        isControl: true,
        changes: {
          steps: 3,
          socialLogin: false,
          phoneFirst: false
        }
      },
      {
        id: 'variant_a',
        name: '전화번호 우선 + 1단계',
        weight: 50,
        changes: {
          steps: 1,
          socialLogin: true,
          phoneFirst: true
        }
      }
    ]
  }
];

// 사용자별 실험 할당 저장
const EXPERIMENT_ASSIGNMENTS_KEY = 'ab_test_assignments';

// 사용자 ID 가져오기 (익명 ID 생성 또는 로그인 ID 사용)
function getUserId(): string {
  const storedId = localStorage.getItem('anonymous_user_id');
  if (storedId) return storedId;
  
  const newId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('anonymous_user_id', newId);
  return newId;
}

// 사용자를 실험 변형에 할당
export function assignUserToVariant(experimentId: string): Variant | null {
  const experiment = ACTIVE_EXPERIMENTS.find(exp => exp.id === experimentId);
  if (!experiment || experiment.status !== 'running') return null;

  // 타겟 오디언스 체크
  if (experiment.targetAudience) {
    if (!isUserInTargetAudience(experiment.targetAudience)) {
      return null;
    }
  }

  const userId = getUserId();
  
  // 기존 할당 확인
  const assignments = getExperimentAssignments();
  if (assignments[experimentId]) {
    const variant = experiment.variants.find(v => v.id === assignments[experimentId]);
    if (variant) return variant;
  }

  // 새로운 할당
  const variant = selectVariantByWeight(experiment.variants);
  if (variant) {
    saveExperimentAssignment(experimentId, variant.id);
    
    // 할당 이벤트 추적
    trackEvent('ab_test_assignment', {
      event_category: 'experimentation',
      experiment_id: experimentId,
      experiment_name: experiment.name,
      variant_id: variant.id,
      variant_name: variant.name,
      is_control: variant.isControl || false
    });
  }

  return variant;
}

// 가중치 기반 변형 선택
function selectVariantByWeight(variants: Variant[]): Variant {
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  const random = Math.random() * totalWeight;
  
  let cumulativeWeight = 0;
  for (const variant of variants) {
    cumulativeWeight += variant.weight;
    if (random < cumulativeWeight) {
      return variant;
    }
  }
  
  return variants[variants.length - 1];
}

// 타겟 오디언스 확인
function isUserInTargetAudience(audience: TargetAudience): boolean {
  // 디바이스 체크
  if (audience.device) {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (audience.device === 'mobile' && !isMobile) return false;
    if (audience.device === 'desktop' && isMobile) return false;
  }

  // 신규 사용자 체크
  if (audience.newUser !== undefined) {
    const isNewUser = !localStorage.getItem('returning_user');
    if (audience.newUser !== isNewUser) return false;
  }

  // 사용자 타입 체크
  if (audience.userType) {
    const userType = localStorage.getItem('user_type');
    if (userType !== audience.userType) return false;
  }

  return true;
}

// 실험 할당 저장
function saveExperimentAssignment(experimentId: string, variantId: string): void {
  const assignments = getExperimentAssignments();
  assignments[experimentId] = variantId;
  localStorage.setItem(EXPERIMENT_ASSIGNMENTS_KEY, JSON.stringify(assignments));
}

// 실험 할당 가져오기
function getExperimentAssignments(): Record<string, string> {
  const stored = localStorage.getItem(EXPERIMENT_ASSIGNMENTS_KEY);
  return stored ? JSON.parse(stored) : {};
}

// 실험 성과 추적
export function trackExperimentConversion(
  experimentId: string, 
  metricName: string, 
  value: number = 1
): void {
  const assignments = getExperimentAssignments();
  const variantId = assignments[experimentId];
  
  if (!variantId) return;

  const experiment = ACTIVE_EXPERIMENTS.find(exp => exp.id === experimentId);
  const variant = experiment?.variants.find(v => v.id === variantId);

  if (!experiment || !variant) return;

  // 전환 이벤트 추적
  trackEvent('ab_test_conversion', {
    event_category: 'experimentation',
    experiment_id: experimentId,
    experiment_name: experiment.name,
    variant_id: variantId,
    variant_name: variant.name,
    is_control: variant.isControl || false,
    metric_name: metricName,
    metric_value: value
  });

  // 결과 저장 (로컬 스토리지 또는 API 호출)
  saveExperimentResult({
    experimentId,
    variantId,
    userId: getUserId(),
    timestamp: Date.now(),
    metrics: {
      [metricName]: value
    }
  });
}

// 실험 결과 저장
function saveExperimentResult(result: ExperimentResult): void {
  // 실제 환경에서는 백엔드 API로 전송
  const results = getStoredResults();
  results.push(result);
  localStorage.setItem('ab_test_results', JSON.stringify(results));

  // API 호출 (비동기)
  sendResultToBackend(result).catch(console.error);
}

// 저장된 결과 가져오기
function getStoredResults(): ExperimentResult[] {
  const stored = localStorage.getItem('ab_test_results');
  return stored ? JSON.parse(stored) : [];
}

// 백엔드로 결과 전송
async function sendResultToBackend(result: ExperimentResult): Promise<void> {
  try {
    const response = await fetch('/api/experiments/results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(result)
    });

    if (!response.ok) {
      throw new Error('Failed to send experiment result');
    }
  } catch (error) {
    console.error('Error sending experiment result:', error);
    // 재시도 로직 또는 큐에 저장
  }
}

// React Hook for A/B Testing
export function useABTest(experimentId: string): Variant | null {
  if (typeof window === 'undefined') return null;
  
  return assignUserToVariant(experimentId);
}

// 실험 상태 확인
export function getExperimentStatus(experimentId: string): Experiment | null {
  return ACTIVE_EXPERIMENTS.find(exp => exp.id === experimentId) || null;
}

// 모든 활성 실험 가져오기
export function getActiveExperiments(): Experiment[] {
  return ACTIVE_EXPERIMENTS.filter(exp => exp.status === 'running');
}

// 실험 결과 분석 (간단한 통계)
export function analyzeExperimentResults(experimentId: string): any {
  const results = getStoredResults().filter(r => r.experimentId === experimentId);
  const experiment = ACTIVE_EXPERIMENTS.find(exp => exp.id === experimentId);
  
  if (!experiment || results.length === 0) return null;

  const analysis: any = {
    experimentId,
    experimentName: experiment.name,
    totalSamples: results.length,
    variants: {}
  };

  // 변형별 결과 집계
  experiment.variants.forEach(variant => {
    const variantResults = results.filter(r => r.variantId === variant.id);
    
    analysis.variants[variant.id] = {
      name: variant.name,
      samples: variantResults.length,
      metrics: {}
    };

    // 메트릭별 집계
    const allMetrics = new Set<string>();
    variantResults.forEach(r => {
      Object.keys(r.metrics).forEach(metric => allMetrics.add(metric));
    });

    allMetrics.forEach(metric => {
      const values = variantResults
        .map(r => r.metrics[metric])
        .filter(v => v !== undefined);
      
      analysis.variants[variant.id].metrics[metric] = {
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        average: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
      };
    });
  });

  return analysis;
}

// 실험 리셋 (테스트용)
export function resetExperiments(): void {
  localStorage.removeItem(EXPERIMENT_ASSIGNMENTS_KEY);
  localStorage.removeItem('ab_test_results');
  localStorage.removeItem('anonymous_user_id');
}