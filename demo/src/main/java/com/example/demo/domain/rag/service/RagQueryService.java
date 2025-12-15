package com.example.demo.domain.rag.service;

import com.example.demo.domain.rag.entity.DocChunk;
import com.example.demo.domain.rag.dto.RagAnswer;
import com.example.demo.domain.rag.dto.RagQueryRequest;
import com.example.demo.domain.rag.repository.DocChunkRepository;
import com.example.demo.domain.rag.service.VectorSearchService.SearchResult;
import com.example.demo.global.exception.BusinessException;
import com.example.demo.global.exception.ErrorCode;
import com.example.demo.infra.embedding.EmbeddingService;
import com.example.demo.infra.llm.LlmClient;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RagQueryService {

        private static final Logger logger = LoggerFactory.getLogger(RagQueryService.class);

        private final EmbeddingService embeddingService;
        private final VectorSearchService vectorSearchService;
        private final LlmClient llmClient;
        private final DocChunkRepository docChunkRepository;

        @Transactional(readOnly = true)
        public RagAnswer query(RagQueryRequest request) {
                if (!llmClient.isAvailable()) {
                        throw new BusinessException(ErrorCode.LLM_SERVICE_UNAVAILABLE);
                }

                try {
                        // 질문 임베딩 생성
                        float[] queryEmbedding = embeddingService.generateEmbedding(request.getQuestion());

                        // 벡터 검색 수행
                        List<SearchResult> searchResults = vectorSearchService.searchSimilar(
                                        queryEmbedding, request.getTopK());
                        logger.info("Found {} similar chunks", searchResults.size());

                        if (searchResults.isEmpty()) {
                                logger.warn("No similar chunks found for query");
                                return new RagAnswer("No relevant information found in the knowledge base.",
                                                new ArrayList<>(), new ArrayList<>());
                        }

                        // 청크 상세 정보 조회 및 컨텍스트 빌드
                        List<RagAnswer.Chunk> chunks = new ArrayList<>();
                        List<RagAnswer.Source> sources = new ArrayList<>();
                        StringBuilder contextBuilder = new StringBuilder();

                        for (SearchResult result : searchResults) {
                                Optional<DocChunk> chunkOpt = docChunkRepository.findById(result.getChunkId());
                                if (chunkOpt.isPresent()) {
                                        DocChunk chunk = chunkOpt.get();

                                        // 청크 리스트에 추가
                                        chunks.add(new RagAnswer.Chunk(
                                                        chunk.getId(),
                                                        chunk.getText(),
                                                        chunk.getSourcePath(),
                                                        chunk.getPageNo(),
                                                        result.getSimilarity()));

                                        // 소스 리스트에 추가 (중복 방지)
                                        String sourceKey = chunk.getSourcePath() + ":" + chunk.getPageNo();
                                        boolean isDuplicate = sources.stream().anyMatch(
                                                        s -> (s.getSourcePath() + ":" + s.getPageNo())
                                                                        .equals(sourceKey));
                                        if (!isDuplicate) {
                                                String preview = chunk.getText().length() > 200
                                                                ? chunk.getText().substring(0, 200) + "..."
                                                                : chunk.getText();
                                                sources.add(new RagAnswer.Source(
                                                                chunk.getSourcePath(),
                                                                chunk.getPageNo(),
                                                                preview));
                                        }

                                        // 프롬프트용 컨텍스트 빌드
                                        contextBuilder.append("Source: ").append(chunk.getSourcePath())
                                                        .append(" (Page ").append(chunk.getPageNo()).append(")\n");
                                        contextBuilder.append("Content: ").append(chunk.getText()).append("\n\n");
                                }
                        }

                        // LLM 프롬프트 생성 및 요청
                        String context = contextBuilder.toString();
                        String prompt = buildPrompt(request.getQuestion(), context, request.getMission());

                        String answer = llmClient.generateResponse(prompt);
                        logger.info("LLM response generated (length: {} chars)", answer.length());

                        return new RagAnswer(answer, sources, chunks);
                } catch (BusinessException e) {
                        throw e;
                } catch (Exception e) {
                        logger.error("RAG processing failed", e);
                        throw new BusinessException(ErrorCode.RAG_SERVICE_ERROR, "답변 생성 중 오류가 발생했습니다.", e);
                }
        }

        private String buildPrompt(String question, String context, String mission) {
                StringBuilder prompt = new StringBuilder();

                prompt.append("You are an expert in space habitat design and evaluation. ");

                if ("MARS".equalsIgnoreCase(mission)) {
                        prompt.append("Focus on Mars mission requirements including long-duration isolation, ");
                        prompt.append("resource efficiency, and crew psychological well-being. ");
                } else if ("LUNAR".equalsIgnoreCase(mission)) {
                        prompt.append("Focus on lunar mission requirements including frequent Earth communication, ");
                        prompt.append("EVA operations, and shorter mission durations. ");
                }

                prompt.append(
                                "Answer the following question based on the provided context from research papers and documentation.\n\n");
                prompt.append("Keep your response concise - 3-4 sentences maximum.\n\n");
                prompt.append("Context:\n").append(context).append("\n");
                prompt.append("Question: ").append(question).append("\n\n");
                prompt.append("Answer: ");

                return prompt.toString();
        }
}