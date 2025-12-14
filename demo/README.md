# 🏗️ NASA 우주 거주지 레이아웃 평가 시스템 - 소스 코드 구조

## 📁 **패키지 구조**

```
com.example.demo/
├── DemoApplication.java              # 메인 애플리케이션
│
├── domain/                          # 도메인 레이어 (비즈니스 로직)
│   ├── evaluation/                  # 평가 도메인
│   │   ├── controller/
│   │   │   └── EvaluationController.java    # 평가 API 컨트롤러
│   │   ├── dto/                    # 평가 관련 DTO
│   │   │   ├── EvaluationFeedback.java      # 평가 피드백
│   │   │   ├── EvaluationScores.java        # 평가 점수
│   │   │   ├── HabitatDimensions.java       # 거주지 치수
│   │   │   ├── LayoutEvaluationRequest.java # 레이아웃 평가 요청
│   │   │   └── LayoutEvaluationResponse.java # 레이아웃 평가 응답
│   │   ├── entity/
│   │   │   └── EvaluationRecord.java        # 평가 기록 엔티티
│   │   ├── repository/
│   │   │   └── EvaluationRecordRepository.java # 평가 기록 저장소
│   │   └── service/
│   │       ├── AdvancedEvaluationService.java   # 고급 평가 서비스
│   │       └── LayoutEvaluationService.java     # 레이아웃 평가 (핵심 로직)
│   │
│   ├── module/                      # 모듈 도메인
│   │   ├── controller/
│   │   │   └── ModuleController.java          # 모듈 API 컨트롤러
│   │   ├── dto/                    # 모듈 관련 DTO
│   │   │   ├── ModulePlacement.java          # 모듈 배치 (회전 정보 포함)
│   │   │   ├── ModulePlacementValidationRequest.java  # 모듈 배치 검증 요청
│   │   │   ├── ModulePlacementValidationResponse.java # 모듈 배치 검증 응답
│   │   │   ├── ModuleResponseDto.java        # 모듈 응답 DTO
│   │   │   └── TagDto.java                   # 태그 DTO
│   │   ├── entity/
│   │   │   ├── Module.java                   # 모듈 엔티티
│   │   │   └── ModuleTag.java                # 모듈 태그 엔티티
│   │   ├── repository/
│   │   │   └── ModuleRepository.java         # 모듈 저장소
│   │   └── service/
│   │       └── ModuleService.java           # 모듈 관리 서비스
│   │
│   └── rag/                         # RAG 도메인 (Retrieval-Augmented Generation)
│       ├── controller/
│       │   └── RagController.java           # RAG API 컨트롤러
│       ├── dto/                    # RAG 관련 DTO
│       │   ├── RagAnswer.java               # RAG 답변
│       │   └── RagQueryRequest.java         # RAG 쿼리 요청
│       ├── entity/
│       │   └── DocChunk.java                # 문서 청크 엔티티
│       ├── repository/
│       │   └── DocChunkRepository.java      # 문서 청크 저장소
│       └── service/
│           ├── DocumentIngestionService.java # 문서 수집 서비스
│           ├── RagQueryService.java          # RAG 쿼리 서비스
│           └── VectorSearchService.java      # 벡터 검색 서비스
│
├── global/                          # 전역 공통 레이어
│   ├── config/
│   │   └── WebConfig.java                   # 웹 설정
│   ├── dto/
│   │   └── ApiResponse.java                 # API 응답 기본 구조
│   └── enums/                      # 전역 열거형
│       ├── DifficultyLevel.java            # 난이도 레벨
│       ├── MissionProfile.java             # 미션 프로필
│       └── TagCategory.java                # 태그 카테고리
│
└── infra/                           # 인프라 레이어 (기술 구현)
    ├── embedding/                  # 임베딩 서비스
    │   ├── DjlEmbeddingService.java         # DJL 임베딩 서비스
    │   ├── EmbeddingService.java           # 임베딩 서비스 인터페이스
    │   └── OllamaEmbeddingService.java     # Ollama 임베딩 서비스
    ├── init/
    │   └── DataInitializationService.java  # 데이터 초기화 서비스
    ├── llm/                         # LLM 클라이언트
    │   ├── LlmClient.java                   # LLM 클라이언트 인터페이스
    │   └── OllamaClient.java               # Ollama 클라이언트
    └── pdf/                         # PDF 처리
        ├── PdfTextExtractor.java            # PDF 텍스트 추출
        └── TextChunker.java                 # 텍스트 청킹
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