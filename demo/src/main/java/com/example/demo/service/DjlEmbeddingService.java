package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
@Primary
@RequiredArgsConstructor
public class DjlEmbeddingService implements EmbeddingService {

    private static final Logger logger = LoggerFactory.getLogger(DjlEmbeddingService.class);

    @Value("${rag.embedding.provider:djl}")
    private String embeddingProvider;

    private final OllamaEmbeddingService ollamaEmbeddingService;

    private EmbeddingService actualEmbeddingService;

    @PostConstruct
    public void initialize() {
        try {
            logger.info("Initializing embedding service with provider: {}", embeddingProvider);

            if ("ollama".equals(embeddingProvider) && ollamaEmbeddingService != null) {
                if (ollamaEmbeddingService.isAvailable()) {
                    actualEmbeddingService = ollamaEmbeddingService;
                    logger.info("Using Ollama embedding service (nomic-embed-text)");
                } else {
                    logger.warn("Ollama embedding service not available, falling back to mock implementation");
                    actualEmbeddingService = new MockEmbeddingService();
                }
            } else {
                logger.warn("Using mock embedding service as fallback");
                actualEmbeddingService = new MockEmbeddingService();
            }

        } catch (Exception e) {
            logger.error("Failed to initialize embedding service", e);
            actualEmbeddingService = new MockEmbeddingService();
        }
    }

    @Override
    public float[] generateEmbedding(String text) {
        return actualEmbeddingService.generateEmbedding(text);
    }

    @Override
    public int getEmbeddingDimension() {
        return actualEmbeddingService.getEmbeddingDimension();
    }

    // Fallback mock implementation
    private static class MockEmbeddingService implements EmbeddingService {
        @Override
        public float[] generateEmbedding(String text) {
            if (text == null || text.trim().isEmpty()) {
                return new float[768]; // nomic-embed-text dimension
            }

            // Generate a deterministic mock embedding based on text content
            float[] embedding = new float[768];

            // Simple hash-based approach for consistent mock embeddings
            int hash = text.hashCode();
            for (int i = 0; i < embedding.length; i++) {
                // Generate pseudo-random values based on text hash and position
                float value = (float) Math.sin(hash * (i + 1) * 0.1) * 0.5f;
                embedding[i] = Math.max(-1.0f, Math.min(1.0f, value));
            }

            // Normalize the vector
            float norm = 0.0f;
            for (float v : embedding) {
                norm += v * v;
            }
            norm = (float) Math.sqrt(norm);

            if (norm > 0) {
                for (int i = 0; i < embedding.length; i++) {
                    embedding[i] /= norm;
                }
            }

            return embedding;
        }

        @Override
        public int getEmbeddingDimension() {
            return 768; // nomic-embed-text dimension
        }
    }
}
