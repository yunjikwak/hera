package com.example.demo.domain.module.dto;

import com.example.demo.domain.evaluation.dto.HabitatDimensions;
import com.example.demo.domain.module.dto.ModulePlacement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * 모듈 배치 검증 요청 DTO
 */
public class ModulePlacementValidationRequest {

    @NotNull(message = "거주지 크기는 필수입니다")
    @Valid
    private HabitatDimensions habitatDimensions;

    @NotNull(message = "새로운 모듈 정보는 필수입니다")
    @NotNull
    @Valid
    private ModulePlacement newModule;

    private List<@Valid ModulePlacement> existingModules;

    // 기본 생성자
    public ModulePlacementValidationRequest() {
    }

    // 편의 생성자
    public ModulePlacementValidationRequest(HabitatDimensions habitatDimensions,
            ModulePlacement newModule,
            List<ModulePlacement> existingModules) {
        this.habitatDimensions = habitatDimensions;
        this.newModule = newModule;
        this.existingModules = existingModules;
    }

    // Getter/Setter 메서드들
    public HabitatDimensions getHabitatDimensions() {
        return habitatDimensions;
    }

    public void setHabitatDimensions(HabitatDimensions habitatDimensions) {
        this.habitatDimensions = habitatDimensions;
    }

    public ModulePlacement getNewModule() {
        return newModule;
    }

    public void setNewModule(ModulePlacement newModule) {
        this.newModule = newModule;
    }

    public List<ModulePlacement> getExistingModules() {
        return existingModules;
    }

    public void setExistingModules(List<ModulePlacement> existingModules) {
        this.existingModules = existingModules;
    }

    @Override
    public String toString() {
        return String.format("ModulePlacementValidationRequest{dimensions=%s, newModule=%s, existingCount=%d}",
                habitatDimensions, newModule,
                existingModules != null ? existingModules.size() : 0);
    }
}
