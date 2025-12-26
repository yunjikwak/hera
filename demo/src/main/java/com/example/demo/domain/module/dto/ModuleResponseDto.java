package com.example.demo.domain.module.dto;

import com.example.demo.domain.module.entity.Module;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

// 모듈 응답 DTO
@Getter
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ModuleResponseDto {

    private Long id;
    private String name;
    private String displayName;
    private BigDecimal volume;
    private List<String> functions;
    private List<TagDto> tags;

    public static ModuleResponseDto from(Module module) {
        return new ModuleResponseDto(
                module.getId(),
                module.getName(),
                module.getDisplayName(),
                module.getVolume(),
                module.getFunctions(),
                module.getTags() != null ? module.getTags().stream()
                        .map(TagDto::from)
                        .collect(Collectors.toList()) : null);
    }
}
