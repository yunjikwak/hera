package com.example.demo.domain.rag.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "doc_chunks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_path", nullable = false, length = 500)
    private String sourcePath;

    @Column(name = "page_no", nullable = false)
    private Integer pageNo;

    @Column(name = "chunk_index", nullable = false)
    private Integer chunkIndex;

    @Column(name = "text", columnDefinition = "CLOB")
    private String text;

    @Column(name = "embedding", columnDefinition = "CLOB")
    private String embeddingJson; // JSON array of floats

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Helper method to get embedding as float array
    public float[] getEmbeddingAsArray() {
        if (embeddingJson == null || embeddingJson.trim().isEmpty()) {
            return new float[0];
        }
        try {
            // Simple JSON array parsing for float values
            String cleanJson = embeddingJson.trim().replaceAll("[\\[\\]]", "");
            String[] parts = cleanJson.split(",");
            float[] result = new float[parts.length];
            for (int i = 0; i < parts.length; i++) {
                result[i] = Float.parseFloat(parts[i].trim());
            }
            return result;
        } catch (Exception e) {
            return new float[0];
        }
    }

    // Helper method to set embedding from float array
    public void setEmbeddingFromArray(float[] embedding) {
        if (embedding == null || embedding.length == 0) {
            this.embeddingJson = "[]";
            return;
        }
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < embedding.length; i++) {
            if (i > 0)
                sb.append(",");
            sb.append(embedding[i]);
        }
        sb.append("]");
        this.embeddingJson = sb.toString();
    }
}
