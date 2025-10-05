package com.example.demo.repository.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.*;

/**
 * 우주 거주지 모듈 엔티티
 * 18가지 필수 모듈 정보를 저장
 */
@Entity
@Getter
@Table(name = "modules")
@AllArgsConstructor
@NoArgsConstructor
public class Module {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "display_name", nullable = false, length = 200)
    private String displayName;

    @Column(name = "volume", nullable = false, precision = 10, scale = 2)
    private BigDecimal volume;

    @Column(name = "nhv", nullable = false, precision = 10, scale = 2)
    private BigDecimal nhv;

    @Column(name = "functions_json", nullable = false, columnDefinition = "TEXT")
    @JsonIgnore
    private String functionsJson;

    @Column(name = "design_guide", columnDefinition = "TEXT")
    private String designGuide;

    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<ModuleTag> tags = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @JsonProperty("functions")
    @Transient
    public List<String> getFunctions() {
        try {
            if (functionsJson == null || functionsJson.trim().isEmpty()) {
                return new ArrayList<>();
            }
            return new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(functionsJson,
                            new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {
                            });
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    @JsonProperty("functions")
    @Transient
    public void setFunctions(List<String> functions) {
        try {
            this.functionsJson = new com.fasterxml.jackson.databind.ObjectMapper()
                    .writeValueAsString(functions);
        } catch (Exception e) {
            this.functionsJson = "[]";
        }
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public void setVolume(BigDecimal volume) {
        this.volume = volume;
    }

    public BigDecimal getNhv() {
        return nhv;
    }

    public void setNhv(BigDecimal nhv) {
        this.nhv = nhv;
    }

    public void setDesignGuide(String designGuide) {
        this.designGuide = designGuide;
    }

    public void setTags(List<ModuleTag> tags) {
        this.tags = tags;
    }

    public boolean hasTag(String tagName) {
        return tags.stream()
                .anyMatch(tag -> tag.getTagName().equals(tagName));
    }

    public boolean hasTagWithValue(String tagName, String tagValue) {
        return tags.stream()
                .anyMatch(tag -> tag.getTagName().equals(tagName) &&
                        tag.getTagValue() != null &&
                        tag.getTagValue().equals(tagValue));
    }

    public double getVolumeAsDouble() {
        return volume != null ? volume.doubleValue() : 0.0;
    }
}
