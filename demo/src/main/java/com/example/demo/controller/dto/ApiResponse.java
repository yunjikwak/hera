package com.example.demo.controller.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * API 통일 응답 형식 DTO
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private String message;
    private ErrorInfo error;

    // 중첩 클래스: 에러 정보
    public static class ErrorInfo {
        private String code;
        private String message;
        private Object details;

        // 기본 생성자
        public ErrorInfo() {
        }

        // 편의 생성자
        public ErrorInfo(String code, String message) {
            this.code = code;
            this.message = message;
        }

        public ErrorInfo(String code, String message, Object details) {
            this.code = code;
            this.message = message;
            this.details = details;
        }

        // Getter/Setter 메서드들
        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public Object getDetails() {
            return details;
        }

        public void setDetails(Object details) {
            this.details = details;
        }
    }

    // 기본 생성자
    public ApiResponse() {
    }

    // 편의 생성자들
    public ApiResponse(boolean success, T data, String message) {
        this.success = success;
        this.data = data;
        this.message = message;
    }

    public ApiResponse(boolean success, String message, ErrorInfo error) {
        this.success = success;
        this.message = message;
        this.error = error;
    }

    // 정적 팩토리 메서드들
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, "요청이 성공적으로 처리되었습니다.");
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, data, message);
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(false, message, new ErrorInfo(code, message));
    }

    public static <T> ApiResponse<T> error(String code, String message, Object details) {
        return new ApiResponse<>(false, message, new ErrorInfo(code, message, details));
    }

    // 에러 헬퍼 메서드 (다른 이름으로 중복 방지)
    public static <T> ApiResponse<T> errorResponse(String code, String message) {
        return new ApiResponse<>(false, message, new ErrorInfo(code, message));
    }

    // Getter/Setter 메서드들
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public ErrorInfo getError() {
        return error;
    }

    public void setError(ErrorInfo error) {
        this.error = error;
    }

    // 헬퍼 메서드들
    public boolean hasData() {
        return data != null;
    }

    public boolean hasError() {
        return error != null;
    }

    @Override
    public String toString() {
        return String.format("ApiResponse{success=%s, data=%s, message='%s', error=%s}",
                success, data, message, error);
    }
}
