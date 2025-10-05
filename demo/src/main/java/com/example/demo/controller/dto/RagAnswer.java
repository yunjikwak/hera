package com.example.demo.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RagAnswer {
    private String answer;
    private List<Source> sources;
    private List<Chunk> chunks;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Source {
        private String sourcePath;
        private Integer pageNo;
        private String preview; // First 200 chars of text
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Chunk {
        private Long id;
        private String text;
        private String sourcePath;
        private Integer pageNo;
        private Double similarity; // Cosine similarity score
    }
}
