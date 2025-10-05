# 🎯 우주 거주지 레이아웃 평가 시스템 - 상세 로직 가이드

## 📋 목차
1. [평가 시스템 개요](#1-평가-시스템-개요)
2. [기본 제약 조건 검증](#2-기본-제약-조건-검증)
3. [종합 점수 계산](#3-종합-점수-계산)
4. [피드백 생성 시스템](#4-피드백-생성-시스템)
5. [출력 결과 구조](#5-출력-결과-구조)
6. [평가 예시](#6-평가-예시)

---

## 1. 평가 시스템 개요

### 1.1 평가 프로세스 흐름
```
사용자 배치 입력
    ↓
[1단계] 기본 제약 조건 검증
    ├─ 모든 모듈 사용 확인 (18개)
    ├─ 모듈 겹침 검사
    ├─ 거주지 공간 적합성
    └─ NHV 최소 부피 만족 확인
    ↓
검증 실패 → 패널티 점수 100점 + 오류 피드백 반환
    ↓
검증 성공
    ↓
[2단계] 종합 점수 계산
    ├─ 공간 활용도 (40%)
    ├─ 쾌적성 (30%)
    └─ 효율성 (30%)
    ↓
[3단계] 피드백 생성
    ├─ 강점 분석
    └─ 개선점 제안
    ↓
최종 평가 결과 반환
```

### 1.2 핵심 평가 항목

| 항목 | 가중치 | 설명 |
|-----|--------|------|
| **공간 활용도** | 40% | NHV 적정성 + 전체 공간 활용률 |
| **쾌적성** | 30% | 소음분리 + 사생활보호 + 청결구역분리 |
| **효율성** | 30% | 업무공간 효율성 (작업공간 배치) |

---

## 2. 기본 제약 조건 검증

기본 제약 조건을 **하나라도 위반하면 즉시 평가 실패**로 처리되며, **패널티 점수 100점**이 부과됩니다.

### 2.1 모든 모듈 사용 검증 (`checkAllModulesUsed`)

#### 검증 기준
- 정확히 **18개의 고유한 모듈**이 배치되어야 함
- 중복 모듈 ID는 1개로 간주

#### 실패 시 피드백
```
"All 18 modules must be used. Currently missing modules."
```

---

### 2.2 모듈 겹침 검증 (`checkNoOverlapping`)

#### 검증 기준
- **경계 구(Bounding Sphere)** 기반 겹침 검사
- 각 모듈을 감싸는 가상의 구의 반지름 계산: `√(w² + h² + d²) / 2`
- 두 모듈의 중심점 거리 < (반지름1 + 반지름2)이면 겹침으로 판정
- 회전과 상관없이 정확한 겹침 검사 가능

#### 실패 시 피드백
```
"Modules must not overlap with each other."
```

---

### 2.3 거주지 공간 적합성 검증 (`checkFitInHabitat`)

#### 검증 기준
- **회전된 모듈의 8개 꼭짓점**이 모두 거주지 경계 내에 있는지 확인
- X, Y축 회전(rotation.x, rotation.y)을 고려한 꼭짓점 좌표 계산 (Z축은 고정)
- 모든 꼭짓점이 `0 ≤ x ≤ habitatX`, `0 ≤ y ≤ habitatY`, `0 ≤ z ≤ habitatZ` 범위 내에 있어야 함
- 회전으로 인한 벽 뚫림 현상 방지

#### 실패 시 피드백
```
"All modules must be placed within the habitat space."
```

---

### 2.4 NHV 최소 부피 만족 검증 (`checkNhvSatisfied`)

#### 검증 기준
- **NHV (Net Habitable Volume)**: 모듈의 최소 요구 거주 가능 부피
- 사용자가 배치한 모듈 크기 ≥ 모듈의 최소 NHV 요구사항
- **중요**: 이 조건은 **필수 제약**으로, 미충족 시 즉시 실패

#### 실패 시 피드백 (상세)
```
"Some modules do not meet the minimum NHV (Net Habitable Volume) requirements:
Module3(Sleeping-1): UserVolume=4.50m³, RequiredNHV=5.00m³, Deficit=0.50m³
Module7(Galley-1): UserVolume=6.00m³, RequiredNHV=6.80m³, Deficit=0.80m³

Please increase module sizes."
```

---

## 3. 종합 점수 계산

기본 제약 조건을 모두 통과한 경우, 다음 3가지 항목의 점수를 계산합니다.

---

### 3.1 공간 활용도 (Space Utilization) - 40%

공간 활용도는 **NHV 적정성 점수 (50%)**와 **전체 공간 활용도 점수 (50%)**의 평균입니다.

#### 3.1.1 NHV 적정성 점수 (`calculateNhvEfficiencyScore`)

각 모듈별로 `사용자 부피 / 최소 NHV` 비율을 계산하여 점수를 부여합니다.

##### 점수 산정 기준

| 비율 범위 | 점수 | 설명 |
|----------|------|------|
| `ratio < 1.0` | **실패** | 기본 제약 조건에서 이미 차단됨 |
| `1.0 ≤ ratio ≤ 1.10` | **100점** | 적정성 보너스 (효율적 설계) |
| `1.10 < ratio ≤ 1.35` | **100점** | 정상 범위 (최적 설계) |
| `1.35 < ratio ≤ 2.0` | **100 → 0점** | 선형 감소 (과다 설계) |
| `ratio > 2.0` | **0점** | 공간 낭비 심각 |

---

#### 3.1.2 전체 공간 활용도 점수 (`calculateOverallUtilizationScore`)

전체 거주지 부피 대비 필수 NHV의 비율을 기반으로 점수를 산정합니다.

##### 활용률 계산
```
활용률 (%) = (Σ 모든 모듈의 NHV) / 거주지 총 부피 × 100
```

##### 점수 산정 기준

| 활용률 범위 | 점수 | 설명 |
|-----------|------|------|
| `< 40%` | **0점** | 공간 과다 (비효율적) |
| `40% ~ 60%` | **0 → 80점** | 선형 증가 |
| `60% ~ 70%` | **80 → 100점** | 선형 증가 |
| `70% ~ 77.5%` | **100점** | 최적 설계 구간 ⭐ |
| `77.5% ~ 85%` | **100 → 80점** | 선형 감소 (약간 과밀) |
| `85% ~ 100%` | **80 → 0점** | 선형 감소 (과밀 설계) |
| `> 100%` | **0점** | 불가능한 설계 |

##### 최종 공간 활용도 점수
```
공간 활용도 = (NHV 적정성 점수 × 0.5) + (전체 활용도 점수 × 0.5)
```

---

### 3.2 쾌적성 (Comfortability) - 30%

쾌적성은 다음 3가지 항목의 평균으로 계산됩니다:
1. **소음 분리** (33.3%)
2. **사생활 보호** (33.3%)
3. **청결 구역 분리** (33.3%)

---

#### 3.2.1 소음 분리 점수 (`calculateNoiseSimplicityScore`)

"Quiet Required" 태그가 있는 모듈이 "Noise Generating" 태그가 있는 모듈로부터 받는 소음 노출을 계산합니다.

##### 관련 태그
- **소음원 모듈**: `Noise Generating` 태그
- **조용한 모듈**: `Quiet Required` 태그

##### 소음 노출 계산 (Exposure)
각 조용한 모듈이 받는 소음 노출도:
```
Exposure_j = Σ [S_i × Atten(d_ij)]

여기서:
- S_i = 1.0 (소음원 상대강도)
- Atten(d) = 1 / (1 + k·d)  (k = 0.3, d = 거리)
- d_ij = 소음원 i와 조용한 모듈 j 간의 3D 유클리드 거리
```

##### 소음 유틸리티 계산
```
Utility = clamp(1 - Exposure / 0.5, 0, 1) × 100

여기서:
- Exposure_ref = 0.5 (참조 임계값)
- 점수 범위: 0 ~ 100점
```

---

#### 3.2.2 사생활 보호 점수 (`calculatePrivacyScore`)

"Private Space" 태그가 있는 모듈과 "Common Space" 태그가 있는 모듈 간의 거리를 기반으로 점수를 산정합니다.

##### 관련 태그
- **개인 모듈**: `Private Space` 태그
- **공용 모듈**: `Common Space` 태그

##### D_good 계산 (목표 거리)
```
D_good = min(거주지 x, y, z) / 3.0
```
- 거주지 크기에 비례하여 적정 거리를 자동 계산

##### 점수 산정 기준
각 개인 모듈에서 가장 가까운 공용 모듈까지의 거리를 측정:

```
점수 = {
    0점          (distance ≤ 0)
    선형 보간      (0 < distance < D_good)
    100점        (distance ≥ D_good)
}
```

---

#### 3.2.3 청결 구역 분리 점수 (`calculateCleanlinessScore`)

"Clean Zone" 태그가 있는 모듈과 "Contamination Zone" 태그가 있는 모듈 간의 거리를 기반으로 점수를 산정합니다.

##### 관련 태그
- **청결 모듈**: `Clean Zone` 태그 (예: 주방, 의료실)
- **오염 모듈**: `Contamination Zone` 태그 (예: 화장실, 쓰레기 처리)

##### 점수 산정 기준
사생활 보호 점수와 동일한 로직 적용:

```
D_good = min(거주지 x, y, z) / 3.0

점수 = {
    0점          (distance ≤ 0)
    선형 보간      (0 < distance < D_good)
    100점        (distance ≥ D_good)
}
```

##### 최종 쾌적성 점수
```
쾌적성 = (소음분리 + 사생활보호 + 청결구역분리) / 3.0
```

---

### 3.3 효율성 (Efficiency) - 30%

현재는 **업무 효율성** 점수만 계산합니다.

#### 3.3.1 업무 효율성 점수 (`calculateTaskEfficiencyScore`)

"Work Space" 태그가 있는 모듈들 간의 평균 거리를 기반으로 점수를 산정합니다.

##### 관련 태그
- **작업 모듈**: `Work Space` 태그

##### 거주지 기반 기준값 계산

```
1. 최대 가능 거리 (대각선):
   max_distance = √(x² + y² + z²)

2. 허용 최대 거리:
   acceptable_max = max_distance × 0.7

3. 이상적 최소 거리:
   ideal_min = 2.0m
```

##### 평균 거리 계산
작업공간들 간의 모든 쌍 거리의 평균 (맨해튼 거리 사용):
```java
// 맨해튼 거리: |x1-x2| + |y1-y2| + |z1-z2|
double distance = calculateManhattanDistance(pos1, pos2);
double averageDistance = totalDistance / pairCount;
```

##### 거리 기반 유틸리티 (40%)
```
utility_distance = {
    (avgDist / 2.0) × 0.5   (avgDist < 2.0m, 너무 가까움)
    0.0                      (avgDist > 0.7×대각선, 너무 멀음)
    선형 보간                 (2.0m ≤ avgDist ≤ 0.7×대각선)
}
```

##### D_good 계산 (60%)
각 작업공간 모듈의 크기 기반:
```
D_good = min(모듈 width, height, depth) / 2.0

평균 D_good = Σ D_good / 작업공간 수
```

##### 최종 효율성 점수
```
효율성 = (거리 유틸리티 × 0.4) + (평균 D_good × 0.6) × 100
```

---

### 3.4 종합 점수 (Overall Score)

#### 가중치 적용
```
종합 점수 = (공간 활용도 × 0.4) + (쾌적성 × 0.3) + (효율성 × 0.3)
```

---

## 4. 피드백 생성 시스템

평가 점수를 기반으로 **강점(Strengths)**과 **개선점(Improvements)** 피드백을 자동 생성합니다.

### 4.1 강점 피드백 (`generateStrengthsFeedback`)

#### 피드백 조건

| 점수 기준 | 피드백 메시지 |
|----------|--------------|
| 공간활용도 ≥ 85 | "Excellent space utilization. NHV optimization and overall space efficiency are outstanding." |
| 쾌적성 ≥ 80 | "Comfortable module arrangement achieved. Well separated from noise and contamination sources." |
| 효율성 ≥ 80 | "Excellent work efficiency. Related work spaces are well positioned." |
| 모든 모듈이 1.0~1.35 비율 | "All modules are efficiently designed within the optimal NHV range (1.0~1.35x)." |

---

### 4.2 개선점 피드백 (`generateImprovementsFeedback`)

#### 피드백 조건

| 점수 기준 | 피드백 메시지 |
|----------|--------------|
| 공간활용도 < 70 | "Try arranging modules more efficiently to improve space utilization." |
| 쾌적성 < 60 | "Place noise-generating modules and private spaces further apart to improve comfort." |
| 효율성 < 60 | "Position related work spaces closer together to improve work efficiency." |
| 일부 모듈이 1.35 초과 | "Some modules are outside the optimal NHV range. Adjust module sizes within 1.0~1.35x range." |

---

### 4.3 오류 피드백 (`createValidationErrorFeedback`)

기본 제약 조건 위반 시 상세한 오류 메시지를 제공합니다.

#### 오류 메시지 예시
```
✗ "All 18 modules must be used. Currently missing modules."
✗ "Modules must not overlap with each other."
✗ "All modules must be placed within the habitat space."
✗ "Some modules do not meet the minimum NHV requirements:
   Module3(Sleeping-1): UserVolume=4.50m³, RequiredNHV=5.00m³, Deficit=0.50m³"
```

---

## 5. 출력 결과 구조

### 5.1 성공 응답 (`LayoutEvaluationResponse`)

```json
{
  "scores": {
    "spaceUtilization": 85.2,
    "comfortability": 78.6,
    "efficiency": 82.1,
    "overallScore": 81.97
  },
  "feedback": {
    "strengths": [
      "Excellent space utilization. NHV optimization and overall space efficiency are outstanding.",
      "Comfortable module arrangement achieved. Well separated from noise and contamination sources."
    ],
    "improvements": [
      "Position related work spaces closer together to improve work efficiency."
    ]
  },
  "validation": {
    "allModulesUsed": true,
    "noOverlapping": true,
    "fitInHabitat": true,
    "nhvSatisfied": true
  }
}
```

---

### 5.2 실패 응답 (제약 조건 위반)

```json
{
  "scores": {
    "penaltyScore": 100
  },
  "feedback": {
    "errors": [
      "All 18 modules must be used. Currently missing modules.",
      "Some modules do not meet the minimum NHV (Net Habitable Volume) requirements:\nModule3(Sleeping-1): UserVolume=4.50m³, RequiredNHV=5.00m³, Deficit=0.50m³"
    ]
  },
  "validation": {
    "allModulesUsed": false,
    "noOverlapping": true,
    "fitInHabitat": true,
    "nhvSatisfied": false
  }
}
```

---

### 5.3 오류 응답 (계산 오류)

```json
{
  "scores": {
    "penaltyScore": 100
  },
  "feedback": {
    "errors": [
      "An error occurred during score calculation: NullPointerException at ..."
    ]
  },
  "validation": {
    "allModulesUsed": false,
    "noOverlapping": false,
    "fitInHabitat": false,
    "nhvSatisfied": false
  }
}
```

---

## 6. 평가 예시

### 6.1 우수 설계 예시

#### 입력 데이터
```json
{
  "habitatDimensions": {
    "x": 12.0,
    "y": 10.0,
    "z": 3.5
  },
  "modulePlacements": [
    {
      "moduleId": 1,
      "position": {"x": 2.0, "y": 2.0, "z": 1.0},
      "size": {"width": 2.0, "height": 2.0, "depth": 1.5},
      "rotation": {
        "x": 0,
        "y": 0,
        "z": 0
      }
    }
    // ... 총 18개 모듈
  ]
}
```

#### 평가 결과
```
✓ 기본 제약 조건: 모두 통과
✓ 공간 활용도: 88.5점 (NHV 비율 최적, 전체 활용률 73%)
✓ 쾌적성: 85.2점 (소음/사생활/청결 모두 우수)
✓ 효율성: 82.1점 (작업공간 적절히 근접)

종합 점수: 85.3점
```

#### 피드백
```
강점:
- Excellent space utilization. NHV optimization and overall space efficiency are outstanding.
- Comfortable module arrangement achieved. Well separated from noise and contamination sources.
- Excellent work efficiency. Related work spaces are well positioned.
```

---

### 6.2 개선 필요 설계 예시

#### 입력 데이터
```json
{
  "habitatDimensions": {
    "x": 15.0,
    "y": 12.0,
    "z": 4.0
  },
  "modulePlacements": [
    {
      "moduleId": 1,
      "position": {"x": 1.0, "y": 1.0, "z": 1.0},
      "size": {"width": 3.0, "height": 3.0, "depth": 2.0},  // 과도한 크기
      "rotation": {
        "x": 0,
        "y": 0,
        "z": 0
      }
    }
    // ... 총 18개 모듈
  ]
}
```

#### 평가 결과
```
✓ 기본 제약 조건: 모두 통과
△ 공간 활용도: 65.3점 (NHV 비율 초과 모듈 다수, 전체 활용률 52%)
△ 쾌적성: 55.8점 (소음원과 정숙공간 근접)
△ 효율성: 48.2점 (작업공간 과도하게 분산)

종합 점수: 57.1점
```

#### 피드백
```
개선점:
- Try arranging modules more efficiently to improve space utilization.
- Place noise-generating modules and private spaces further apart to improve comfort.
- Position related work spaces closer together to improve work efficiency.
- Some modules are outside the optimal NHV range. Adjust module sizes within 1.0~1.35x range.
```

---

### 6.3 실패 설계 예시 (NHV 미충족)

#### 입력 데이터
```json
{
  "habitatDimensions": {
    "x": 10.0,
    "y": 8.0,
    "z": 3.0
  },
  "modulePlacements": [
    {
      "moduleId": 3,  // Sleeping-1 (NHV: 5.0m³ 필요)
      "position": {"x": 1.0, "y": 1.0, "z": 1.0},
      "size": {"width": 1.5, "height": 1.5, "depth": 2.0},  // 부피: 4.5m³
      "rotation": {
        "x": 0,
        "y": 0,
        "z": 0
      }
    }
    // ... 총 18개 모듈
  ]
}
```

#### 평가 결과
```
✗ 기본 제약 조건: NHV 미충족
✗ 패널티 점수: 100점
```

#### 피드백
```
오류:
- Some modules do not meet the minimum NHV (Net Habitable Volume) requirements:
  Module3(Sleeping-1): UserVolume=4.50m³, RequiredNHV=5.00m³, Deficit=0.50m³

  Please increase module sizes.
```

---

## 7. 태그 시스템 참고

### 7.1 평가에 사용되는 태그

| 태그명 | 카테고리 | 평가 항목 | 사용 목적 |
|-------|---------|----------|---------|
| `공용공간` | USAGE | 사생활보호 | 개인공간과 거리 확보 |
| `개인공간` | USAGE | 사생활보호 | 공용공간과 거리 확보 |
| `소음유발가능` | IMPACT | 소음분리 | 조용한 공간과 거리 확보 |
| `정숙필요` | PRIVACY | 소음분리 | 소음원과 거리 확보 |
| `청결구역` | CLEANLINESS | 청결분리 | 오염구역과 거리 확보 |
| `오염구역` | CLEANLINESS | 청결분리 | 청결구역과 거리 확보 |
| `작업공간` | FUNCTION | 업무효율성 | 작업공간끼리 근접 배치 |

---

## 8. 참고 문헌

1. **A Tool for Automated Design and Evaluation of Habitat Interior Layouts** (NASA)
   - 소음 노출 계산 모델
   - 사생활 보호 거리 계산
   - 업무 효율성 평가 메트릭

2. **Defining the Required Net Habitable Volume for Long-Duration Exploration Missions** (NASA)
   - NHV (Net Habitable Volume) 정의
   - 모듈별 최소 부피 요구사항
   - 공간 활용률 기준

---