package com.example.demo.service;

import com.example.demo.controller.dto.*;
// import com.example.demo.enums.MissionProfile;
import com.example.demo.repository.entity.Module;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.Arrays;
import java.math.BigDecimal;

// 배치 검증, 점수 계산, 피드백 생성
@Service
@RequiredArgsConstructor
public class LayoutEvaluationService {

    private static final Logger logger = LoggerFactory.getLogger(LayoutEvaluationService.class);

    private static final int REQUIRED_MODULE_COUNT = 18;
    private static final int PENALTY_SCORE = 100;
    private final ModuleService moduleService;

    // 배치 레이아웃 종합 평가 수행
    @Transactional(readOnly = true)
    public LayoutEvaluationResponse evaluateLayout(LayoutEvaluationRequest request) {
        logger.info("배치 평가 시작: {}", request);

        try {
            // 1단계: 기본 제약 조건 검증
            LayoutEvaluationResponse.ValidationResult validation = validateBasicConstraints(request);

            if (!validation.isValid()) {
                logger.warn("기본 제약 조건 위반: {}", validation);
                return createFailureResponse(validation, request);
            }

            // 2단계: 점수 계산
            EvaluationScores scores = calculateScores(request);

            // 3단계: 피드백 생성
            EvaluationFeedback feedback = generateFeedback(request, scores);

            logger.info("배치 평가 완료: 최종점수={}", scores.getOverallScore());
            return new LayoutEvaluationResponse(scores, feedback, validation);

        } catch (Exception e) {
            logger.error("Error during layout evaluation", e);
            return createErrorResponse("CALCULATION_ERROR",
                    "An error occurred during score calculation: " + e.getMessage());
        }
    }

    // 기본 제약 조건 검증
    private LayoutEvaluationResponse.ValidationResult validateBasicConstraints(LayoutEvaluationRequest request) {
        // 모든 모듈 사용
        // 모듈 겹침 확인
        // 모듈이 거주지 공간보다 큰지 확인
        // NHV 최소 부피 만족 확인
        boolean allModulesUsed = checkAllModulesUsed(request);
        // boolean noOverlapping = checkNoOverlapping(request);
        boolean fitInHabitat = checkFitInHabitat(request);
        boolean nhvSatisfied = checkNhvSatisfied(request);

        // boolean allModulesUsed = true;
        boolean noOverlapping = true;
        // boolean fitInHabitat = true;
        // boolean nhvSatisfied = true;

        return new LayoutEvaluationResponse.ValidationResult(allModulesUsed, noOverlapping, fitInHabitat, nhvSatisfied);
    }

    // 모든 모듈 사용 여부 확인
    private boolean checkAllModulesUsed(LayoutEvaluationRequest request) {
        Set<Long> usedModuleIds = request.getModulePlacements().stream()
                .map(ModulePlacement::getModuleId)
                .collect(Collectors.toSet());

        boolean result = usedModuleIds.size() == REQUIRED_MODULE_COUNT;
        logger.debug("모든 모듈 사용 확인: {}/{}", usedModuleIds.size(), REQUIRED_MODULE_COUNT);
        return result;
    }

    // 모듈 겹침 여부 확인
    private boolean checkNoOverlapping(LayoutEvaluationRequest request) {
        List<ModulePlacement> placements = request.getModulePlacements();

        for (int i = 0; i < placements.size(); i++) {
            for (int j = i + 1; j < placements.size(); j++) {
                if (isOverlapping(placements.get(i), placements.get(j))) {
                    logger.debug("모듈 겹침 발견: {} <-> {}",
                            placements.get(i).getModuleId(), placements.get(j).getModuleId());
                    return false;
                }
            }
        }

        return true;
    }

    // 두 모듈 간 겹침 여부 확인
    private boolean isOverlapping(ModulePlacement placement1, ModulePlacement placement2) {
        if (placement1.getModuleId().equals(placement2.getModuleId())) {
            return false;
        }

        // 1. 각 모듈의 회전된 8개 꼭짓점 좌표를 계산합니다.
        List<ModulePlacement.Position> vertices1 = calculateRotatedVertices(placement1);
        List<ModulePlacement.Position> vertices2 = calculateRotatedVertices(placement2);

        // 2. 모듈1의 꼭짓점 중 하나라도 모듈2 내부에 있는지 확인합니다.
        for (int i = 0; i < vertices1.size(); i++) {
            ModulePlacement.Position vertex = vertices1.get(i);
            if (isPointInsideBox(vertex, placement2)) {
                logger.info("모듈 겹침 감지: 모듈 {} (꼭짓점 {}: [{}, {}, {}])이 모듈 {} 내부에 있음",
                        placement1.getModuleId(), i,
                        String.format("%.2f", vertex.getXAsDouble()),
                        String.format("%.2f", vertex.getYAsDouble()),
                        String.format("%.2f", vertex.getZAsDouble()),
                        placement2.getModuleId());
                return true; // 겹침 발생!
            }
        }

        // 3. 모듈2의 꼭짓점 중 하나라도 모듈1 내부에 있는지 확인합니다.
        for (int i = 0; i < vertices2.size(); i++) {
            ModulePlacement.Position vertex = vertices2.get(i);
            if (isPointInsideBox(vertex, placement1)) {
                logger.info("모듈 겹침 감지: 모듈 {} (꼭짓점 {}: [{}, {}, {}])이 모듈 {} 내부에 있음",
                        placement2.getModuleId(), i,
                        String.format("%.2f", vertex.getXAsDouble()),
                        String.format("%.2f", vertex.getYAsDouble()),
                        String.format("%.2f", vertex.getZAsDouble()),
                        placement1.getModuleId());
                return true; // 겹침 발생!
            }
        }

        return false; // 양쪽 모두 꼭짓점을 포함하지 않음 (겹치지 않은 것으로 간주)
    }

