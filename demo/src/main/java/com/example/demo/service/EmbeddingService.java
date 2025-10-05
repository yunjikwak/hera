package com.example.demo.service;

public interface EmbeddingService {

    /**
     * Generate embedding vector for the given text
     *
     * @param text Input text to embed
     * @return Embedding vector as float array
     */
    float[] generateEmbedding(String text);

    /**
     * Get the dimension of embeddings produced by this service
     *
     * @return Embedding dimension
     */
    int getEmbeddingDimension();
}