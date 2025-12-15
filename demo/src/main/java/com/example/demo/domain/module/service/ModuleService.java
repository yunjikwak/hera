package com.example.demo.domain.module.service;

import com.example.demo.domain.module.dto.ModuleResponseDto;
import com.example.demo.domain.module.entity.Module;
import com.example.demo.domain.module.repository.ModuleRepository;
import com.example.demo.global.exception.BusinessException;
import com.example.demo.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final ModuleRepository moduleRepository;

    @Transactional(readOnly = true)
    public List<Module> findAll() {
        return moduleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Module findEntityById(Long id) {
        return moduleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "모듈을 찾을 수 없습니다. ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<ModuleResponseDto> findAllModules() {
        List<Module> modules = moduleRepository.findAllByOrderByNameAsc();
        return modules.stream()
                .map(ModuleResponseDto::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ModuleResponseDto findModuleById(Long id) {
        if (id == null || id <= 0) {
            throw new BusinessException(ErrorCode.INVALID_ID, "올바른 모듈 ID를 입력해주세요.");
        }
        return moduleRepository.findById(id)
                .map(ModuleResponseDto::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "모듈을 찾을 수 없습니다. ID: " + id));
    }

    @Transactional
    public Module save(Module module) {
        return moduleRepository.save(module);
    }

    // N+1 방지
    // 여러 ID를 한 번에 조회하여 Map으로 반환 (ID -> Module)
    @Transactional(readOnly = true)
    public Map<Long, Module> findAllByIdsAsMap(List<Long> ids) {
        return moduleRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Module::getId, module -> module));
    }

    @Transactional
    public void deleteById(Long id) {
        if (!moduleRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND,
                    "삭제할 모듈을 찾을 수 없습니다. ID: " + id);
        }
        moduleRepository.deleteById(id);
    }
}
