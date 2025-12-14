package com.example.demo.infra.pdf;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class PdfTextExtractor {

    private static final Logger logger = LoggerFactory.getLogger(PdfTextExtractor.class);

    public List<PageText> extractTextFromPdf(File pdfFile) {
        List<PageText> pages = new ArrayList<>();

        try (PDDocument document = PDDocument.load(pdfFile)) {
            logger.info("Processing PDF: {} ({} pages)", pdfFile.getName(), document.getNumberOfPages());

            PDFTextStripper stripper = new PDFTextStripper();

            // Extract text page by page
            for (int pageNum = 1; pageNum <= document.getNumberOfPages(); pageNum++) {
                stripper.setStartPage(pageNum);
                stripper.setEndPage(pageNum);

                String pageText = stripper.getText(document);

                if (pageText != null && !pageText.trim().isEmpty()) {
                    pages.add(new PageText(pageNum, pageText.trim()));
                    logger.debug("Extracted text from page {}: {} characters", pageNum, pageText.length());
                } else {
                    logger.debug("Page {} is empty or contains no text", pageNum);
                }
            }

            logger.info("Successfully extracted text from {} pages in {}", pages.size(), pdfFile.getName());

        } catch (IOException e) {
            logger.error("Failed to extract text from PDF: {}", pdfFile.getName(), e);
            throw new RuntimeException("PDF text extraction failed", e);
        }

        return pages;
    }

    public static class PageText {
        private final int pageNumber;
        private final String text;

        public PageText(int pageNumber, String text) {
            this.pageNumber = pageNumber;
            this.text = text;
        }

        public int getPageNumber() {
            return pageNumber;
        }

        public String getText() {
            return text;
        }
    }
}
