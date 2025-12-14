package com.example.demo.domain.evaluation.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 평가 기록 엔티티
 * 배치 평가 결과를 로깅하고 추후 분석에 활용
 */
@Entity
@Table(name = "evaluation_records")
public class EvaluationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "habitat_x", nullable = false, precision = 10, scale = 2)
    private BigDecimal habitatX;

    @Column(name = "habitat_y", nullable = false, precision = 10, scale = 2)
    private BigDecimal habitatY;

    @Column(name = "habitat_z", nullable = false, precision = 10, scale = 2)
    private BigDecimal habitatZ;

    // @Column(name = "mission_profile", nullable = false, length = 20)
    // private String missionProfile;

    @Column(name = "layout_json", nullable = false, columnDefinition = "TEXT")
    private String layoutJson;

    @Column(name = "scores_json", nullable = false, columnDefinition = "TEXT")
    private String scoresJson;

    @Column(name = "feedback_json", columnDefinition = "TEXT")
    private String feedbackJson;

    @Column(name = "evaluation_time")
    @CreationTimestamp
    private LocalDateTime evaluationTime;

    // 기본 생성자
    public EvaluationRecord() {
    }

    // Getter/Setter 메서드들
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BigDecimal getHabitatX() {
        return habitatX;
    }

    public void setHabitatX(BigDecimal habitatX) {
        this.habitatX = habitatX;
    }

    public BigDecimal getHabitatY() {
        return habitatY;
    }

    public void setHabitatY(BigDecimal habitatY) {
        this.habitatY = habitatY;
    }

    public BigDecimal getHabitatZ() {
        return habitatZ;
    }

    public void setHabitatZ(BigDecimal habitatZ) {
        this.habitatZ = habitatZ;
    }

    // public String getMissionProfile() {
    // return missionProfile;
    // }

    // public void setMissionProfile(String missionProfile) {
    // this.missionProfile = missionProfile;
    // }

    public String getLayoutJson() {
        return layoutJson;
    }

    public void setLayoutJson(String layoutJson) {
        this.layoutJson = layoutJson;
    }

    public String getScoresJson() {
        return scoresJson;
    }

    public void setScoresJson(String scoresJson) {
        this.scoresJson = scoresJson;
    }

    public String getFeedbackJson() {
        return feedbackJson;
    }

    public void setFeedbackJson(String feedbackJson) {
        this.feedbackJson = feedbackJson;
    }

    public LocalDateTime getEvaluationTime() {
        return evaluationTime;
    }

    // 헬퍼 메서드들
    public BigDecimal getTotalHabitatVolume() {
        if (habitatX == null || habitatY == null || habitatZ == null) {
            return BigDecimal.ZERO;
        }
        return habitatX.multiply(habitatY).multiply(habitatZ);
    }

    public double getTotalHabitatVolumeAsDouble() {
        return getTotalHabitatVolume().doubleValue();
    }
}
