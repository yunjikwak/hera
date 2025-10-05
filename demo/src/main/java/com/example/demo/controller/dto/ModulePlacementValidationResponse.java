package com.example.demo.controller.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.List;

// 모듈 배치 검증 응답 DTO
@Getter
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ModulePlacementValidationResponse {

    public ModulePlacementValidationResponse() {
    }

    private boolean valid;
    private List<String> conflicts;
    private List<String> warnings;

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public void setConflicts(List<String> conflicts) {
        this.conflicts = conflicts;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings;
    }

    public boolean hasConflicts() {
        return conflicts != null && !conflicts.isEmpty();
    }

    public boolean hasWarnings() {
        return warnings != null && !warnings.isEmpty();
    }

    public void addConflict(String conflict) {
        if (this.conflicts == null) {
            this.conflicts = new java.util.ArrayList<>();
        }
        this.conflicts.add(conflict);
    }

    public void addWarning(String warning) {
        if (this.warnings == null) {
            this.warnings = new java.util.ArrayList<>();
        }
        this.warnings.add(warning);
    }

    @Override
    public String toString() {
        return String.format("ModulePlacementValidationResponse{valid=%s, conflicts=%s, warnings=%s}",
                valid, conflicts, warnings);
    }
}
