package com.example.demo.enums;

/**
 * 모듈 태그의 카테고리를 나타내는 열거형
 * 평가 시스템에서 사용되는 태그들을 체계적으로 분류
 */
public enum TagCategory {
    USAGE("사용성", "Usage of the space (개인공간, 공용공간)"),
    IMPACT("영향", "Impact on environment (소음유발가능, 소음유발불가능)"),
    PRIVACY("사생활", "Privacy requirements (정숙필요, 정숙불필요)"),
    CLEANLINESS("청결", "Cleanliness designation (청결구역, 오염구역)"),
    RESOURCE("자원", "Resource consumption (자원소모(물), 자원소모(전력))"),
    FUNCTION("기능", "Functional characteristics (휴식공간, 작업공간)"),
    PERCEPTION("인적요소", "Human factors (개방감중요, 프라이버시중요)"),
    BENEFIT("효과", "Benefits provided (건강유지, 코칭기능)");

    private final String displayName;
    private final String description;

    TagCategory(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }
}

