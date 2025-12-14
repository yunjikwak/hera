package com.example.demo.infra.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class OllamaClient implements LlmClient {

    private static final Logger logger = LoggerFactory.getLogger(OllamaClient.class);

    @Value("${llm.ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    @Value("${llm.ollama.model:llama3}")
    private String modelName;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public OllamaClient() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public String generateResponse(String prompt) {
        try {
            String url = ollamaUrl + "/api/generate";

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", modelName);
            requestBody.put("prompt", prompt);
            requestBody.put("stream", false);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                String generatedText = jsonResponse.get("response").asText();
                logger.debug("Generated response from Ollama: {}",
                        generatedText.substring(0, Math.min(100, generatedText.length())));
                return generatedText;
            } else {
                logger.error("Ollama API returned status: {}", response.getStatusCode());
                return "Error: Unable to generate response";
            }

        } catch (Exception e) {
            logger.error("Failed to generate response from Ollama", e);
            return "Error: " + e.getMessage();
        }
    }

    @Override
    public boolean isAvailable() {
        try {
            String url = ollamaUrl + "/api/tags";
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            logger.debug("Ollama service not available: {}", e.getMessage());
            return false;
        }
    }
}