package com.example.demo.infra.pdf;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class TextChunker {

    private static final Logger logger = LoggerFactory.getLogger(TextChunker.class);

    private static final int MAX_CHUNK_TOKENS = 512;
    private static final int OVERLAP_TOKENS = 50;
    private static final Pattern SENTENCE_ENDINGS = Pattern.compile("[.!?]+\\s+");
    private static final Pattern PARAGRAPH_BREAKS = Pattern.compile("\\n\\s*\\n");

    public List<TextChunk> chunkText(String text, String sourcePath, int pageNumber) {
        List<TextChunk> chunks = new ArrayList<>();

        if (text == null || text.trim().isEmpty()) {
            return chunks;
        }

        // Split by paragraphs first
        String[] paragraphs = PARAGRAPH_BREAKS.split(text);
        List<String> sentences = new ArrayList<>();

        // Split paragraphs into sentences
        for (String paragraph : paragraphs) {
            if (paragraph.trim().isEmpty())
                continue;

            String[] paragraphSentences = SENTENCE_ENDINGS.split(paragraph);
            for (String sentence : paragraphSentences) {
                if (sentence.trim().isEmpty())
                    continue;
                sentences.add(sentence.trim());
            }
        }

        // Create chunks with overlap
        List<String> currentChunk = new ArrayList<>();
        int currentTokens = 0;
        int chunkIndex = 0;

        for (String sentence : sentences) {
            int sentenceTokens = estimateTokenCount(sentence);

            // If adding this sentence would exceed max tokens, finalize current chunk
            if (currentTokens + sentenceTokens > MAX_CHUNK_TOKENS && !currentChunk.isEmpty()) {
                String chunkText = String.join(" ", currentChunk);
                chunks.add(new TextChunk(sourcePath, pageNumber, chunkIndex++, chunkText));

                // Start new chunk with overlap
                currentChunk = createOverlapChunk(currentChunk);
                currentTokens = estimateTokenCount(String.join(" ", currentChunk));
            }

            currentChunk.add(sentence);
            currentTokens += sentenceTokens;
        }

        // Add final chunk if not empty
        if (!currentChunk.isEmpty()) {
            String chunkText = String.join(" ", currentChunk);
            chunks.add(new TextChunk(sourcePath, pageNumber, chunkIndex, chunkText));
        }

        // logger.debug("Created {} chunks from page {} of {}", chunks.size(),
        // pageNumber, sourcePath);
        return chunks;
    }

    private List<String> createOverlapChunk(List<String> previousChunk) {
        List<String> overlap = new ArrayList<>();
        int overlapTokens = 0;

        // Take last sentences that fit within overlap token limit
        for (int i = previousChunk.size() - 1; i >= 0 && overlapTokens < OVERLAP_TOKENS; i--) {
            String sentence = previousChunk.get(i);
            int sentenceTokens = estimateTokenCount(sentence);

            if (overlapTokens + sentenceTokens <= OVERLAP_TOKENS) {
                overlap.add(0, sentence); // Add to beginning to maintain order
                overlapTokens += sentenceTokens;
            } else {
                break;
            }
        }

        return overlap;
    }

    private int estimateTokenCount(String text) {
        // Rough estimation: 1 token ≈ 4 characters for English text
        return Math.max(1, text.length() / 4);
    }

    public static class TextChunk {
        private final String sourcePath;
        private final int pageNumber;
        private final int chunkIndex;
        private final String text;

        public TextChunk(String sourcePath, int pageNumber, int chunkIndex, String text) {
            this.sourcePath = sourcePath;
            this.pageNumber = pageNumber;
            this.chunkIndex = chunkIndex;
            this.text = text;
        }

        public String getSourcePath() {
            return sourcePath;
        }

        public int getPageNumber() {
            return pageNumber;
        }

        public int getChunkIndex() {
            return chunkIndex;
        }

        public String getText() {
            return text;
        }
    }
}