package com.example.demo.controller.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

// 배치 평가 요청 DTO
@Getter
@AllArgsConstructor
public class LayoutEvaluationRequest {

    public LayoutEvaluationRequest() {
    }

    @NotNull(message = "거주지 크기는 필수입니다")
    @Valid
    private HabitatDimensions habitatDimensions;

    @NotEmpty(message = "모듈 배치 정보는 필수입니다")
    @Size(max = 18, message = "최대 18개 모듈만 배치할 수 있습니다")
    private List<@Valid ModulePlacement> modulePlacements;

    private String missionProfile;

    public void setHabitatDimensions(HabitatDimensions habitatDimensions) {
        this.habitatDimensions = habitatDimensions;
    }

    public void setModulePlacements(List<ModulePlacement> modulePlacements) {
        this.modulePlacements = modulePlacements;
    }

    public void setMissionProfile(String missionProfile) {
        this.missionProfile = missionProfile;
    }

    public int getModuleCount() {
        return modulePlacements != null ? modulePlacements.size() : 0;
    }

    public double getTotalHabitatVolume() {
        return habitatDimensions != null ? habitatDimensions.getTotalVolumeAsDouble() : 0.0;
    }

    @Override
    public String toString() {
        return String.format("LayoutEvaluationRequest{dimensions=%s, moduleCount=%d}",
                habitatDimensions, getModuleCount());
    }
}
