package com.example.demo.service;

import com.example.demo.controller.dto.ModuleResponseDto;
import com.example.demo.repository.entity.Module;
import com.example.demo.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
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
        return moduleRepository.findById(id).orElse(null);
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
        if (id == null) {
            return null;
        }
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("모듈을 찾을 수 없습니다."));
        return ModuleResponseDto.from(module);
    }

    @Transactional
    public Module save(Module module) {
        return moduleRepository.save(module);
    }

    @Transactional
    public void deleteById(Long id) {
        moduleRepository.deleteById(id);
    }
}
