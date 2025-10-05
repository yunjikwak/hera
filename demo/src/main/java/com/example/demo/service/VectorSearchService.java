package com.example.demo.service;

import com.example.demo.controller.dto.DocChunk;
import com.example.demo.repository.DocChunkRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VectorSearchService {

    private static final Logger logger = LoggerFactory.getLogger(VectorSearchService.class);

    private final DocChunkRepository docChunkRepository;

    // EmbeddingService not used in this implementation - embeddings are
    // pre-computed
    // @Autowired
    // private EmbeddingService embeddingService;

    // In-memory index for fast similarity search
    private final Map<Long, float[]> embeddingIndex = new ConcurrentHashMap<>();

    @PostConstruct
    public void loadEmbeddings() {
        logger.info("Loading embeddings into memory index...");

        List<DocChunk> chunksWithEmbeddings = docChunkRepository.findAllWithEmbeddings();

        for (DocChunk chunk : chunksWithEmbeddings) {
            float[] embedding = chunk.getEmbeddingAsArray();
            if (embedding.length > 0) {
                embeddingIndex.put(chunk.getId(), embedding);
            }
        }

        logger.info("Loaded {} embeddings into memory index", embeddingIndex.size());
    }

    public void addEmbedding(Long chunkId, float[] embedding) {
        embeddingIndex.put(chunkId, embedding);
    }

    public List<SearchResult> searchSimilar(float[] queryEmbedding, int topK) {
        if (embeddingIndex.isEmpty()) {
            logger.warn("No embeddings available for search");
            return Collections.emptyList();
        }

        List<SearchResult> results = new ArrayList<>();

        for (Map.Entry<Long, float[]> entry : embeddingIndex.entrySet()) {
            Long chunkId = entry.getKey();
            float[] chunkEmbedding = entry.getValue();

            if (chunkEmbedding.length != queryEmbedding.length) {
                continue; // Skip mismatched dimensions
            }

            double similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
            results.add(new SearchResult(chunkId, similarity));
        }

        // Sort by similarity (descending) and return top K
        return results.stream()
                .sorted((a, b) -> Double.compare(b.similarity, a.similarity))
                .limit(topK)
                .collect(Collectors.toList());
    }

    private double cosineSimilarity(float[] a, float[] b) {
        if (a.length != b.length) {
            logger.warn("Embedding dimension mismatch: {} vs {}", a.length, b.length);
            return 0.0;
        }

        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    public static class SearchResult {
        public final Long chunkId;
        public final double similarity;

        public SearchResult(Long chunkId, double similarity) {
            this.chunkId = chunkId;
            this.similarity = similarity;
        }

        public Long getChunkId() {
            return chunkId;
        }

        public double getSimilarity() {
            return similarity;
        }
    }
}
