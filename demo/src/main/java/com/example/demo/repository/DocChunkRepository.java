package com.example.demo.repository;

import com.example.demo.controller.dto.DocChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocChunkRepository extends JpaRepository<DocChunk, Long> {

    List<DocChunk> findBySourcePath(String sourcePath);

    @Query("SELECT COUNT(d) FROM DocChunk d")
    long countAllChunks();

    @Query("SELECT DISTINCT d.sourcePath FROM DocChunk d")
    List<String> findDistinctSourcePaths();

    @Query("SELECT d FROM DocChunk d WHERE d.sourcePath = :sourcePath AND d.chunkIndex = :chunkIndex")
    DocChunk findBySourcePathAndChunkIndex(@Param("sourcePath") String sourcePath,
            @Param("chunkIndex") Integer chunkIndex);

    @Query("SELECT d FROM DocChunk d WHERE d.embeddingJson IS NOT NULL AND d.embeddingJson != ''")
    List<DocChunk> findAllWithEmbeddings();
}
