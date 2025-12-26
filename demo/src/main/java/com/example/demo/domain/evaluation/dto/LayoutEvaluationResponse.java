package com.example.demo.domain.evaluation.dto;

import com.example.demo.domain.evaluation.dto.EvaluationScores;
import com.example.demo.domain.evaluation.dto.EvaluationFeedback;
import com.fasterxml.jackson.annotation.JsonInclude;

// import lombok.AllArgsConstructor;
import lombok.Getter;

// 배치 평가 응답 DTO
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LayoutEvaluationResponse {

    public LayoutEvaluationResponse() {
    }

    private EvaluationScores scores;
    private EvaluationFeedback feedback;
    private ValidationResult validation;

    // 중첩 클래스: 검증 결과s
    public static class ValidationResult {
        private boolean allModulesUsed;
        private boolean noOverlapping;
        private boolean fitInHabitat;
        private boolean nhvSatisfied;

        // 기본 생성자
        public ValidationResult() {
        }

        // 편의 생성자
        public ValidationResult(boolean allModulesUsed, boolean noOverlapping, boolean fitInHabitat,
                boolean nhvSatisfied) {
            this.allModulesUsed = allModulesUsed;
            this.noOverlapping = noOverlapping;
            this.fitInHabitat = fitInHabitat;
            this.nhvSatisfied = nhvSatisfied;
        }

        // Getter/Setter 메서드들
        public boolean isAllModulesUsed() {
            return allModulesUsed;
        }

        public void setAllModulesUsed(boolean allModulesUsed) {
            this.allModulesUsed = allModulesUsed;
        }

        public boolean isNoOverlapping() {
            return noOverlapping;
        }

        public void setNoOverlapping(boolean noOverlapping) {
            this.noOverlapping = noOverlapping;
        }

        public boolean isFitInHabitat() {
            return fitInHabitat;
        }

        public void setFitInHabitat(boolean fitInHabitat) {
            this.fitInHabitat = fitInHabitat;
        }

        public boolean isNhvSatisfied() {
            return nhvSatisfied;
        }

        public void setNhvSatisfied(boolean nhvSatisfied) {
            this.nhvSatisfied = nhvSatisfied;
        }

        public boolean isValid() {
            return allModulesUsed && noOverlapping && fitInHabitat && nhvSatisfied;
        }

        @Override
        public String toString() {
            return String.format(
                    "ValidationResult{allModulesUsed=%s, noOverlapping=%s, fitInHabitat=%s, nhvSatisfied=%s}",
                    allModulesUsed, noOverlapping, fitInHabitat, nhvSatisfied);
        }
    }

    // 편의 생성자들
    public LayoutEvaluationResponse(EvaluationScores scores, EvaluationFeedback feedback, ValidationResult validation) {
        this.scores = scores;
        this.feedback = feedback;
        this.validation = validation;
    }

    public LayoutEvaluationResponse(EvaluationScores scores, ValidationResult validation) {
        this.scores = scores;
        this.validation = validation;
    }

    public void setScores(EvaluationScores scores) {
        this.scores = scores;
    }

    public void setFeedback(EvaluationFeedback feedback) {
        this.feedback = feedback;
    }

    public void setValidation(ValidationResult validation) {
        this.validation = validation;
    }

    public boolean hasValidScore() {
        return scores != null && !scores.hasPenalty() && scores.hasValidScores();
    }

    public boolean hasErrors() {
        return feedback != null && feedback.hasErrors();
    }

    public boolean isSuccessful() {
        return hasValidScore() && validation != null && validation.isValid();
    }

    // 방사형 차트 데이터 변환
    public java.util.Map<String, Double> getRadarChartData() {
        if (scores != null && !scores.hasPenalty()) {
            return scores.getRadarChartData();
        }
        return null;
    }

    @Override
    public String toString() {
        return String.format("LayoutEvaluationResponse{scores=%s, feedback=%s, validation=%s}",
                scores, feedback, validation);
    }
}
