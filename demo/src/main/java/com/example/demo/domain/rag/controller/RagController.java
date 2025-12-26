package com.example.demo.domain.rag.controller;

import com.example.demo.domain.rag.dto.RagAnswer;
import com.example.demo.domain.rag.dto.RagQueryRequest;
import com.example.demo.domain.rag.service.RagQueryService;
import com.example.demo.global.dto.ApiResponse;
import com.example.demo.global.exception.BusinessException;
import com.example.demo.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/rag")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class RagController {

    private final RagQueryService ragQueryService;

    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<RagAnswer>> askQuestion(@RequestBody RagQueryRequest request) {
        if (request.getQuestion() == null || request.getQuestion().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "질문 내용은 필수입니다.");
        }

        RagAnswer answer = ragQueryService.query(request);
        return ResponseEntity.ok(ApiResponse.success(answer));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("RAG service is running"));
    }
}