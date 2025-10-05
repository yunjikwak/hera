package com.example.demo.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RagQueryRequest {
    private String question;
    private Integer topK = 5;
    private String mission; // "MARS" or "LUNAR"
}
