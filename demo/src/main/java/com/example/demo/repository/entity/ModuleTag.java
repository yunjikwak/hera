package com.example.demo.repository.entity;

import com.example.demo.enums.TagCategory;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 모듈 태그 엔티티
 * 각 모듈의 특성을 태그로 표현하여 평가 시스템에서 활용
 */
@Entity
@Table(name = "module_tags", uniqueConstraints = @UniqueConstraint(columnNames = { "module_id", "tag_name",
        "tag_value" }))
public class ModuleTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    @Column(name = "tag_name", nullable = false, length = 50)
    private String tagName;

    @Column(name = "tag_value", length = 50)
    private String tagValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private TagCategory category;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // 기본 생성자
    public ModuleTag() {
    }

    // 편의 생성자
    public ModuleTag(Module module, String tagName, TagCategory category) {
        this.module = module;
        this.tagName = tagName;
        this.category = category;
    }

    public ModuleTag(Module module, String tagName, String tagValue, TagCategory category) {
        this.module = module;
        this.tagName = tagName;
        this.tagValue = tagValue;
        this.category = category;
    }

    // Getter/Setter 메서드들
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Module getModule() {
        return module;
    }

    public void setModule(Module module) {
        this.module = module;
    }

    public String getTagName() {
        return tagName;
    }

    public void setTagName(String tagName) {
        this.tagName = tagName;
    }

    public String getTagValue() {
        return tagValue;
    }

    public void setTagValue(String tagValue) {
        this.tagValue = tagValue;
    }

    public TagCategory getCategory() {
        return category;
    }

    public void setCategory(TagCategory category) {
        this.category = category;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // 헬퍼 메서드들
    public String getFullTagName() {
        if (tagValue != null && !tagValue.trim().isEmpty()) {
            return tagName + "(" + tagValue + ")";
        }
        return tagName;
    }

    @Override
    public String toString() {
        return String.format("ModuleTag{id=%d, tagName='%s', tagValue='%s', category=%s}",
                id, tagName, tagValue, category);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof ModuleTag))
            return false;

        ModuleTag moduleTag = (ModuleTag) o;

        if (tagName != null ? !tagName.equals(moduleTag.tagName) : moduleTag.tagName != null)
            return false;
        if (tagValue != null ? !tagValue.equals(moduleTag.tagValue) : moduleTag.tagValue != null)
            return false;
        return category == moduleTag.category;
    }

    @Override
    public int hashCode() {
        int result = tagName != null ? tagName.hashCode() : 0;
        result = 31 * result + (tagValue != null ? tagValue.hashCode() : 0);
        result = 31 * result + (category != null ? category.hashCode() : 0);
        return result;
    }
}
