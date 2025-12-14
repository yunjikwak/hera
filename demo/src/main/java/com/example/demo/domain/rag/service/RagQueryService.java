package com.example.demo.domain.rag.service;

import com.example.demo.domain.rag.entity.DocChunk;
import com.example.demo.domain.rag.dto.RagAnswer;
import com.example.demo.domain.rag.dto.RagQueryRequest;
import com.example.demo.domain.rag.repository.DocChunkRepository;
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

        @Transactional
        public RagAnswer query(RagQueryRequest request) {
                if (!llmClient.isAvailable()) {
                        logger.warn("LLM service not available");
                        return new RagAnswer("LLM service is not available. Please check your Ollama installation.",
                                        new ArrayList<>(), new ArrayList<>());
                }

                // 1. Generate embedding for the question
                float[] queryEmbedding = embeddingService.generateEmbedding(request.getQuestion());

                // 2. Search for similar chunks in the vector store
                List<VectorSearchService.SearchResult> searchResults = vectorSearchService.searchSimilar(
                                queryEmbedding, request.getTopK());
                logger.info("Found {} similar chunks", searchResults.size());

                if (searchResults.isEmpty()) {
                        logger.warn("No similar chunks found for query");
                        return new RagAnswer("No relevant information found in the knowledge base.",
                                        new ArrayList<>(), new ArrayList<>());
                }

                // 3. Retrieve chunk details and build context
                List<RagAnswer.Chunk> chunks = new ArrayList<>();
                List<RagAnswer.Source> sources = new ArrayList<>();
                StringBuilder contextBuilder = new StringBuilder();

                for (VectorSearchService.SearchResult result : searchResults) {
                        Optional<DocChunk> chunkOpt = docChunkRepository.findById(result.getChunkId());
                        if (chunkOpt.isPresent()) {
                                DocChunk chunk = chunkOpt.get();

                                // Add to chunk list for the response
                                chunks.add(new RagAnswer.Chunk(
                                                chunk.getId(),
                                                chunk.getText(),
                                                chunk.getSourcePath(),
                                                chunk.getPageNo(),
                                                result.getSimilarity()));

                                // Add to source list for the response (avoiding duplicates)
                                String sourceKey = chunk.getSourcePath() + ":" + chunk.getPageNo();
                                if (sources.stream().noneMatch(
                                                s -> (s.getSourcePath() + ":" + s.getPageNo()).equals(sourceKey))) {
                                        String preview = chunk.getText().length() > 200
                                                        ? chunk.getText().substring(0, 200) + "..."
                                                        : chunk.getText();
                                        sources.add(new RagAnswer.Source(
                                                        chunk.getSourcePath(),
                                                        chunk.getPageNo(),
                                                        preview));
                                }

                                // Build the context for the LLM
                                contextBuilder.append("Source: ").append(chunk.getSourcePath())
                                                .append(" (Page ").append(chunk.getPageNo()).append(")\n");
                                contextBuilder.append("Content: ").append(chunk.getText()).append("\n\n");
                        }
                }

                // 4. Build the prompt for the LLM
                String context = contextBuilder.toString();
                String prompt = buildPrompt(request.getQuestion(), context, request.getMission());

                // 5. Generate the final answer from the LLM
                String answer = llmClient.generateResponse(prompt);
                logger.info("LLM response generated (length: {} chars)", answer.length());

                return new RagAnswer(answer, sources, chunks);
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