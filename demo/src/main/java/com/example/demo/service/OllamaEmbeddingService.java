package com.example.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.HashMap;
import java.util.Map;

@Service
public class OllamaEmbeddingService implements EmbeddingService {

    private static final Logger logger = LoggerFactory.getLogger(OllamaEmbeddingService.class);

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${llm.ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    @Value("${rag.embedding.model:nomic-embed-text}")
    private String embeddingModel;

    public OllamaEmbeddingService() {
        this.webClient = WebClient.builder().build();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public float[] generateEmbedding(String text) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", embeddingModel);
            requestBody.put("prompt", text);

            String response = webClient.post()
                    .uri(ollamaUrl + "/api/embeddings")
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response == null) {
                logger.error("Received null response from Ollama embedding API");
                return new float[768];
            }

            JsonNode root = objectMapper.readTree(response);
            // logger.debug("Ollama embedding API response: {}", response);

            // Ollama embedding API 응답 형식 확인
            JsonNode embeddingNode = null;
            if (root.has("embedding")) {
                // 직접 embedding 필드가 있는 경우
                embeddingNode = root.path("embedding");
            } else if (root.has("data") && root.path("data").isArray() && root.path("data").size() > 0) {
                // data 배열 안에 embedding이 있는 경우
                embeddingNode = root.path("data").get(0).path("embedding");
            }

            if (embeddingNode != null && embeddingNode.isArray() && embeddingNode.size() > 0) {
                float[] result = new float[embeddingNode.size()];

                for (int i = 0; i < embeddingNode.size(); i++) {
                    result[i] = (float) embeddingNode.get(i).asDouble();
                }

                // logger.debug("Successfully generated embedding with {} dimensions",
                // result.length);
                // logger.debug("First 5 embedding values: [{}, {}, {}, {}, {}]",
                // result[0], result[1], result[2], result[3], result[4]);
                return result;
            } else {
                logger.error("Invalid response format from Ollama embedding API. Response: {}", response);
                return new float[768];
            }

        } catch (Exception e) {
            logger.error("Failed to generate embedding for text: {}", text.substring(0, Math.min(100, text.length())),
                    e);
            return new float[768]; // Return zero vector on error
        }
    }

    @Override
    public int getEmbeddingDimension() {
        return 768; // nomic-embed-text dimension
    }

    public boolean isAvailable() {
        try {
            String response = webClient.get()
                    .uri(ollamaUrl + "/api/tags")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            return response != null && response.contains(embeddingModel);
        } catch (WebClientResponseException e) {
            logger.warn("Ollama service not available: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            logger.warn("Failed to check Ollama availability: {}", e.getMessage());
            return false;
        }
    }
}