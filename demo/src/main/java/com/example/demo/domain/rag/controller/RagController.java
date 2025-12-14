package com.example.demo.domain.rag.controller;

import com.example.demo.domain.rag.dto.RagAnswer;
import com.example.demo.domain.rag.dto.RagQueryRequest;
import com.example.demo.domain.rag.service.RagQueryService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/rag")
@CrossOrigin(origins = "*")
public class RagController {

    private static final Logger logger = LoggerFactory.getLogger(RagController.class);

    @Autowired
    private RagQueryService ragQueryService;

    @PostMapping("/ask")
    public ResponseEntity<RagAnswer> askQuestion(@RequestBody RagQueryRequest request) {
        try {
            logger.info("Received RAG query: {}", request.getQuestion());

            if (request.getQuestion() == null || request.getQuestion().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        new RagAnswer("Question cannot be empty", null, null));
            }

            RagAnswer answer = ragQueryService.query(request);
            return ResponseEntity.ok(answer);

        } catch (Exception e) {
            logger.error("Error processing RAG query", e);
            return ResponseEntity.internalServerError().body(
                    new RagAnswer("An error occurred while processing your question: " + e.getMessage(),
                            null, null));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("RAG service is running");
    }
}