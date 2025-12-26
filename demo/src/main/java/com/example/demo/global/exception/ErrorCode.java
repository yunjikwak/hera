package com.example.demo.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 계산/평가 관련 에러
    CALCULATION_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "CALCULATION_ERROR", "계산 중 오류가 발생했습니다."),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "검증 중 오류가 발생했습니다."),

    // 리소스 관련 에러
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "NOT_FOUND", "요청한 리소스를 찾을 수 없습니다."),
    NO_MODULES(HttpStatus.NOT_FOUND, "NO_MODULES", "로드된 모듈이 없습니다."),
    INVALID_ID(HttpStatus.BAD_REQUEST, "INVALID_ID", "올바른 ID를 입력해주세요."),

    // 서버 공통 에러
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "서버 내부 오류가 발생했습니다."),
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "잘못된 요청입니다."),

    // RAG 서비스 관련 에러
    RAG_SERVICE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "RAG_SERVICE_ERROR", "RAG 서비스 처리 중 오류가 발생했습니다."),

    LLM_SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "RAG_UNAVAILABLE", "LLM 서비스가 응답하지 않습니다."),

    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "잘못된 요청입니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}