package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.repository.entity.EvaluationRecord;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 평가 기록 데이터 접근 Repository
 */
@Repository
public interface EvaluationRecordRepository extends JpaRepository<EvaluationRecord, Long> {

       // /**
       // * 특정 미션 프로필의 평가 기록 조회
       // */
       // List<EvaluationRecord> findByMissionProfileOrderByEvaluationTimeDesc(String
       // missionProfile);

       /**
        * 특정 기간의 평가 기록 조회
        */
       List<EvaluationRecord> findByEvaluationTimeBetweenOrderByEvaluationTimeDesc(LocalDateTime start,
                     LocalDateTime end);

       /**
        * 거주지 크기 범위별 평가 기록 조회
        */
       @Query("SELECT e FROM EvaluationRecord e WHERE " +
                     "e.habitatX >= :minX AND e.habitatY >= :minY AND e.habitatZ >= :minZ AND " +
                     "e.habitatX <= :maxX AND e.habitatY <= :maxY AND e.habitatZ <= :maxZ " +
                     "ORDER BY e.evaluationTime DESC")
       List<EvaluationRecord> findByHabitatVolumeRange(@Param("minX") java.math.BigDecimal minX,
                     @Param("minY") java.math.BigDecimal minY,
                     @Param("minZ") java.math.BigDecimal minZ,
                     @Param("maxX") java.math.BigDecimal maxX,
                     @Param("maxY") java.math.BigDecimal maxY,
                     @Param("maxZ") java.math.BigDecimal maxZ);

       /**
        * 최근 평가 기록 조회 (상위 N개)
        */
       @Query("SELECT e FROM EvaluationRecord e ORDER BY e.evaluationTime DESC")
       List<EvaluationRecord> findTopNByOrderByEvaluationTimeDesc(int limit);

       /**
        * 성공적인 평가 기록만 조회 (패널티가 없는)
        */
       @Query("SELECT e FROM EvaluationRecord e WHERE NOT EXISTS (" +
                     "SELECT 1 FROM EvaluationRecord e2 WHERE e2.id = e.id AND e2.scoresJson LIKE '%penaltyScore%') " +
                     "ORDER BY e.evaluationTime DESC")
       List<EvaluationRecord> findSuccessfulEvaluations();

       // /**
       // * 평균 점수 통계 조회
       // */
       // @Query("SELECT AVG(CAST(JSON_EXTRACT(e.scoresJson, '$.overallScore') AS
       // DOUBLE)) " +
       // "FROM EvaluationRecord e " +
       // "WHERE e.missionProfile = :missionProfile " +
       // "AND NOT EXISTS (SELECT 1 FROM EvaluationRecord e2 WHERE e2.id = e.id AND
       // e2.scoresJson LIKE '%penaltyScore%')")
       // Double getAverageScoreByMissionProfile(@Param("missionProfile") String
       // missionProfile);
}
