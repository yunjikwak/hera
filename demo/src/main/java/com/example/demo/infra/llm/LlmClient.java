package com.example.demo.infra.llm;

public interface LlmClient {

    /**
     * Generate a response using the LLM
     *
     * @param prompt The input prompt
     * @return Generated response text
     */
    String generateResponse(String prompt);

    /**
     * Check if the LLM service is available
     *
     * @return true if available, false otherwise
     */
    boolean isAvailable();
}