package com.example.demo.controller;

import com.example.demo.controller.dto.ApiResponse;
import com.example.demo.controller.dto.ModuleResponseDto;
import com.example.demo.service.ModuleService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 모듈 관련 REST API 컨트롤러
@RestController
@RequestMapping("/api/v1/modules")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class ModuleController {
    private final ModuleService moduleService;
    private static final Logger logger = LoggerFactory.getLogger(ModuleController.class);

    // 모든 모듈 조회
    @GetMapping
    public ResponseEntity<ApiResponse<List<ModuleResponseDto>>> getAllModules() {
        List<ModuleResponseDto> modules = moduleService.findAllModules();
        if (modules.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error("NO_MODULES", "로드된 모듈이 없습니다."));
        }

        return ResponseEntity.ok(ApiResponse.success(modules));
    }

    // 특정 모듈 조회
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ModuleResponseDto>> getModule(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("INVALID_ID", "올바른 모듈 ID를 입력해주세요."));
            }

            ModuleResponseDto module = moduleService.findModuleById(id);
            return ResponseEntity.ok(ApiResponse.success(module));
        } catch (RuntimeException e) {
            logger.warn("모듈 조회 실패 - ID: {}, 오류: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("모듈 조회 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("INTERNAL_ERROR", "서버 내부 오류가 발생했습니다."));
        }
    }

}
