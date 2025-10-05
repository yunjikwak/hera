# 🏗️ NASA 우주 거주지 레이아웃 평가 시스템 - 소스 코드 구조

## 📁 **패키지 구조**

```
com.example.demo/
├── DemoApplication.java              # 메인 애플리케이션
├── config/                          # 설정 클래스
│   └── WebConfig.java               # 웹 설정
├── controller/                      # REST API 컨트롤러
│   ├── dto/                        # 데이터 전송 객체
│   │   ├── ApiResponse.java        # API 응답 기본 구조
│   │   ├── EvaluationFeedback.java # 평가 피드백
│   │   ├── EvaluationScores.java   # 평가 점수
│   │   ├── HabitatDimensions.java  # 거주지 치수
│   │   ├── LayoutEvaluationRequest.java    # 레이아웃 평가 요청
│   │   ├── LayoutEvaluationResponse.java   # 레이아웃 평가 응답
│   │   ├── ModulePlacement.java    # 모듈 배치 (회전 정보 포함)
│   │   └── ...                     # 기타 DTO들
│   ├── EvaluationController.java    # 평가 API 컨트롤러
│   └── ModuleController.java        # 모듈 API 컨트롤러
├── enums/                          # 열거형
│   ├── DifficultyLevel.java        # 난이도 레벨
│   └── TagCategory.java            # 태그 카테고리
├── rag/                           # RAG (Retrieval-Augmented Generation) 시스템
│   ├── controller/
│   │   └── RagController.java     # RAG API 컨트롤러
│   ├── model/                     # RAG 모델 클래스들
│   ├── repository/
│   │   └── DocChunkRepository.java # 문서 청크 저장소
│   └── service/                   # RAG 서비스들
│       ├── DocumentIngestionService.java  # 문서 수집 서비스
│       ├── RagQueryService.java          # RAG 쿼리 서비스
│       └── ...                           # 기타 RAG 서비스들
├── repository/                    # 데이터 저장소
│   ├── entity/                    # JPA 엔티티
│   │   ├── Module.java            # 모듈 엔티티
│   │   └── ...                   # 기타 엔티티들
│   ├── EvaluationRecordRepository.java  # 평가 기록 저장소
│   └── ModuleRepository.java      # 모듈 저장소
└── service/                       # 비즈니스 로직 서비스
    ├── DataInitializationService.java    # 데이터 초기화
    ├── LayoutEvaluationService.java      # 레이아웃 평가 (핵심 로직)
    └── ModuleService.java               # 모듈 관리
```

## 🔧 **핵심 컴포넌트**

### **1. LayoutEvaluationService** (핵심 평가 엔진)
- **기능**: 레이아웃 평가의 핵심 로직
- **주요 메서드**:
  - `evaluateLayout()`: 기본 평가
  - `validateBasicConstraints()`: 제약 조건 검증
  - `calculateScores()`: 점수 계산
  - `generateFeedback()`: 피드백 생성

### **2. ModulePlacement** (회전 정보 포함)
- **기능**: 모듈 배치 정보 (위치, 크기, 회전)
- **회전 정보**: `rotation` 객체 (X, Y, Z축 회전)
- **회전 순서**: Z → Y → X

### **3. RAG 시스템**
- **기능**: 문서 기반 지능형 피드백
- **구성**: 문서 수집, 임베딩, 검색, LLM 통합

## 🎯 **주요 기능**

### **평가 시스템**
1. **기본 제약 조건 검증**
   - 모든 18개 모듈 사용
   - 모듈 겹침 검사 (경계 구 기반)
   - 거주지 내 배치 확인 (회전된 꼭짓점 검사)
   - NHV 최소 요구사항 충족

2. **점수 계산**
   - **공간 활용도 (40%)**: NHV 적정성 + 전체 공간 활용률
   - **쾌적성 (30%)**: 소음분리 + 사생활보호 + 청결구역분리
   - **효율성 (30%)**: 업무공간 효율성 (유클리드 거리 기반)

3. **피드백 생성**
   - 강점 분석
   - 개선점 제안
   - RAG 기반 추가 피드백

## 🔄 **최근 변경사항**

### **v2.0 (2024년 12월)**
- ✅ 회전축 정보 구조 변경: `orientation` → `rotation` 객체
- ✅ X, Y, Z축 회전 지원 (현재 Z축만 구현, X/Y축은 향후 확장)
- ✅ 겹침 검사 개선: `<` → `<=`
- ✅ 효율성 계산 개선: 맨해튼 거리 → 유클리드 거리
- ✅ 불필요한 메서드 정리

## 🚀 **개발 가이드**

### **새로운 평가 항목 추가**
1. `EvaluationScores` 클래스에 필드 추가
2. `LayoutEvaluationService`에 계산 로직 구현
3. `generateFeedback()` 메서드에 피드백 로직 추가

### **새로운 회전 기능 추가**
1. `apply3DRotation()` 메서드 수정
2. `calculateRotatedVertices()` 메서드 업데이트
3. 테스트 케이스 추가

### **RAG 시스템 확장**
1. `DocumentIngestionService`에 새 문서 타입 추가
2. `RagQueryService`에 새 쿼리 타입 추가
3. 문서 임베딩 및 검색 로직 업데이트