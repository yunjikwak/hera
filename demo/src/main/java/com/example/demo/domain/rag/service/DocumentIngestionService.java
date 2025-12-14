package com.example.demo.domain.rag.service;

import com.example.demo.domain.rag.entity.DocChunk;
import com.example.demo.domain.rag.repository.DocChunkRepository;
import com.example.demo.infra.embedding.EmbeddingService;
import com.example.demo.infra.pdf.PdfTextExtractor;
import com.example.demo.infra.pdf.TextChunker;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class DocumentIngestionService implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DocumentIngestionService.class);

    @Value("${rag.enabled:true}")
    private boolean ragEnabled;

    @Value("${rag.docs.dir:docs}")
    private String docsDirectory;

    private final PdfTextExtractor pdfTextExtractor;
    private final TextChunker textChunker;
    private final EmbeddingService embeddingService;
    private final VectorSearchService vectorSearchService;
    private final DocChunkRepository docChunkRepository;

    @Override
    public void run(String... args) throws Exception {
        if (!ragEnabled) {
            logger.info("RAG is disabled, skipping document ingestion");
            return;
        }

        logger.info("Starting document ingestion from directory: {}", docsDirectory);

        File docsDir = new File(docsDirectory);
        if (!docsDir.exists() || !docsDir.isDirectory()) {
            logger.warn("Documents directory does not exist: {}", docsDirectory);
            return;
        }

        // Process PDF files
        File[] pdfFiles = docsDir.listFiles((dir, name) -> name.toLowerCase().endsWith(".pdf"));
        AtomicInteger totalChunks = new AtomicInteger(0);
        AtomicInteger processedFiles = new AtomicInteger(0);

        if (pdfFiles != null && pdfFiles.length > 0) {
            for (File pdfFile : pdfFiles) {
                try {
                    logger.info("Processing PDF: {}", pdfFile.getName());
                    processPdfFile(pdfFile, totalChunks);
                    processedFiles.incrementAndGet();
                } catch (Exception e) {
                    logger.error("Failed to process PDF: {}", pdfFile.getName(), e);
                }
            }
        }

        // Process Markdown files
        File[] mdFiles = docsDir.listFiles((dir, name) -> name.toLowerCase().endsWith(".md"));
        if (mdFiles != null && mdFiles.length > 0) {
            for (File mdFile : mdFiles) {
                try {
                    logger.info("Processing Markdown: {}", mdFile.getName());
                    processMarkdownFile(mdFile, totalChunks);
                    processedFiles.incrementAndGet();
                } catch (Exception e) {
                    logger.error("Failed to process Markdown: {}", mdFile.getName(), e);
                }
            }
        }

        if (processedFiles.get() == 0) {
            logger.warn("No PDF or Markdown files found in directory: {}", docsDirectory);
            return;
        }

        logger.info("Document ingestion completed. Processed {} files, created {} chunks",
                processedFiles.get(), totalChunks.get());
    }

    private void processPdfFile(File pdfFile, AtomicInteger totalChunks) {
        String sourcePath = pdfFile.getAbsolutePath();

        // Check if this file is already processed
        List<DocChunk> existingChunks = docChunkRepository.findBySourcePath(sourcePath);
        if (!existingChunks.isEmpty()) {
            logger.debug("PDF already processed: {} ({} chunks)", pdfFile.getName(), existingChunks.size());
            return;
        }

        // Extract text from PDF
        List<PdfTextExtractor.PageText> pages = pdfTextExtractor.extractTextFromPdf(pdfFile);

        int fileChunkCount = 0;
        for (PdfTextExtractor.PageText page : pages) {
            // Chunk the text
            List<TextChunker.TextChunk> chunks = textChunker.chunkText(
                    page.getText(), sourcePath, page.getPageNumber());

            // Process each chunk
            for (TextChunker.TextChunk chunk : chunks) {
                try {
                    // Generate embedding
                    float[] embedding = embeddingService.generateEmbedding(chunk.getText());

                    // Create DocChunk entity
                    DocChunk docChunk = new DocChunk();
                    docChunk.setSourcePath(chunk.getSourcePath());
                    docChunk.setPageNo(chunk.getPageNumber());
                    docChunk.setChunkIndex(chunk.getChunkIndex());
                    docChunk.setText(chunk.getText());
                    docChunk.setEmbeddingFromArray(embedding);

                    // Save to database
                    DocChunk savedChunk = docChunkRepository.save(docChunk);

                    // Add to in-memory index
                    vectorSearchService.addEmbedding(savedChunk.getId(), embedding);

                    fileChunkCount++;
                    totalChunks.incrementAndGet();

                } catch (Exception e) {
                    logger.error("Failed to process chunk from {} page {}",
                            pdfFile.getName(), page.getPageNumber(), e);
                }
            }
        }

        logger.info("Processed PDF: {} ({} chunks)", pdfFile.getName(), fileChunkCount);
    }

    private void processMarkdownFile(File mdFile, AtomicInteger totalChunks) {
        String sourcePath = mdFile.getAbsolutePath();

        // Check if this file is already processed
        List<DocChunk> existingChunks = docChunkRepository.findBySourcePath(sourcePath);
        if (!existingChunks.isEmpty()) {
            logger.debug("Markdown already processed: {} ({} chunks)", mdFile.getName(), existingChunks.size());
            return;
        }

        try {
            // Read markdown file content
            String content = new String(java.nio.file.Files.readAllBytes(mdFile.toPath()), "UTF-8");

            // Chunk the text (treat as single page)
            List<TextChunker.TextChunk> chunks = textChunker.chunkText(content, sourcePath, 1);

            int fileChunkCount = 0;
            for (TextChunker.TextChunk chunk : chunks) {
                try {
                    // Generate embedding
                    float[] embedding = embeddingService.generateEmbedding(chunk.getText());

                    // Create DocChunk entity
                    DocChunk docChunk = new DocChunk();
                    docChunk.setSourcePath(chunk.getSourcePath());
                    docChunk.setPageNo(chunk.getPageNumber());
                    docChunk.setChunkIndex(chunk.getChunkIndex());
                    docChunk.setText(chunk.getText());
                    docChunk.setEmbeddingFromArray(embedding);

                    // Save to database
                    DocChunk savedChunk = docChunkRepository.save(docChunk);

                    // Add to in-memory index
                    vectorSearchService.addEmbedding(savedChunk.getId(), embedding);

                    fileChunkCount++;
                    totalChunks.incrementAndGet();

                } catch (Exception e) {
                    logger.error("Failed to process chunk from {}", mdFile.getName(), e);
                }
            }

            logger.info("Processed Markdown: {} ({} chunks)", mdFile.getName(), fileChunkCount);

        } catch (Exception e) {
            logger.error("Failed to read Markdown file: {}", mdFile.getName(), e);
        }
    }
}
