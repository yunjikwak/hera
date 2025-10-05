package com.example.demo.controller.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 평가 점수 정보 DTO
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EvaluationScores {

    private Double spaceUtilization;
    private Double comfortability;
    private Double efficiency;
    private Double overallScore;
    private Integer penaltyScore;

    // 기본 생성자
    public EvaluationScores() {
    }

    // 편의 생성자
    public EvaluationScores(Double spaceUtilization, Double comfortability,
            Double efficiency, Double overallScore) {
        this.spaceUtilization = spaceUtilization;
        this.comfortability = comfortability;
        this.efficiency = efficiency;
        this.overallScore = overallScore;
    }

    // 패널티 점수 생성자
    public EvaluationScores(Integer penaltyScore) {
        this.penaltyScore = penaltyScore;
    }

    // Getter/Setter 메서드들
    public Double getSpaceUtilization() {
        return spaceUtilization;
    }

    public void setSpaceUtilization(Double spaceUtilization) {
        this.spaceUtilization = spaceUtilization;
    }

    public Double getComfortability() {
        return comfortability;
    }

    public void setComfortability(Double comfortability) {
        this.comfortability = comfortability;
    }

    public Double getEfficiency() {
        return efficiency;
    }

    public void setEfficiency(Double efficiency) {
        this.efficiency = efficiency;
    }

    public Double getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(Double overallScore) {
        this.overallScore = overallScore;
    }

    public Integer getPenaltyScore() {
        return penaltyScore;
    }

    public void setPenaltyScore(Integer penaltyScore) {
        this.penaltyScore = penaltyScore;
    }

    // 헬퍼 메서드들
    public boolean hasPenalty() {
        return penaltyScore != null && penaltyScore > 0;
    }

    public boolean hasValidScores() {
        return spaceUtilization != null && comfortability != null &&
                efficiency != null && overallScore != null;
    }

    // 방사형 차트 데이터용
    public java.util.Map<String, Double> getRadarChartData() {
        if (hasPenalty()) {
            return null; // 패널티가 있으면 차트 데이터 없음
        }

        return java.util.Map.of(
                "공간활용도", spaceUtilization != null ? spaceUtilization : 0.0,
                "쾌적성", comfortability != null ? comfortability : 0.0,
                "효율성", efficiency != null ? efficiency : 0.0);
    }

    @Override
    public String toString() {
        if (hasPenalty()) {
            return String.format("EvaluationScores{penaltyScore=%d}", penaltyScore);
        }

        return String.format(
                "EvaluationScores{spaceUtilization=%.2f, comfortability=%.2f, efficiency=%.2f, overallScore=%.2f}",
                spaceUtilization, comfortability, efficiency, overallScore);
    }
}
