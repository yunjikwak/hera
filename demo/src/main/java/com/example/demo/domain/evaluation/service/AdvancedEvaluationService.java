package com.example.demo.domain.evaluation.service;

import com.example.demo.domain.evaluation.dto.*;
import com.example.demo.domain.rag.dto.RagQueryRequest;
import com.example.demo.domain.rag.service.RagQueryService;
import com.example.demo.domain.rag.dto.RagAnswer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdvancedEvaluationService {

    private static final Logger logger = LoggerFactory.getLogger(AdvancedEvaluationService.class);

    // 기본이 basic
    @Value("${evaluation.mode:basic}")
    private String evaluationMode;

    private final LayoutEvaluationService layoutEvaluationService;
    private final RagQueryService ragQueryService;

    public LayoutEvaluationResponse evaluateLayout(LayoutEvaluationRequest request) {
        // basic
        LayoutEvaluationResponse basicResponse = layoutEvaluationService.evaluateLayout(request);
        if (!basicResponse.getValidation().isValid()) {
            return basicResponse;
        }

        // 미션별 가중치
        LayoutEvaluationResponse advancedResponse = applyMissionModifications(request, basicResponse);

        // 피드백
        if ("advanced".equals(evaluationMode)) {
            enhanceFeedbackWithRag(request, advancedResponse);
        }

        return advancedResponse;
    }

    private LayoutEvaluationResponse applyMissionModifications(LayoutEvaluationRequest request,
            LayoutEvaluationResponse basicResponse) {
        String missionProfile = request.getMissionProfile();
        if (missionProfile == null) {
            return basicResponse;
        }

        try {
            if ("MARS".equalsIgnoreCase(missionProfile)) {
                return applyMissionWeightsAndBonuses("MARS", basicResponse, request);
            } else if ("LUNAR".equalsIgnoreCase(missionProfile)) {
                return applyMissionWeightsAndBonuses("LUNAR", basicResponse, request);
            } else {
                logger.warn("Invalid mission profile: {}", missionProfile);
                return basicResponse;
            }
        } catch (Exception e) {
            logger.warn("Error processing mission profile: {}", missionProfile, e);
            return basicResponse;
        }
    }

    private LayoutEvaluationResponse applyMissionWeightsAndBonuses(
            String mission,
            LayoutEvaluationResponse response,
            LayoutEvaluationRequest request) {
        EvaluationScores originalScores = response.getScores();

        // RAG 컨텍스트 조회
        String ragContext = queryRagForContext(request, mission);

        // 미션별 가중치 설정
        MissionWeights weights = getMissionWeights(mission);

        // RAG 기반 보너스/페널티 계산
        MissionAdjustments adjustments = calculateMissionAdjustments(mission, ragContext, request);

        // 점수에 보너스/페널티 적용
        double adjustedSpace = Math.max(0.0,
                Math.min(100.0, originalScores.getSpaceUtilization() + adjustments.spaceBonus));
        double adjustedComfort = Math.max(0.0,
                Math.min(100.0, originalScores.getComfortability() + adjustments.comfortBonus));
        double adjustedEfficiency = Math.max(0.0,
                Math.min(100.0, originalScores.getEfficiency() + adjustments.efficiencyBonus));

        // 미션별 가중치로 최종 점수 계산
        double overallScore = adjustedSpace * weights.spaceWeight +
                adjustedComfort * weights.comfortWeight +
                adjustedEfficiency * weights.efficiencyWeight;

        EvaluationScores adjustedScores = new EvaluationScores(
                adjustedSpace, adjustedComfort, adjustedEfficiency, overallScore);

        // 미션별 + RAG 기반 피드백 생성
        EvaluationFeedback enhancedFeedback = enhanceFeedbackForMission(mission, response.getFeedback(), adjustments,
                ragContext);

        return new LayoutEvaluationResponse(adjustedScores, enhancedFeedback, response.getValidation());
    }

    // 미션별 가중치 반환
    private MissionWeights getMissionWeights(String mission) {
        if ("MARS".equals(mission)) {
            return new MissionWeights(0.45, 0.35, 0.20); // 공간↑, 쾌적성↑, 효율성↓
        } else if ("LUNAR".equals(mission)) {
            return new MissionWeights(0.30, 0.25, 0.45); // 공간↓, 쾌적성↓, 효율성↑
        } else {
            return new MissionWeights(0.40, 0.30, 0.30); // 기본값
        }
    }

    // RAG 컨텍스트 조회
    private String queryRagForContext(LayoutEvaluationRequest request, String mission) {
        try {
            // RAG 쿼리 생성
            String ragQuery = buildRagQuery(request, mission);

            // request 생성
            RagQueryRequest ragRequest = new RagQueryRequest(ragQuery, 2, mission);

            RagAnswer ragAnswer = ragQueryService.query(ragRequest);
            return ragAnswer.getAnswer() != null ? ragAnswer.getAnswer() : "";

        } catch (Exception e) {
            logger.warn("Failed to query RAG for context: {}", e.getMessage());
            return "";
        }
    }

    // RAG 쿼리문 생성
    private String buildRagQuery(LayoutEvaluationRequest request, String mission) {
        StringBuilder query = new StringBuilder();

        // 미션 설명
        query.append("Space habitat layout evaluation for ");
        query.append(mission.toLowerCase()).append(" mission. ");

        // 거주지 크기
        query.append("Habitat dimensions(w*d*h): ").append(request.getHabitatDimensions().getXAsDouble())
                .append("x").append(request.getHabitatDimensions().getYAsDouble())
                .append("x").append(request.getHabitatDimensions().getZAsDouble()).append("m. ");

        // 모듈 개수
        query.append("Module count: ").append(request.getModuleCount()).append(". ");

        query.append("What are the key considerations for improving this layout?");

        // 화성 미션을 위한 우주 거주지 레이아웃 평가입니다. 거주지 크기는 20x8x1m 이고, 모듈은 18개입니다. 이 레이아웃을 개선하기 위한
        // 핵심 고려사항은 무엇인가요?

        return query.toString();
    }

    // 미션별 + RAG 기반 보너스/페널티 계산
    private MissionAdjustments calculateMissionAdjustments(String mission, String ragContext,
            LayoutEvaluationRequest request) {
        MissionAdjustments adjustments = new MissionAdjustments();

        // 기본 미션별 보너스
        if ("MARS".equals(mission)) {
            adjustments.spaceBonus = calculateMarsSpaceBonus(request);
            adjustments.comfortBonus = calculateMarsComfortBonus(request);
            adjustments.efficiencyBonus = calculateMarsEfficiencyBonus(request);
        } else if ("LUNAR".equals(mission)) {
            adjustments.spaceBonus = calculateLunarSpaceBonus(request);
            adjustments.comfortBonus = calculateLunarComfortBonus(request);
            adjustments.efficiencyBonus = calculateLunarEfficiencyBonus(request);
        }

        // RAG 기반 추가 보너스/페널티
        if (!ragContext.isEmpty()) {
            addRagBasedAdjustments(adjustments, ragContext, mission);
        }

        return adjustments;
    }

    // RAG 기반 보너스/페널티 추가
    private void addRagBasedAdjustments(MissionAdjustments adjustments, String ragContext, String mission) {
        String context = ragContext.toLowerCase();

        // 화성 미션 RAG 보너스
        if ("MARS".equals(mission)) {
            if (context.contains("privacy") && context.contains("long-duration")) {
                adjustments.comfortBonus += 5.0; // 장기 거주 사생활 보호 중요
            }
            if (context.contains("resource") && context.contains("efficiency")) {
                adjustments.spaceBonus += 3.0; // 자원 절약 중요
            }
            if (context.contains("psychological") && context.contains("isolation")) {
                adjustments.comfortBonus += 4.0; // 심리적 안정성 중요
            }
        }

        // 달 미션 RAG 보너스
        if ("LUNAR".equals(mission)) {
            if (context.contains("eva") && context.contains("operations")) {
                adjustments.efficiencyBonus += 8.0; // EVA 효율성 중요
            }
            if (context.contains("experiment") && context.contains("laboratory")) {
                adjustments.efficiencyBonus += 5.0; // 실험 효율성 중요
            }
            if (context.contains("emergency") && context.contains("access")) {
                adjustments.efficiencyBonus += 3.0; // 응급 접근성 중요
            }
        }

        // 공통 RAG 보너스
        if (context.contains("radiation") && context.contains("shielding")) {
            adjustments.comfortBonus += 2.0; // 방사선 차폐 중요
        }
        if (context.contains("contamination") && context.contains("isolation")) {
            adjustments.comfortBonus += 3.0; // 오염 격리 중요
        }
    }

    private double calculateMarsSpaceBonus(LayoutEvaluationRequest request) {
        // Mars missions prioritize space efficiency due to long duration
        double bonus = 0.0;

        // Check for optimal space utilization
        double totalNhv = request.getModulePlacements().stream()
                .mapToDouble(placement -> placement.getSize().getVolumeAsDouble())
                .sum();
        double habitatVolume = request.getTotalHabitatVolume();
        double utilization = (totalNhv / habitatVolume) * 100;

        if (utilization >= 70 && utilization <= 85) {
            bonus += 5.0; // Bonus for optimal space utilization
        }

        return bonus;
    }

    private double calculateMarsComfortBonus(LayoutEvaluationRequest request) {
        // Mars missions need strong privacy and psychological comfort
        double bonus = 0.0;

        // Check for private quarters spacing (simplified check)
        long privateModules = request.getModulePlacements().stream()
                .filter(placement -> {
                    // This would need to check module tags in a real implementation
                    return placement.getModuleId() == 17; // Private Quarters module
                })
                .count();

        if (privateModules > 0) {
            bonus += 3.0; // Bonus for having private quarters
        }

        return bonus;
    }

    private double calculateMarsEfficiencyBonus(LayoutEvaluationRequest request) {
        // Mars missions need efficient resource management
        double bonus = 0.0;

        // Check for medical module proximity (simplified)
        long medicalModules = request.getModulePlacements().stream()
                .filter(placement -> placement.getModuleId() == 13 || placement.getModuleId() == 14)
                .count();

        if (medicalModules >= 2) {
            bonus += 2.0; // Bonus for having medical facilities
        }

        return bonus;
    }

    private double calculateLunarSpaceBonus(LayoutEvaluationRequest request) {
        // Lunar missions can be more flexible with space
        return 0.0; // No specific bonus for lunar space
    }

    private double calculateLunarComfortBonus(LayoutEvaluationRequest request) {
        // Lunar missions prioritize EVA operations and Earth communication
        double bonus = 0.0;

        // Check for workstation clustering (simplified)
        long workstationModules = request.getModulePlacements().stream()
                .filter(placement -> placement.getModuleId() == 9 || placement.getModuleId() == 15)
                .count();

        if (workstationModules >= 2) {
            bonus += 2.0; // Bonus for workstation clustering
        }

        return bonus;
    }

    private double calculateLunarEfficiencyBonus(LayoutEvaluationRequest request) {
        // Lunar missions need efficient EVA operations
        double bonus = 0.0;

        // Check for EVA-related modules (simplified)
        long evaModules = request.getModulePlacements().stream()
                .filter(placement -> placement.getModuleId() == 10) // Maintenance Workbench
                .count();

        if (evaModules > 0) {
            bonus += 1.0; // Bonus for EVA support
        }

        return bonus;
    }

    private EvaluationFeedback enhanceFeedbackForMission(String mission,
            EvaluationFeedback originalFeedback,
            MissionAdjustments adjustments, String ragContext) {
        EvaluationFeedback enhancedFeedback = new EvaluationFeedback();

        // Copy original feedback
        if (originalFeedback.getStrengths() != null) {
            if (enhancedFeedback.getStrengths() == null) {
                enhancedFeedback.setStrengths(new java.util.ArrayList<>());
            }
            enhancedFeedback.getStrengths().addAll(originalFeedback.getStrengths());
        }
        if (originalFeedback.getImprovements() != null) {
            if (enhancedFeedback.getImprovements() == null) {
                enhancedFeedback.setImprovements(new java.util.ArrayList<>());
            }
            enhancedFeedback.getImprovements().addAll(originalFeedback.getImprovements());
        }
        if (originalFeedback.getErrors() != null) {
            if (enhancedFeedback.getErrors() == null) {
                enhancedFeedback.setErrors(new java.util.ArrayList<>());
            }
            enhancedFeedback.getErrors().addAll(originalFeedback.getErrors());
        }

        // Add mission-specific feedback
        addMissionSpecificFeedback(mission, enhancedFeedback, adjustments);

        // Add RAG-based feedback
        if (!ragContext.isEmpty()) {
            addRagBasedFeedback(enhancedFeedback, ragContext, mission);
        }

        return enhancedFeedback;
    }

    private void addMissionSpecificFeedback(String mission, EvaluationFeedback feedback,
            MissionAdjustments adjustments) {
        if ("MARS".equals(mission)) {
            if (adjustments.spaceBonus > 0) {
                feedback.addStrength("Excellent space utilization for long-duration Mars mission requirements.");
            }
            if (adjustments.comfortBonus > 0) {
                feedback.addStrength("Good privacy and psychological comfort setup for Mars mission isolation.");
            }
            if (adjustments.efficiencyBonus > 0) {
                feedback.addStrength("Efficient resource management configuration for Mars mission sustainability.");
            }
        } else if ("LUNAR".equals(mission)) {
            if (adjustments.comfortBonus > 0) {
                feedback.addStrength("Well-configured workstation clustering for lunar EVA operations.");
            }
            if (adjustments.efficiencyBonus > 0) {
                feedback.addStrength("Good EVA support infrastructure for lunar surface operations.");
            }
        }
    }

    // RAG 기반 피드백 추가
    private void addRagBasedFeedback(EvaluationFeedback feedback, String ragContext, String mission) {
        String context = ragContext.toLowerCase();

        // 화성 미션 RAG 피드백
        if ("MARS".equals(mission)) {
            if (context.contains("privacy") && context.contains("long-duration")) {
                feedback.addStrength(
                        "Research indicates: Excellent privacy configuration for long-duration Mars missions. " +
                                "Crew psychological well-being is well addressed.");
            }
            if (context.contains("resource") && context.contains("efficiency")) {
                feedback.addStrength(
                        "Research suggests: Good resource efficiency setup for Mars mission sustainability. " +
                                "Space utilization aligns with long-duration mission requirements.");
            }
            if (context.contains("psychological") && context.contains("isolation")) {
                feedback.addImprovement("Research recommends: Consider additional psychological comfort measures " +
                        "for Mars mission isolation challenges.");
            }
        }

        // 달 미션 RAG 피드백
        if ("LUNAR".equals(mission)) {
            if (context.contains("eva") && context.contains("operations")) {
                feedback.addStrength("Research indicates: Excellent EVA operations setup for lunar surface missions. " +
                        "Workstation clustering supports efficient extravehicular activities.");
            }
            if (context.contains("experiment") && context.contains("laboratory")) {
                feedback.addStrength(
                        "Research suggests: Good laboratory configuration for lunar scientific experiments. " +
                                "Workflow efficiency is optimized for research activities.");
            }
            if (context.contains("emergency") && context.contains("access")) {
                feedback.addImprovement("Research recommends: Ensure emergency access pathways are optimized " +
                        "for lunar mission safety protocols.");
            }
        }

        // 공통 RAG 피드백
        if (context.contains("radiation") && context.contains("shielding")) {
            feedback.addImprovement("Research indicates: Consider radiation shielding placement for crew protection. " +
                    "Medical facilities should be centrally located for optimal safety.");
        }
        if (context.contains("contamination") && context.contains("isolation")) {
            feedback.addImprovement(
                    "Research suggests: Ensure proper contamination isolation between clean and dirty zones. " +
                            "This is critical for crew health and mission success.");
        }

        // RAG 참조 정보 추가
        if (!ragContext.isEmpty()) {
            feedback.addImprovement(
                    "References: " + ragContext.substring(0, Math.min(200, ragContext.length())) + "...");
        }
    }

    private void enhanceFeedbackWithRag(LayoutEvaluationRequest request, LayoutEvaluationResponse response) {
        try {
            // Query RAG for relevant context based on evaluation results
            String ragQuery = buildRagQuery(request, response);
            RagQueryRequest ragRequest = new RagQueryRequest(ragQuery, 2, request.getMissionProfile());

            RagAnswer ragAnswer = ragQueryService.query(ragRequest);

            if (ragAnswer.getAnswer() != null && !ragAnswer.getAnswer().trim().isEmpty()) {
                // Add RAG context to feedback
                EvaluationFeedback feedback = response.getFeedback();
                feedback.addImprovement("Additional considerations from research: " + ragAnswer.getAnswer());

                // Add references
                if (!ragAnswer.getSources().isEmpty()) {
                    StringBuilder references = new StringBuilder("References: ");
                    for (RagAnswer.Source source : ragAnswer.getSources()) {
                        references.append(source.getSourcePath()).append(" (p").append(source.getPageNo())
                                .append("); ");
                    }
                    feedback.addImprovement(references.toString());
                }
            }

        } catch (Exception e) {
            logger.warn("Failed to enhance feedback with RAG: {}", e.getMessage());
        }
    }

    private String buildRagQuery(LayoutEvaluationRequest request, LayoutEvaluationResponse response) {
        StringBuilder query = new StringBuilder();

        query.append("Space habitat layout evaluation for ");
        if (request.getMissionProfile() != null) {
            query.append(request.getMissionProfile().toLowerCase()).append(" mission. ");
        }

        query.append("Space utilization: ").append(String.format("%.1f", response.getScores().getSpaceUtilization()))
                .append("%, ");
        query.append("Comfortability: ").append(String.format("%.1f", response.getScores().getComfortability()))
                .append("%, ");
        query.append("Efficiency: ").append(String.format("%.1f", response.getScores().getEfficiency())).append("%. ");

        query.append("What are the key considerations for improving this layout?");

        return query.toString();
    }

    private static class MissionAdjustments {
        double spaceBonus = 0.0;
        double comfortBonus = 0.0;
        double efficiencyBonus = 0.0;
    }

    // Mission-specific weights data class
    private static class MissionWeights {
        final double spaceWeight;
        final double comfortWeight;
        final double efficiencyWeight;

        MissionWeights(double spaceWeight, double comfortWeight, double efficiencyWeight) {
            this.spaceWeight = spaceWeight;
            this.comfortWeight = comfortWeight;
            this.efficiencyWeight = efficiencyWeight;
        }
    }
}
