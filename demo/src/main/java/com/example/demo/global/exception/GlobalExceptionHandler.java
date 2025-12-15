package com.example.demo.global.exception;

import com.example.demo.global.dto.ApiResponse;

import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
        // BusinessException
        @ExceptionHandler(BusinessException.class)
        public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException e) {
                ErrorCode errorCode = e.getErrorCode();
                log.warn("Business Exception: code={}, message={}", errorCode.getCode(), e.getMessage());

                return ResponseEntity.status(errorCode.getStatus())
                                .body(ApiResponse.error(errorCode.getCode(), e.getMessage()));
        }

        // @Valid 검증 실패 처리
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
                        MethodArgumentNotValidException e) {
                log.warn("Validation Failed: {}", e.getMessage());

                Map<String, String> errors = new HashMap<>();
                e.getBindingResult().getAllErrors().forEach(error -> {
                        String fieldName = ((FieldError) error).getField();
                        String errorMessage = error.getDefaultMessage();
                        errors.put(fieldName, errorMessage);
                });

                String errorMessage = errors.values().stream().collect(Collectors.joining(", "));

                ApiResponse<Map<String, String>> response = ApiResponse.error(
                                ErrorCode.VALIDATION_ERROR.getCode(),
                                "입력값 검증에 실패했습니다: " + errorMessage,
                                errors);

                return ResponseEntity
                                .status(ErrorCode.VALIDATION_ERROR.getStatus())
                                .body(response);
        }

        // JSON 파싱 오류 처리
        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadableException(
                        HttpMessageNotReadableException e) {
                log.warn("JSON Parse Error: {}", e.getMessage());
                return ResponseEntity
                                .status(ErrorCode.BAD_REQUEST.getStatus())
                                .body(ApiResponse.error(ErrorCode.BAD_REQUEST.getCode(),
                                                "요청 본문을 파싱할 수 없습니다. JSON 형식을 확인해주세요."));
        }

        // 잘못된 인자 처리
        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(
                        IllegalArgumentException e) {
                log.warn("Invalid Argument: {}", e.getMessage());

                return ResponseEntity.status(ErrorCode.BAD_REQUEST.getStatus())
                                .body(ApiResponse.error(ErrorCode.BAD_REQUEST.getCode(), e.getMessage()));
        }

        // 기타 모든 예외 처리 (Fallback)
        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
                log.error("Unexpected Exception: {}", e.getMessage());

                return ResponseEntity.status(ErrorCode.INTERNAL_SERVER_ERROR.getStatus())
                                .body(ApiResponse.error(ErrorCode.INTERNAL_SERVER_ERROR.getCode(),
                                                "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
        }
}
