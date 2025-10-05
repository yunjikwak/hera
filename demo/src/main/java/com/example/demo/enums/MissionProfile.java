package com.example.demo.enums;

// /**
// * 미션 프로필 열거형
// * 각 미션별로 가중치 설정을 관리
// */
// public enum MissionProfile {
// COMFORT("comfort", "쾌적성 최우선", "장기 탐사선 - 승무원의 정신 건강과 삶의 질 극대화"),
// EFFICIENCY("efficiency", "효율성 최우선", "단기 기지 - 최소 질량으로 최대의 임무 성과 달성"),
// BALANCED("balanced", "밸런스형", "표준 모듈 - 모든 요소를 균형 있게 고려한 표준 설계");

// private final String id;
// private final String displayName;
// private final String description;

// MissionProfile(String id, String displayName, String description) {
// this.id = id;
// this.displayName = displayName;
// this.description = description;
// }

// public String getId() {
// return id;
// }

// public String getDisplayName() {
// return displayName;
// }

// public String getDescription() {
// return description;
// }

// /**
// * 각 미션 프로필의 가중치를 반환
// */
// public java.util.Map<String, Double> getWeights() {
// switch (this) {
// case COMFORT:
// return java.util.Map.of(
// "spaceUtilization", 0.3,
// "comfortability", 0.5,
// "efficiency", 0.2
// );
// case EFFICIENCY:
// return java.util.Map.of(
// "spaceUtilization", 0.3,
// "comfortability", 0.2,
// "efficiency", 0.5
// );
// case BALANCED:
// default:
// return java.util.Map.of(
// "spaceUtilization", 0.33,
// "comfortability", 0.33,
// "efficiency", 0.34
// );
// }
// }

// /**
// * 문자열 ID로 미션 프로필을 찾는 헬퍼 메서드
// */
// public static MissionProfile fromId(String id) {
// for (MissionProfile profile : values()) {
// if (profile.id.equals(id)) {
// return profile;
// }
// }
// throw new IllegalArgumentException("Unknown mission profile ID: " + id);
// }
// }
