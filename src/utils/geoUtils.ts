/**
 * 두 지점 간의 거리를 계산하는 유틸리티
 */

interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Haversine 공식을 사용하여 두 지점 간의 거리를 계산 (단위: km)
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371; // 지구의 반지름 (km)
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(point1.latitude)) * Math.cos(toRadians(point2.latitude)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // 소수점 둘째 자리까지
}

/**
 * 각도를 라디안으로 변환
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * 주소를 좌표로 변환 (간단한 한국 주요 도시 매핑)
 * 실제 운영에서는 카카오맵 API, Google Maps API 등을 사용해야 함
 */
export function addressToCoordinates(address: string): Coordinates | null {
  const cityCoordinates: Record<string, Coordinates> = {
    '서울': { latitude: 37.5665, longitude: 126.9780 },
    '부산': { latitude: 35.1796, longitude: 129.0756 },
    '대구': { latitude: 35.8714, longitude: 128.6014 },
    '인천': { latitude: 37.4563, longitude: 126.7052 },
    '광주': { latitude: 35.1595, longitude: 126.8526 },
    '대전': { latitude: 36.3504, longitude: 127.3845 },
    '울산': { latitude: 35.5384, longitude: 129.3114 },
    '세종': { latitude: 36.4800, longitude: 127.2890 },
    '수원': { latitude: 37.2636, longitude: 127.0286 },
    '성남': { latitude: 37.4449, longitude: 127.1388 },
    '고양': { latitude: 37.6564, longitude: 126.8347 },
    '용인': { latitude: 37.2410, longitude: 127.1776 },
    '부천': { latitude: 37.5034, longitude: 126.7660 },
    '안산': { latitude: 37.3218, longitude: 126.8309 },
    '안양': { latitude: 37.3943, longitude: 126.9568 },
    '남양주': { latitude: 37.6369, longitude: 127.2167 },
    '화성': { latitude: 37.1996, longitude: 126.8312 },
    '평택': { latitude: 36.9922, longitude: 127.1127 },
    '의정부': { latitude: 37.7381, longitude: 127.0338 },
    '시흥': { latitude: 37.3799, longitude: 126.8030 }
  };

  // 주소에서 도시명 추출
  for (const city in cityCoordinates) {
    if (address.includes(city)) {
      return cityCoordinates[city];
    }
  }

  return null;
}

/**
 * 좌표를 기반으로 반경 내 지역 확인
 */
export function isWithinRadius(
  center: Coordinates, 
  point: Coordinates, 
  radiusKm: number
): boolean {
  const distance = calculateDistance(center, point);
  return distance <= radiusKm;
}

/**
 * 여러 지점 중 가장 가까운 지점 찾기
 */
export function findNearestPoint(
  reference: Coordinates, 
  points: Array<{ id: string; coordinates: Coordinates }>
): { id: string; coordinates: Coordinates; distance: number } | null {
  if (points.length === 0) return null;

  let nearest = points[0];
  let minDistance = calculateDistance(reference, nearest.coordinates);

  for (let i = 1; i < points.length; i++) {
    const distance = calculateDistance(reference, points[i].coordinates);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = points[i];
    }
  }

  return {
    ...nearest,
    distance: minDistance
  };
}

/**
 * 지역별 교통비 계산 (간단한 추정)
 */
export function estimateTransportationCost(distanceKm: number): number {
  // 기본 교통비 계산 (대중교통 기준)
  if (distanceKm <= 10) {
    return 1370; // 지하철/버스 기본요금
  } else if (distanceKm <= 40) {
    return 2150; // 수도권 통합요금
  } else {
    return Math.ceil(distanceKm / 10) * 1000; // 장거리는 km당 약 1000원
  }
}

/**
 * 이동 시간 추정 (분 단위)
 */
export function estimateTravelTime(distanceKm: number, transportMode: 'walking' | 'public' | 'car' = 'public'): number {
  const speeds = {
    walking: 4,   // 4km/h
    public: 25,   // 25km/h (대중교통 평균)
    car: 35       // 35km/h (도심 운전 평균)
  };

  const timeHours = distanceKm / speeds[transportMode];
  return Math.ceil(timeHours * 60); // 분 단위로 반환
}