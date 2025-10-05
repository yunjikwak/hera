package com.example.demo.repository;

import com.example.demo.enums.TagCategory;
import com.example.demo.repository.entity.Module;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModuleRepository extends JpaRepository<Module, Long> {

    /**
     * 특정 코드로 모듈 조회
     */
    Optional<Module> findByCode(String code);

    /**
     * 태그 카테고리별 모듈 조회
     */
    @Query("SELECT m FROM Module m JOIN m.tags t WHERE t.category = :category ORDER BY m.name")
    List<Module> findByTagCategory(@Param("category") TagCategory category);

    /**
     * 특정 태그명을 가진 모듈 조회
     */
    @Query("SELECT m FROM Module m JOIN m.tags t WHERE t.tagName = :tagName ORDER BY m.name")
    List<Module> findByTagName(@Param("tagName") String tagName);

    /**
     * 특정 태그명과 값을 가진 모듈 조회
     */
    @Query("SELECT m FROM Module m JOIN m.tags t WHERE t.tagName = :tagName AND t.tagValue = :tagValue ORDER BY m.name")
    List<Module> findByTagNameAndValue(@Param("tagName") String tagName, @Param("tagValue") String tagValue);

    /**
     * 모든 모듈을 이름순으로 조회
     */
    List<Module> findAllByOrderByNameAsc();

    /**
     * 부피별 모듈 조회 (오름차순)
     */
    List<Module> findAllByOrderByVolumeAsc();

    /**
     * 부피별 모듈 조회 (내림차순)
     */
    List<Module> findAllByOrderByVolumeDesc();

    /**
     * 허용된 모든 모듈 개수 확인 (18개)
     */
    @Query("SELECT COUNT(m) FROM Module m")
    long countAllModules();

}