    private boolean isPointInsideBox(ModulePlacement.Position point, ModulePlacement box) {
        // 1. 점의 좌표를 박스의 중심을 원점(0,0,0)으로 하는 좌표계로 이동
        double translatedX = point.getXAsDouble() - box.getPosition().getXAsDouble();
        double translatedY = point.getYAsDouble() - box.getPosition().getYAsDouble();
        double translatedZ = point.getZAsDouble() - box.getPosition().getZAsDouble();

        // 2. 박스의 회전 각도를 가져옵니다.
        double angleX = Math.toRadians(box.getRotation().getX());
        double angleY = Math.toRadians(box.getRotation().getY());
        double angleZ = Math.toRadians(box.getRotation().getZ());

        // 3. 박스의 회전과 '반대' 방향으로 점을 회전시켜, 박스가 축에 정렬된 것처럼 만듭니다.
        // (회전의 역변환 적용: X -> Y -> Z 순서)
        double cosX = Math.cos(-angleX), sinX = Math.sin(-angleX);
        double cosY = Math.cos(-angleY), sinY = Math.sin(-angleY);
        double cosZ = Math.cos(-angleZ), sinZ = Math.sin(-angleZ);

        // X축 역회전
        double x1 = translatedX;
        double y1 = translatedY * cosX - translatedZ * sinX;
        double z1 = translatedY * sinX + translatedZ * cosX;

        // Y축 역회전
        double x2 = x1 * cosY + z1 * sinY;
        double y2 = y1;
        double z2 = -x1 * sinY + z1 * cosY;

        // Z축 역회전
        double localX = x2 * cosZ - y2 * sinZ;
        double localY = x2 * sinZ + y2 * cosZ;
        double localZ = z2;

        // 4. 이제 점은 박스의 로컬 좌표계에 위치합니다.
        // 박스가 축에 정렬된 상태이므로, 단순한 경계 검사만 하면 됩니다.
        double halfW = box.getSize().getWidthAsDouble() / 2.0;
        double halfH = box.getSize().getHeightAsDouble() / 2.0;
        double halfD = box.getSize().getDepthAsDouble() / 2.0;

        return Math.abs(localX) < halfW &&
                Math.abs(localY) < halfH &&
                Math.abs(localZ) < halfD;
    }

