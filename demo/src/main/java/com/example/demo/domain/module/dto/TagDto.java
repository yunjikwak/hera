package com.example.demo.domain.module.dto;

import com.example.demo.domain.module.entity.ModuleTag;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TagDto {

    private String tagName;
    private String tagValue;
    private String tagCategory;

    public static TagDto from(ModuleTag moduleTag) {
        if (moduleTag == null) {
            return null;
        }
        return new TagDto(
                moduleTag.getTagName(),
                moduleTag.getTagValue(),
                moduleTag.getCategory() != null ? moduleTag.getCategory().name() : null);
    }
}
