package com.example.demo.controller;

import com.example.demo.controller.dto.*;
import com.example.demo.service.LayoutEvaluationService;
import com.example.demo.service.AdvancedEvaluationService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

// 배치 평가 REST API 컨트롤러
@RestController
@RequestMapping("/api/v1/evaluate")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class EvaluationController {

    private static final Logger logger = LoggerFactory.getLogger(EvaluationController.class);

    private final LayoutEvaluationService evaluationService;
    private final AdvancedEvaluationService advancedEvaluationService;

    // 배치 레이아웃 종합 평가 (기본 모드)
    @PostMapping("/layout")
    public ResponseEntity<ApiResponse<LayoutEvaluationResponse>> evaluateLayout(
            @Valid @RequestBody LayoutEvaluationRequest request) {
        try {
            logger.info("배치 평가 요청 (기본 모드): 거주지 크기={}, 모듈 수={}",
                    request.getHabitatDimensions(),
                    request.getModuleCount());

            LayoutEvaluationResponse response = evaluationService.evaluateLayout(request);

            if (response.isSuccessful()) {
                logger.info("배치 평가 성공: 최종점수={}", response.getScores().getOverallScore());
                return ResponseEntity.ok(ApiResponse.success(response, "배치 평가가 완료되었습니다."));
            } else {
                logger.warn("배치 평가 실패: 패널티 점수 또는 검증 오류");
                return ResponseEntity.ok(ApiResponse.success(response, "배치 평가를 신청하셨지만 제약 조건을 위반했습니다."));
            }

        } catch (Exception e) {
            logger.error("배치 평가 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.errorResponse("CALCULATION_ERROR", "배치 평가 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    // 배치 레이아웃 종합 평가 (고급 모드 - 미션별 가중치 + RAG)
    @PostMapping("/layout/advanced")
    public ResponseEntity<ApiResponse<LayoutEvaluationResponse>> evaluateLayoutAdvanced(
            @Valid @RequestBody LayoutEvaluationRequest request) {
        try {
            logger.info("배치 평가 요청 (고급 모드): 거주지 크기={}, 모듈 수={}, 미션={}",
                    request.getHabitatDimensions(),
                    request.getModuleCount(),
                    request.getMissionProfile());

            LayoutEvaluationResponse response = advancedEvaluationService.evaluateLayout(request);

            if (response.isSuccessful()) {
                logger.info("배치 평가 성공 (고급): 최종점수={}", response.getScores().getOverallScore());
                return ResponseEntity.ok(ApiResponse.success(response, "고급 배치 평가가 완료되었습니다."));
            } else {
                logger.warn("배치 평가 실패 (고급): 패널티 점수 또는 검증 오류");
                return ResponseEntity.ok(ApiResponse.success(response, "고급 배치 평가를 신청하셨지만 제약 조건을 위반했습니다."));
            }

        } catch (Exception e) {
            logger.error("고급 배치 평가 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.errorResponse("CALCULATION_ERROR", "고급 배치 평가 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    // 실시간 배치 검증
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<ModulePlacementValidationResponse>> validatePlacement(
            @Valid @RequestBody ModulePlacementValidationRequest request) {
        try {
            logger.debug("실시간 배치 검증 요청: 모듈ID={}, 위치={}",
                    request.getNewModule().getModuleId(),
                    request.getNewModule().getPosition());

            // 검증 로직
            ModulePlacementValidationResponse response = new ModulePlacementValidationResponse();
            response.setValid(true);
            response.setConflicts(java.util.List.of());
            response.setWarnings(java.util.List.of());

            // 모듈이 거주지 범위를 벗어나는지 확인
            if (isModuleOutOfBounds(request)) {
                response.setValid(false);
                response.setConflicts(java.util.List.of("모듈이 거주지 공간을 벗어났습니다."));
            }

            // 기존 모듈과의 겹침 확인
            if (hasOverlappingWithExisting(request)) {
                response.setValid(false);
                response.setConflicts(java.util.List.of("다른 모듈과 겹치는 위치입니다."));
            }

            logger.debug("실시간 배치 검증 완료: 유효성={}", response.isValid());
            return ResponseEntity.ok(ApiResponse.success(response));

        } catch (Exception e) {
            logger.error("실시간 배치 검증 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.errorResponse("VALIDATION_ERROR", "배치 검증 중 오류가 발생했습니다."));
        }
    }

    // /**
    // * 미션 프로필 목록 조회
    // */
    // @GetMapping("/mission-profiles")
    // public ResponseEntity<ApiResponse<java.util.List<MissionProfileDto>>>
    // getMissionProfiles() {
    // try {
    // logger.info("미션 프로필 목록 조회 요청");

    // java.util.List<MissionProfileDto> profiles = java.util.List.of(
    // new MissionProfileDto("comfort", "쾌적성 최우선", "장기 탐사선 - 승무원의 정신 건강과 삶의 질 극대화"),
    // new MissionProfileDto("efficiency", "효율성 최우선", "단기 기지 - 최소 질량으로 최대의 임무 성과
    // 달성"),
    // new MissionProfileDto("balanced", "밸런스형", "표준 모듈 - 모든 요소를 균형 있게 고려한 표준 설계"));

    // return ResponseEntity.ok(ApiResponse.success(profiles, "미션 프로필 목록을
    // 조회했습니다."));

    // } catch (Exception e) {
    // logger.error("미션 프로필 조회 중 오류 발생", e);
    // return ResponseEntity.internalServerError()
    // .body(ApiResponse.errorResponse("DEFAULT_ERROR", "미션 프로필 조회 중 오류가 발생했습니다."));
    // }
    // }

    private boolean isModuleOutOfBounds(ModulePlacementValidationRequest request) {
        HabitatDimensions dims = request.getHabitatDimensions();
        ModulePlacement.Position pos = request.getNewModule().getPosition();

        return pos.getXAsDouble() < 0 || pos.getXAsDouble() > dims.getXAsDouble() ||
                pos.getYAsDouble() < 0 || pos.getYAsDouble() > dims.getYAsDouble() ||
                pos.getZAsDouble() < 0 || pos.getZAsDouble() > dims.getZAsDouble();
    }

    private boolean hasOverlappingWithExisting(ModulePlacementValidationRequest request) {
        return false;
    }

    // // 미션 프로필 DTO (임시 클래스)
    // public static class MissionProfileDto {
    // private String id;
    // private String name;
    // private String description;

    // public MissionProfileDto(String id, String name, String description) {
    // this.id = id;
    // this.name = name;
    // this.description = description;
    // }

    // public String getId() {
    // return id;
    // }

    // public String getName() {
    // return name;
    // }

    // public String getDescription() {
    // return description;
    // }
    // }

}