    // 두 위치 간 거리 계산
    private double calculateDistance(ModulePlacement.Position pos1, ModulePlacement.Position pos2) {
        double dx = pos1.getXAsDouble() - pos2.getXAsDouble();
        double dy = pos1.getYAsDouble() - pos2.getYAsDouble();
        double dz = pos1.getZAsDouble() - pos2.getZAsDouble();

        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    // 회전된 모듈의 8개 꼭짓점이 모두 거주지 내에 있는지 확인
    private boolean checkFitInHabitat(LayoutEvaluationRequest request) {
        HabitatDimensions dims = request.getHabitatDimensions();

        for (ModulePlacement placement : request.getModulePlacements()) {
            List<ModulePlacement.Position> vertices = calculateRotatedVertices(placement);

            // 각 꼭짓점이 거주지 경계를 벗어나는지 확인
            for (ModulePlacement.Position vertex : vertices) {
                if (vertex.getXAsDouble() < 0 || vertex.getXAsDouble() > dims.getXAsDouble() ||
                        vertex.getYAsDouble() < 0 || vertex.getYAsDouble() > dims.getYAsDouble() ||
                        vertex.getZAsDouble() < 0 || vertex.getZAsDouble() > dims.getZAsDouble()) {
                    logger.debug("모듈 {}의 꼭짓점 {}이 거주지 경계를 벗어남", placement.getModuleId(), vertex);
                    return false; // 하나라도 벗어나면 즉시 실패
                }
            }
        }
        return true; // 모든 모듈의 모든 꼭짓점이 내부에 있음
    }

    // 회전된 모듈의 8개 꼭짓점 좌표를 계산
    private List<ModulePlacement.Position> calculateRotatedVertices(ModulePlacement placement) {
        ModulePlacement.Position center = placement.getPosition();
        ModulePlacement.Size size = placement.getSize();

        // X, Y, Z축 회전 각도 (라디안)
        double angleX = Math.toRadians(placement.getRotation().getX());
        double angleY = Math.toRadians(placement.getRotation().getY());
        double angleZ = Math.toRadians(placement.getRotation().getZ());

        // 회전 행렬 계산
        double cosX = Math.cos(angleX), sinX = Math.sin(angleX);
        double cosY = Math.cos(angleY), sinY = Math.sin(angleY);
        double cosZ = Math.cos(angleZ), sinZ = Math.sin(angleZ);

        double halfW = size.getWidthAsDouble() / 2.0;
        double halfH = size.getHeightAsDouble() / 2.0;
        double halfD = size.getDepthAsDouble() / 2.0;

        // 모듈 중심 기준의 8개 로컬 꼭짓점 좌표
        List<double[]> localVertices = Arrays.asList(
                new double[] { halfW, halfH, halfD }, new double[] { -halfW, halfH, halfD },
                new double[] { halfW, -halfH, halfD }, new double[] { -halfW, -halfH, halfD },
                new double[] { halfW, halfH, -halfD }, new double[] { -halfW, halfH, -halfD },
                new double[] { halfW, -halfH, -halfD }, new double[] { -halfW, -halfH, -halfD });

        List<ModulePlacement.Position> worldVertices = new ArrayList<>();
        for (double[] lv : localVertices) {
            // 3D 회전 적용 (Z → Y → X 순서)
            double[] rotated = apply3DRotation(lv[0], lv[1], lv[2], cosX, sinX, cosY, sinY, cosZ, sinZ);

            // 월드 좌표로 변환 (중심점 이동)
            double worldX = center.getXAsDouble() + rotated[0];
            double worldY = center.getYAsDouble() + rotated[1];
            double worldZ = center.getZAsDouble() + rotated[2];

            worldVertices.add(new ModulePlacement.Position(
                    BigDecimal.valueOf(worldX),
                    BigDecimal.valueOf(worldY),
                    BigDecimal.valueOf(worldZ)));
        }
        return worldVertices;
    }

    // 3D 회전 적용 (Z → Y → X 순서)
    private double[] apply3DRotation(double x, double y, double z,
            double cosX, double sinX, double cosY, double sinY, double cosZ, double sinZ) {
        // Z축 회전 (Yaw)
        double x1 = x * cosZ - y * sinZ;
        double y1 = x * sinZ + y * cosZ;
        double z1 = z;

        // Y축 회전 (Pitch)
        double x2 = x1 * cosY + z1 * sinY;
        double y2 = y1;
        double z2 = -x1 * sinY + z1 * cosY;

        // X축 회전 (Roll)
        double x3 = x2;
        double y3 = y2 * cosX - z2 * sinX;
        double z3 = y2 * sinX + z2 * cosX;

        return new double[] { x3, y3, z3 };
    }

    // NHV 최소 부피 만족 여부 확인 (기본 제약 조건 - 실패 처리)
    private boolean checkNhvSatisfied(LayoutEvaluationRequest request) {
        boolean allSatisfied = true;
        List<String> failedModules = new ArrayList<>();

        for (ModulePlacement placement : request.getModulePlacements()) {
            Module module = moduleService.findEntityById(placement.getModuleId());
            if (module == null)
                continue;

            double userVolume = placement.getSize().getVolumeAsDouble();
            double requiredNhv = module.getNhv().doubleValue();

            // 반드시 지켜야 할 조건: NHV_actual ≥ NHV_min (미만이면 실패)
            if (userVolume < requiredNhv) {
                String failureInfo = String.format(
                        "Module%d(%s): UserVolume=%.2fm³, RequiredNHV=%.2fm³, Deficit=%.2fm³",
                        placement.getModuleId(), module.getName(), userVolume, requiredNhv, requiredNhv - userVolume);
                failedModules.add(failureInfo);
                logger.warn("NHV 부족으로 실패: {}", failureInfo);
                allSatisfied = false;
            }
        }

        if (!allSatisfied) {
            logger.warn("NHV 요구사항 미충족 모듈들: {}", String.join(", ", failedModules));
        }

        return allSatisfied;
    }

    // NHV 실패 모듈들의 상세 정보를 반환하는 메서드
    private List<String> getNhvFailureDetails(LayoutEvaluationRequest request) {
        List<String> failedModules = new ArrayList<>();

        for (ModulePlacement placement : request.getModulePlacements()) {
            Module module = moduleService.findEntityById(placement.getModuleId());
            if (module == null)
                continue;

            double userVolume = placement.getSize().getVolumeAsDouble();
            double requiredNhv = module.getNhv().doubleValue();

            if (userVolume < requiredNhv) {
                String failureInfo = String.format(
                        "Module%d(%s): UserVolume=%.2fm³, RequiredNHV=%.2fm³, Deficit=%.2fm³",
                        placement.getModuleId(), module.getName(), userVolume, requiredNhv, requiredNhv - userVolume);
                failedModules.add(failureInfo);
            }
        }

        return failedModules;
    }

    // 종합 점수 계산
    private EvaluationScores calculateScores(LayoutEvaluationRequest request) {
        double spaceUtilization = calculateSpaceUtilization(request);
        double comfortability = calculateComfortability(request);
        double efficiency = calculateEfficiency(request);
        logger.debug("==============종합 점수 계산==================");
        logger.debug("공간 활용도: {}", spaceUtilization);
        logger.debug("쾌적성: {}", comfortability);
        logger.debug("업무 효율성: {}", efficiency);

        // 미션 프로필에 따른 가중치 적용
        // Map<String, Double> weights =
        // MissionProfile.fromId(request.getMissionProfile()).getWeights();

        // 기본 가중치 사용 (모든 요소 동일하게)
        double overallScore = spaceUtilization * 0.4 +
                comfortability * 0.3 +
                efficiency * 0.3;

        return new EvaluationScores(spaceUtilization, comfortability, efficiency, overallScore);
    }

    // 공간 활용도 계산: NHV 적정성 + 전체 공간 활용도
    private double calculateSpaceUtilization(LayoutEvaluationRequest request) {
        // 1. NHV 적정성 점수 (50%)
        double nhvScore = calculateNhvEfficiencyScore(request);

        // 2. 전체 공간 활용도 점수 (50%)
        double overallUtilizationScore = calculateOverallUtilizationScore(request);

        logger.info("==============공간 활용도==================");
        logger.info("NHV 적정성 점수: {}", String.format("%.2f", nhvScore));
        logger.info("전체 공간 활용도 점수: {}", String.format("%.2f", overallUtilizationScore));
        logger.info("최종 공간 활용도: {}", String.format("%.2f", (nhvScore * 0.5) + (overallUtilizationScore * 0.5)));

        // 가중 평균으로 최종 점수 계산
        return (nhvScore * 0.5) + (overallUtilizationScore * 0.5);
    }

    // NHV 적정성 점수 계산
    private double calculateNhvEfficiencyScore(LayoutEvaluationRequest request) {
        double totalScore = 0.0;
        int moduleCount = 0;

        for (ModulePlacement placement : request.getModulePlacements()) {
            Module module = moduleService.findEntityById(placement.getModuleId());
            if (module == null)
                continue;

            double userVolume = placement.getSize().getVolumeAsDouble();
            double requiredNhv = module.getNhv().doubleValue();
            double ratio = userVolume / requiredNhv;

            // ratio < 1.0인 경우는 이미 기본 제약 조건에서 실패 처리됨
            // 여기서는 1.0 이상인 경우만 처리
            double moduleScore;
            if (ratio >= 1.0 && ratio <= 1.10) {
                // 적정성 보너스: NHV_min ≤ NHV_actual ≤ NHV_min×1.10
                moduleScore = 100.0; // 가산점
            } else if (ratio > 1.10 && ratio <= 1.35) {
                // 정상 범위: NHV_min×1.10 < NHV_actual ≤ NHV_min×1.35
                moduleScore = 100.0; // 만점
            } else {
                // ratio > 1.35: 비율이 클수록 점수 감소
                // 1.35를 기준으로 점수 계산 (1.35 = 100점, 2.0 = 0점)
                double excessRatio = ratio - 1.35;
                double maxExcess = 0.65; // 2.0 - 1.35 = 0.65
                double penaltyRatio = Math.min(excessRatio / maxExcess, 1.0); // 0~1 범위로 정규화
                moduleScore = 100.0 - (penaltyRatio * 100.0); // 100점에서 0점까지 선형 감소
                moduleScore = Math.max(moduleScore, 0.0); // 최소 0점
            }

            totalScore += moduleScore;
            moduleCount++;
        }

        // 모든 모듈들의 평균값
        return moduleCount > 0 ? totalScore / moduleCount : 0.0;
    }

    // 전체 공간 활용도 점수 계산
    private double calculateOverallUtilizationScore(LayoutEvaluationRequest request) {
        double totalNhv = request.getModulePlacements().stream()
                .distinct()
                .mapToDouble(placement -> {
                    Module module = moduleService.findEntityById(placement.getModuleId());
                    return module != null ? module.getNhv().doubleValue() : 0.0;
                })
                .sum();

        double totalHabitatVolume = request.getTotalHabitatVolume();

        logger.debug("전체 공간 활용도 계산 - 총 NHV: {}, 거주지 부피: {}",
                String.format("%.2f", totalNhv), String.format("%.2f", totalHabitatVolume));

        if (totalHabitatVolume <= 0) {
            return 0.0;
        }

        double utilization = (totalNhv / totalHabitatVolume) * 100;
        logger.debug("공간 활용률: {}%", String.format("%.2f", utilization));

        if (utilization < 40) {
            // < 40%: 0점 (완전한 실패)
            return 0.0;
        } else if (utilization >= 40 && utilization < 60) {
            // 40% ~ 60%: 0점에서 80점으로 선형 증가
            double progress = (utilization - 40) / 20; // 0~1 범위로 정규화
            return progress * 80.0;
        } else if (utilization >= 60 && utilization < 70) {
            // 60% ~ 70%: 80점에서 100점으로 선형 증가
            double progress = (utilization - 60) / 10; // 0~1 범위로 정규화
            return 80.0 + (progress * 20.0);
        } else if (utilization >= 70 && utilization <= 77.5) {
            // 70% ~ 77.5%: 100점 (최적 설계 구간)
            return 100.0;
        } else if (utilization > 77.5 && utilization <= 85) {
            // 77.5% ~ 85%: 100점에서 80점으로 선형 감소
            double progress = (utilization - 77.5) / 7.5; // 0~1 범위로 정규화
            return 100.0 - (progress * 20.0);
        } else if (utilization > 85 && utilization <= 100) {
            // 85% ~ 100%: 80점에서 0점으로 선형 감소
            double progress = (utilization - 85) / 15; // 0~1 범위로 정규화
            return 80.0 - (progress * 80.0);
        } else {
            // > 100%: 0점 (불가능한 설계)
            return 0.0;
        }
    }

    // 쾌적성 계산: 소음분리 + 사생활보호 + 청결구역분리
    private double calculateComfortability(LayoutEvaluationRequest request) {
        List<ModulePlacement> placements = request.getModulePlacements();

        // 1. 소음 분리 점수
        // 각각의 조용한 공간이 모든 소음원으로부터 얼마나 많은 소음에 노출되는가
        double noiseSeparation = calculateNoiseSimplicityScore(placements);

        // 2. 사생활 보호 점수
        // 각각의 조용한 공간이 모든 공용공간으로부터 얼마나 많은 소음에 노출되는가
        double privacyProtection = calculatePrivacyScore(request);

        // 3. 청결 구역 분리 점수
        double cleanlinessSeparation = calculateCleanlinessScore(request);

        return (noiseSeparation + privacyProtection + cleanlinessSeparation) / 3.0;
    }

    // 소음 분리 점수 계산 (논문 기반 R·D 거리 분석)
    private double calculateNoiseSimplicityScore(List<ModulePlacement> placements) {
        List<ModulePlacement> noiseModules = filterModulesByTag(placements, "Noise Generating");
        List<ModulePlacement> quietModules = filterModulesByTag(placements, "Quiet Required");

        if (noiseModules.isEmpty() || quietModules.isEmpty()) {
            return 100.0; // 분리할 필요가 없으면 만점
        }

        // 소음 노출 계산
        double totalUtility = 0.0;
        int quietModuleCount = 0;

        for (ModulePlacement quietModule : quietModules) {
            double exposure = calculateNoiseExposure(quietModule, noiseModules);
            double utility = calculateNoiseUtility(exposure);
            totalUtility += utility;
            quietModuleCount++;
        }

        return quietModuleCount > 0 ? totalUtility / quietModuleCount : 100.0;
    }

    // 소음 노출 계산 (Exposure_j = Σ S_i · Atten(d_ij))
    private double calculateNoiseExposure(ModulePlacement quietModule, List<ModulePlacement> noiseModules) {
        double totalExposure = 0.0;

        for (ModulePlacement noiseModule : noiseModules) {
            double distance = calculateDistance(noiseModule.getPosition(), quietModule.getPosition());
            double attenuation = calculateNoiseAttenuation(distance);
            double sourceIntensity = 1.0; // S_i = 1.0 (상대강도)

            totalExposure += sourceIntensity * attenuation;
        }

        return totalExposure;
    }

    // 소음 감쇠 계산 (Atten(d) = 1/(1 + k·d))
    private double calculateNoiseAttenuation(double distance) {
        double k = 0.3; // 감쇠계수
        return 1.0 / (1.0 + k * distance);
    }

    // 소음 유틸리티 계산 (U = clamp(1 - Exposure/Exposure_ref, 0, 1))
    private double calculateNoiseUtility(double exposure) {
        double exposureRef = 0.5; // 참조 임계값
        double utility = 1.0 - (exposure / exposureRef);
        return Math.max(0.0, Math.min(1.0, utility)) * 100.0; // 0-100 점수로 변환
    }

    // 사생활 보호 점수 계산
    private double calculatePrivacyScore(LayoutEvaluationRequest request) {
        List<ModulePlacement> placements = request.getModulePlacements();
        List<ModulePlacement> privateModules = filterModulesByTag(placements, "Private Space");
        List<ModulePlacement> publicModules = filterModulesByTag(placements, "Common Space");

        if (privateModules.isEmpty()) {
            return 100.0;
        }

        // 거주지 전체 치수 기반 D_good 계산
        double dGood = calculateHabitatBasedDGood(request);

        double totalUtility = 0.0;
        int privateModuleCount = 0;

        for (ModulePlacement privateModule : privateModules) {
            double minDistance = Double.MAX_VALUE;
            for (ModulePlacement publicModule : publicModules) {
                double distance = calculateDistance(privateModule.getPosition(), publicModule.getPosition());
                minDistance = Math.min(minDistance, distance);
            }

            double utility = calculatePrivacyUtility(minDistance, dGood);
            totalUtility += utility;
            privateModuleCount++;
        }

        return privateModuleCount > 0 ? totalUtility / privateModuleCount : 100.0;
    }

    // 사생활 보호 유틸리티 계산
    private double calculatePrivacyUtility(double distance, double dGood) {
        double dBad = 0.0; // D_bad = 0

        if (distance <= dBad) {
            return 0.0; // 최소 거리 이하면 0점
        } else if (distance >= dGood) {
            return 100.0; // 최적 거리 이상이면 만점
        } else {
            // 선형 보간: (distance - dBad) / (dGood - dBad) * 100
            double progress = (distance - dBad) / (dGood - dBad);
            return progress * 100.0;
        }
    }

    // 청결 구역 분리 점수 계산
    private double calculateCleanlinessScore(LayoutEvaluationRequest request) {
        List<ModulePlacement> placements = request.getModulePlacements();
        List<ModulePlacement> cleanModules = filterModulesByTag(placements, "Clean Zone");
        List<ModulePlacement> dirtyModules = filterModulesByTag(placements, "Contamination Zone");

        if (cleanModules.isEmpty() || dirtyModules.isEmpty()) {
            return 100.0;
        }

        // 거주지 전체 치수 기반 D_good 계산
        double dGood = calculateHabitatBasedDGood(request);

        double totalUtility = 0.0;
        int cleanModuleCount = 0;

        for (ModulePlacement cleanModule : cleanModules) {
            double minDistance = Double.MAX_VALUE;
            for (ModulePlacement dirtyModule : dirtyModules) {
                double distance = calculateDistance(cleanModule.getPosition(), dirtyModule.getPosition());
                minDistance = Math.min(minDistance, distance);
            }

            double utility = calculateCleanlinessUtility(minDistance, dGood);
            totalUtility += utility;
            cleanModuleCount++;
        }

        return cleanModuleCount > 0 ? totalUtility / cleanModuleCount : 100.0;
    }

    // 청결 구역 유틸리티 계산
    private double calculateCleanlinessUtility(double distance, double dGood) {
        double dBad = 0.0; // D_bad = 0

        if (distance <= dBad) {
            return 0.0; // 최소 거리 이하면 0점
        } else if (distance >= dGood) {
            return 100.0; // 최적 거리 이상이면 만점
        } else {
            // 선형 보간: (distance - dBad) / (dGood - dBad) * 100
            double progress = (distance - dBad) / (dGood - dBad);
            return progress * 100.0;
        }
    }

    // 효율성 계산: 업무효율성 + 자원효율성
    private double calculateEfficiency(LayoutEvaluationRequest request) {
        List<ModulePlacement> placements = request.getModulePlacements();

        // 1. 업무 효율성 (작업공간들이 가까이 있는지)
        double taskEfficiency = calculateTaskEfficiencyScore(placements, request);
        logger.debug("==============업무 효율성==================");

        return taskEfficiency;
    }

    // 업무 효율성 점수 계산 (거주지 크기 기반 자동 기준값)
    private double calculateTaskEfficiencyScore(List<ModulePlacement> placements, LayoutEvaluationRequest request) {
        List<ModulePlacement> workModules = filterModulesByTag(placements, "Work Space");
        logger.debug("==============작업공간==================");

        if (workModules.size() < 2) {
            logger.debug("작업공간이 2개 미만이므로 효율성 100점 반환");
            return 100.0; // 작업공간이 1개 이하면 만점
        }

        // 작업공간들 간의 평균 거리 계산
        double totalDistance = 0;
        int pairCount = 0;

        for (int i = 0; i < workModules.size(); i++) {
            for (int j = i + 1; j < workModules.size(); j++) {
                double distance = calculateDistance(
                        workModules.get(i).getPosition(),
                        workModules.get(j).getPosition());
                totalDistance += distance;
                pairCount++;
            }
        }

        double averageDistance = pairCount > 0 ? totalDistance / pairCount : 0;
        logger.debug("작업공간 간의 평균 거리: {}", averageDistance);

        // 거주지 크기 기반 자동 기준값 계산
        HabitatDimensions dims = request.getHabitatDimensions();
        double habitatWidth = dims.getXAsDouble();
        double habitatHeight = dims.getYAsDouble();
        double habitatDepth = dims.getZAsDouble();

        // 1. 거주지의 물리적 최대 거리 계산 (대각선)
        double maxPossibleDistance = Math.sqrt(
                habitatWidth * habitatWidth +
                        habitatHeight * habitatHeight +
                        habitatDepth * habitatDepth);

        // 2. 허용 최대 거리 (대각선의 70%)
        double acceptableMaxDist = maxPossibleDistance * 0.7;

        // 3. 이상적 최소 거리 (2m)
        double idealMinDist = 2.0;

        // 4. 거리 기반 유틸리티 계산
        double utilityDistance;
        if (averageDistance < idealMinDist) {
            // 너무 가까움 - 감점 (0.5배)
            utilityDistance = (averageDistance / idealMinDist) * 0.5;
        } else if (averageDistance > acceptableMaxDist) {
            // 너무 멀음 - 0점
            utilityDistance = 0.0;
        } else {
            // 선형 보간 (2m ~ 70% 대각선)
            utilityDistance = 1.0 - (averageDistance - idealMinDist) /
                    (acceptableMaxDist - idealMinDist);
        }

        // 5. D_good 계산 (모듈 크기 기반)
        double totalDGood = 0;
        int workModuleCount = 0;

        for (ModulePlacement workModule : workModules) {
            double width = workModule.getSize().getWidthAsDouble();
            double height = workModule.getSize().getHeightAsDouble();
            double depth = workModule.getSize().getDepthAsDouble();

            // D_good = min(w,h,d) / 2 (0~1 범위로 정규화)
            double dGood = Math.min(Math.min(width, height), depth) / 2.0;
            totalDGood += dGood;
            workModuleCount++;

        }

        double averageDGood = workModuleCount > 0 ? totalDGood / workModuleCount : 0.5;
        logger.debug("평균 D_good: {}", String.format("%.2f", averageDGood));

        // 6. 최종 점수 (가중 평균: 거리 40% + D_good 60%)
        double finalScore = 0.4 * utilityDistance + 0.6 * averageDGood;
        double efficiencyScore = Math.max(0.0, Math.min(100.0, finalScore * 100.0));

        logger.debug("효율성 계산 - 거리유틸리티: {}, 평균D_good: {}, 최종점수: {}",
                String.format("%.2f", utilityDistance),
                String.format("%.2f", averageDGood),
                String.format("%.2f", efficiencyScore));

        return efficiencyScore;
    }

    // 거주지 전체 치수 기반 D_good 계산
    private double calculateHabitatBasedDGood(LayoutEvaluationRequest request) {
        HabitatDimensions dims = request.getHabitatDimensions();

        // 입력받은 거주지 치수 사용
        double habitatWidth = dims.getXAsDouble();
        double habitatHeight = dims.getYAsDouble();
        double habitatDepth = dims.getZAsDouble();

        // D_good = min(거주지_치수) / 3 (거주지 설계 맥락 기준)
        return Math.min(Math.min(habitatWidth, habitatHeight), habitatDepth) / 3.0;
    }

    // 특정 태그를 가진 모듈들 필터링
    // private List<ModulePlacement> filterModulesByTag(List<ModulePlacement>
    // placements, String tagName) {
    // return placements.stream()
    // .filter(placement -> {
    // Module module = moduleService.findEntityById(placement.getModuleId());
    // return module != null && module.hasTag(tagName);
    // })
    // .collect(Collectors.toList());
    // }

    private List<ModulePlacement> filterModulesByTag(List<ModulePlacement> placements, String tagName) {
        logger.debug("태그 '{}'로 필터링 시작, 총 모듈 수: {}", tagName, placements.size());

        return placements.stream()
                .filter(placement -> {
                    Module module = moduleService.findEntityById(placement.getModuleId());
                    if (module == null) {
                        logger.debug("모듈 ID {}를 찾을 수 없음", placement.getModuleId());
                        return false;
                    }

                    boolean hasTag = module.hasTag(tagName);
                    logger.debug("모듈 {} (ID: {}) - 태그 '{}' 보유: {}",
                            module.getName(), placement.getModuleId(), tagName, hasTag);

                    if (hasTag) {
                        logger.debug("모듈 {}의 태그들: {}", module.getName(),
                                module.getTags().stream()
                                        .map(tag -> tag.getTagName())
                                        .collect(Collectors.toList()));
                    }

                    return hasTag;
                })
                .collect(Collectors.toList());
    }

    // 피드백 생성
    private EvaluationFeedback generateFeedback(LayoutEvaluationRequest request, EvaluationScores scores) {
        EvaluationFeedback feedback = new EvaluationFeedback();

        // 강점 피드백
        generateStrengthsFeedback(feedback, scores, request);

        // 개선점 피드백
        generateImprovementsFeedback(feedback, scores, request);

        return feedback;
    }

    // 강점 피드백 생성
    private void generateStrengthsFeedback(EvaluationFeedback feedback, EvaluationScores scores,
            LayoutEvaluationRequest request) {
        if (scores.getSpaceUtilization() >= 85) {
            feedback.addStrength(
                    "Excellent space utilization. NHV optimization and overall space efficiency are outstanding.");
        }

        if (scores.getComfortability() >= 80) {
            feedback.addStrength(
                    "Comfortable module arrangement achieved. Well separated from noise and contamination sources.");
        }

        if (scores.getEfficiency() >= 80) {
            feedback.addStrength("Excellent work efficiency. Related work spaces are well positioned.");
        }

        // NHV 적정성 특별 피드백
        if (hasOptimalNhvRatio(request)) {
            feedback.addStrength("All modules are efficiently designed within the optimal NHV range (1.0~1.35x).");
        }
    }

    // 개선점 피드백 생성
    private void generateImprovementsFeedback(EvaluationFeedback feedback, EvaluationScores scores,
            LayoutEvaluationRequest request) {
        if (scores.getSpaceUtilization() < 70) {
            feedback.addImprovement("Try arranging modules more efficiently to improve space utilization.");
        }

        if (scores.getComfortability() < 60) {
            feedback.addImprovement(
                    "Place noise-generating modules and private spaces further apart to improve comfort.");
        }

        if (scores.getEfficiency() < 60) {
            feedback.addImprovement("Position related work spaces closer together to improve work efficiency.");
        }

        // NHV 관련 개선 피드백 (기본 제약 조건 위반이 아닌 경우에만)
        if (hasInefficientNhvRatio(request) && !hasNhvFailure(request)) {
            feedback.addImprovement(
                    "Some modules are outside the optimal NHV range. Adjust module sizes within 1.0~1.35x range.");
        }
    }

    // NHV 적정 비율 확인 (1.0~1.35)
    private boolean hasOptimalNhvRatio(LayoutEvaluationRequest request) {
        for (ModulePlacement placement : request.getModulePlacements()) {
            Module module = moduleService.findEntityById(placement.getModuleId());
            if (module == null)
                continue;

            double userVolume = placement.getSize().getVolumeAsDouble();
            double requiredNhv = module.getNhv().doubleValue();
            double ratio = userVolume / requiredNhv;

            if (ratio < 1.0 || ratio > 1.35) {
                return false;
            }
        }
        return true;
    }

    // NHV 비효율 비율 확인 (1.35 초과)
    private boolean hasInefficientNhvRatio(LayoutEvaluationRequest request) {
        for (ModulePlacement placement : request.getModulePlacements()) {
            Module module = moduleService.findEntityById(placement.getModuleId());
            if (module == null)
                continue;

            double userVolume = placement.getSize().getVolumeAsDouble();
            double requiredNhv = module.getNhv().doubleValue();
            double ratio = userVolume / requiredNhv;

            if (ratio > 1.35) {
                return true;
            }
        }
        return false;
    }

    // NHV 실패 확인 (1.0 미만)
    private boolean hasNhvFailure(LayoutEvaluationRequest request) {
        for (ModulePlacement placement : request.getModulePlacements()) {
            Module module = moduleService.findEntityById(placement.getModuleId());
            if (module == null)
                continue;

            double userVolume = placement.getSize().getVolumeAsDouble();
            double requiredNhv = module.getNhv().doubleValue();

            if (userVolume < requiredNhv) {
                return true;
            }
        }
        return false;
    }

    // 실패 응답 생성
    private LayoutEvaluationResponse createFailureResponse(LayoutEvaluationResponse.ValidationResult validation,
            LayoutEvaluationRequest request) {
        EvaluationScores scores = new EvaluationScores(PENALTY_SCORE);
        EvaluationFeedback feedback = createValidationErrorFeedback(validation, request);

        return new LayoutEvaluationResponse(scores, feedback, validation);
    }

    // 검증 오류 피드백 생성
    private EvaluationFeedback createValidationErrorFeedback(LayoutEvaluationResponse.ValidationResult validation,
            LayoutEvaluationRequest request) {
        EvaluationFeedback feedback = new EvaluationFeedback();

        if (!validation.isAllModulesUsed()) {
            feedback.addError("All 18 modules must be used. Currently missing modules.");
        }

        if (!validation.isNoOverlapping()) {
            feedback.addError("Modules must not overlap with each other.");
        }

        if (!validation.isFitInHabitat()) {
            feedback.addError("All modules must be placed within the habitat space.");
        }

        if (!validation.isNhvSatisfied()) {
            List<String> nhvFailures = getNhvFailureDetails(request);
            String detailedMessage = "Some modules do not meet the minimum NHV (Net Habitable Volume) requirements:\n" +
                    String.join("\n", nhvFailures) +
                    "\n\nPlease increase module sizes.";
            feedback.addError(detailedMessage);
        }

        return feedback;
    }

    // 에러 생성
    private LayoutEvaluationResponse createErrorResponse(String errorCode, String errorMessage) {
        EvaluationScores scores = new EvaluationScores(PENALTY_SCORE);
        EvaluationFeedback feedback = new EvaluationFeedback(List.of(errorMessage));
        LayoutEvaluationResponse.ValidationResult validation = new LayoutEvaluationResponse.ValidationResult(false,
                false, false, false);

        return new LayoutEvaluationResponse(scores, feedback, validation);
    }
}
