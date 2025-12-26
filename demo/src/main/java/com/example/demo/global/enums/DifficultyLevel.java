package com.example.demo.global.enums;

/**
 * 모듈의 난이도 레벨을 나타내는 열거형
 * 초급, 중급, 고급으로 분류하여 사용자에게 차등 정보 제공
 */
public enum DifficultyLevel {
    초급("초급", "Basic level - Full module information including tags"),
    중급("중급", "Intermediate level - Module information without tags"),
    고급("고급", "Advanced level - Essential module information only");

    private final String displayName;
    private final String description;

    DifficultyLevel(String displayName, String description) {
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
