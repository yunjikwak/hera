package com.example.demo.domain.evaluation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.ArrayList;
import java.util.List;

/**
 * 평가 피드백 정보 DTO
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EvaluationFeedback {

    private List<String> strengths = new ArrayList<>();
    private List<String> improvements = new ArrayList<>();
    private List<String> errors = new ArrayList<>();

    // 기본 생성자
    public EvaluationFeedback() {
    }

    // 편의 생성자들
    public EvaluationFeedback(List<String> strengths, List<String> improvements) {
        this.strengths = strengths;
        this.improvements = improvements;
    }

    public EvaluationFeedback(List<String> errors) {
        this.errors = errors;
    }

    public EvaluationFeedback(List<String> strengths, List<String> improvements, List<String> errors) {
        this.strengths = strengths;
        this.improvements = improvements;
        this.errors = errors;
    }

    // Getter/Setter 메서드들
    public List<String> getStrengths() {
        return strengths;
    }

    public void setStrengths(List<String> strengths) {
        this.strengths = strengths;
    }

    public List<String> getImprovements() {
        return improvements;
    }

    public void setImprovements(List<String> improvements) {
        this.improvements = improvements;
    }

    public List<String> getErrors() {
        return errors;
    }

    public void setErrors(List<String> errors) {
        this.errors = errors;
    }

    // 헬퍼 메서드들
    public boolean hasErrors() {
        return errors != null && !errors.isEmpty();
    }

    public boolean hasStrengths() {
        return strengths != null && !strengths.isEmpty();
    }

    public boolean hasImprovements() {
        return improvements != null && !improvements.isEmpty();
    }

    public boolean isEmpty() {
        return !hasErrors() && !hasStrengths() && !hasImprovements();
    }

    // 피드백 추가 메서드들
    public void addStrength(String strength) {
        if (this.strengths == null) {
            this.strengths = new java.util.ArrayList<>();
        }
        this.strengths.add(strength);
    }

    public void addImprovement(String improvement) {
        if (this.improvements == null) {
            this.improvements = new java.util.ArrayList<>();
        }
        this.improvements.add(improvement);
    }

    public void addError(String error) {
        if (this.errors == null) {
            this.errors = new java.util.ArrayList<>();
        }
        this.errors.add(error);
    }

    @Override
    public String toString() {
        return String.format("EvaluationFeedback{strengths=%s, improvements=%s, errors=%s}",
                strengths, improvements, errors);
    }
}
