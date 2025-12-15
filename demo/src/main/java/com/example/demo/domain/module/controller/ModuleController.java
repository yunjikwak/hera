package com.example.demo.domain.module.controller;

import com.example.demo.global.dto.ApiResponse;
import com.example.demo.domain.module.dto.ModuleResponseDto;
import com.example.demo.domain.module.service.ModuleService;

import lombok.RequiredArgsConstructor;
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

    // 모든 모듈 조회
    @GetMapping
    public ResponseEntity<ApiResponse<List<ModuleResponseDto>>> getAllModules() {
        List<ModuleResponseDto> modules = moduleService.findAllModules();
        return ResponseEntity.ok(ApiResponse.success(modules));
    }

    // 특정 모듈 조회
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ModuleResponseDto>> getModule(@PathVariable Long id) {
        ModuleResponseDto module = moduleService.findModuleById(id);
        return ResponseEntity.ok(ApiResponse.success(module));
    }

}
