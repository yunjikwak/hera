package com.example.demo.service;

import com.example.demo.enums.TagCategory;
import com.example.demo.repository.ModuleRepository;
import com.example.demo.repository.entity.Module;
import com.example.demo.repository.entity.ModuleTag;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

// 애플리케이션 시작 시 초기 데이터 로딩 서비스
@Service
@RequiredArgsConstructor
public class DataInitializationService implements CommandLineRunner {

        private static final Logger logger = LoggerFactory.getLogger(DataInitializationService.class);

        private final ModuleRepository moduleRepository;

        @Override
        public void run(String... args) throws Exception {
                logger.info("초기 데이터 로딩 시작...");

                try {
                        initializeModules();
                        logger.info("초기 데이터 로딩 완료");
                } catch (Exception e) {
                        logger.error("초기 데이터 로딩 실패", e);
                        throw e;
                }
        }

        // 18개 필수 모듈 데이터 초기화
        private void initializeModules() {
                if (moduleRepository.count() > 0) {
                        logger.info("Module data is already loaded.");
                        return;
                }

                logger.info("모듈 데이터 초기화 시작...");

                // 1. 사이클 운동기구
                createModule(new ModuleData(
                                "Cycle Ergometer",
                                "Exercise-1",
                                "Cycle Ergometer",
                                new BigDecimal("3.38"),
                                Arrays.asList("Aerobic exercise using cycle ergometer"),
                                "Noise and vibration may occur during exercise. Place far from spaces with #Quiet Required tag such as 'Private Quarters'.",
                                Arrays.asList("Common Space", "Noise Generating", "Health Maintenance")));

                // 2. 트레드밀
                createModule(new ModuleData(
                                "Treadmill",
                                "Exercise-2",
                                "Treadmill",
                                new BigDecimal("6.12"),
                                Arrays.asList("Aerobic exercise using treadmill",
                                                "Bone density maintenance exercise (Bone loading)",
                                                "Sensorimotor conditioning training"),
                                "High-utility core exercise equipment. Due to high noise levels, it's crucial to place as far as possible from spaces with #Quiet Required tag.",
                                Arrays.asList("Common Space", "Noise Generating", "Health Maintenance")));

                // 3. 저항 운동기구
                createModule(new ModuleData(
                                "Resistive Device",
                                "Exercise-3",
                                "Resistive Device",
                                new BigDecimal("3.92"),
                                Arrays.asList("Resistance exercise to prevent muscle loss"),
                                "Essential equipment to maintain muscles in zero-gravity environment. Efficient to place together with other exercise equipment to form an 'exercise zone'.",
                                Arrays.asList("Common Space", "Noise Generating", "Health Maintenance")));

                // 4. 개방형 사교 공간 / 훈련실
                createModule(new ModuleData(
                                "Open Social Area",
                                "Group-Social-1",
                                "Open Area / Training",
                                new BigDecimal("18.20"),
                                Arrays.asList("Group recreation (exercise games, etc.)",
                                                "Group mission training (VR training, etc.)"),
                                "The largest and most open space in the habitat. Important for crew stress relief and teamwork. Effective when placed near windows.",
                                Arrays.asList("Common Space", "Noise Generating", "Rest Space", "Work Space")));

                // 5. 다목적 테이블
                createModule(new ModuleData(
                                "Multi-purpose Table",
                                "Group-Social-2",
                                "Multi-purpose Table",
                                new BigDecimal("10.09"),
                                Arrays.asList("Full crew dining", "Table games, art activities, etc.",
                                                "Team meetings and mission planning"),
                                "Core community space for dining, meetings, and relaxation. Separate from #Contamination Zone 'Waste Collection' and place close to 'Kitchen'.",
                                Arrays.asList("Common Space", "Rest Space", "Work Space", "Clean Zone")));

                // 6. 화장실 (폐기물 수거)
                createModule(new ModuleData(
                                "Waste Collection",
                                "Human-Waste-1",
                                "Waste Collection",
                                new BigDecimal("2.36"),
                                Arrays.asList("Liquid and solid waste collection (urine, feces)"),
                                "Most sensitive space for hygiene. Must be separated as far as possible from #Clean Zone 'Kitchen', 'Multi-purpose Table', and 'Private Quarters'.",
                                Arrays.asList("Private Space", "Contamination Zone", "Resource Consuming")));

                // 7. 위생 공간 (세척)
                createModule(new ModuleData(
                                "Hygiene Space",
                                "Human-Waste-2",
                                "Cleansing / Hygiene-1",
                                new BigDecimal("4.35"),
                                Arrays.asList("Full body washing, hand washing",
                                                "Oral hygiene, shaving, nail care, and most hygiene activities"),
                                "Core hygiene space using water. Place adjacent to 'Waste Collection' to create a hygiene zone, but separate from #Clean Zone.",
                                Arrays.asList("Private Space", "Contamination Zone", "Resource Consuming")));

                // 8. 임시 저장 공간
                createModule(new ModuleData(
                                "Temporary Stowage",
                                "Logistics-2",
                                "Temporary Stowage",
                                new BigDecimal("6.00"),
                                Arrays.asList("Item packaging and unpacking", "Temporary item storage"),
                                "Central hub for logistics operations. Good to place considering accessibility to external hatches and other work spaces.",
                                Arrays.asList("Common Space", "Work Space")));

                // 9. 컴퓨터 워크스테이션
                createModule(new ModuleData(
                                "Computer Workstation",
                                "Maintenance-1",
                                "Computer Workstation",
                                new BigDecimal("3.40"),
                                Arrays.asList("Equipment diagnosis and control",
                                                "EVA data management and communication"),
                                "Space for precision work and communication. Good to separate from noisy 'exercise spaces'.",
                                Arrays.asList("Common Space", "Work Space", "Quiet Required")));

                // 10. 유지보수 작업대
                createModule(new ModuleData(
                                "Maintenance Workbench",
                                "Maintenance-2",
                                "Work Surface",
                                new BigDecimal("4.82"),
                                Arrays.asList("Equipment repair and maintenance",
                                                "Logistics inspection and repackaging",
                                                "Spacesuit component testing"),
                                "Complex work space handling various tools and components. Place adjacent to other work spaces (computer, temporary storage) to create efficient work flow.",
                                Arrays.asList("Common Space", "Work Space", "Contamination Zone")));

                // 11. 주방 (음식 준비)
                createModule(new ModuleData(
                                "Kitchen",
                                "Meal-Preparation-1",
                                "Food Preparation",
                                new BigDecimal("4.35"),
                                Arrays.asList("Food rehydration, cooking, heating, etc."),
                                "Clean zone where hygiene is extremely important. Place close to 'Multi-purpose Table' but must be separated from #Contamination Zone 'Waste Collection' and 'Hygiene Space'.",
                                Arrays.asList("Common Space", "Clean Zone", "Resource Consuming")));

                // 12. 주방 보조 작업대
                createModule(new ModuleData(
                                "Kitchen Work Surface",
                                "Meal-Preparation-2",
                                "Kitchen Work Surface",
                                new BigDecimal("3.30"),
                                Arrays.asList("Food item classification",
                                                "Dishware and cooking utensil hygiene management"),
                                "Auxiliary space for kitchen. Must be placed adjacent to 'Kitchen (Food Preparation)' module to create efficient circulation.",
                                Arrays.asList("Common Space", "Clean Zone")));

                // 13. 의료용 컴퓨터
                createModule(new ModuleData(
                                "Medical Computer",
                                "Medical-1",
                                "Medical Computer",
                                new BigDecimal("1.20"),
                                Arrays.asList("Medical data recording and management",
                                                "Remote medical consultation with Earth medical team (Private)"),
                                "Independent space needed for personal medical information protection and quiet consultation. Place where it can be visually/auditorily separated from other common spaces.",
                                Arrays.asList("Private Space", "Work Space", "Quiet Required")));

                // 14. 의료 처치 공간
                createModule(new ModuleData(
                                "Medical Care",
                                "Medical-3",
                                "Medical Care",
                                new BigDecimal("5.80"),
                                Arrays.asList("Emergency treatment and basic surgery",
                                                "Clinical diagnosis and dental care"),
                                "Essential space for emergency situations. Good to place where patient access is easy and close to other medical modules ('Medical Computer').",
                                Arrays.asList("Common Space", "Work Space", "Clean Zone")));

                // 15. 관제 및 모니터링
                createModule(new ModuleData(
                                "Mission Control",
                                "Mission-Planning-2",
                                "Computer/Command / Spacecraft Monitoring",
                                new BigDecimal("3.42"),
                                Arrays.asList("Spacecraft system piloting and control",
                                                "Remote operation and crew communication"),
                                "Like the 'cockpit' of the spacecraft. Requires concentration, so separate from noise sources and place adjacent to other #Work Space to form a 'work zone'.",
                                Arrays.asList("Common Space", "Work Space", "Quiet Required")));

                // 16. 개인 업무 공간 / 외래 진료
                createModule(new ModuleData(
                                "Individual Work Area",
                                "Private-Habitation-1",
                                "Individual Work Area / Ambulatory Care",
                                new BigDecimal("17.40"),
                                Arrays.asList("Personal work, study, private communication (4 crew total)",
                                                "Simple self-treatment and medication (outpatient care)"),
                                "Space for each crew member's personal work and privacy. Most ideal to integrate within 'Private Quarters-2 (Sleep)' space or place immediately adjacent.",
                                Arrays.asList("Private Space", "Work Space", "Quiet Required")));

                // 17. 개인 거주 (수면 및 휴식)
                createModule(new ModuleData(
                                "Private Quarters",
                                "Private-Habitation-2",
                                "Sleep & Relaxation / Non-Cleansing Hygiene-2",
                                new BigDecimal("13.96"),
                                Arrays.asList("Sleep", "Private rest and meditation",
                                                "Changing clothes, appearance management (non-cleansing hygiene)"),
                                "Most important personal space for crew psychological stability. Separate as far as possible from all modules with #Noise Generating and #Common Space tags.",
                                Arrays.asList("Private Space", "Quiet Required", "Rest Space", "Clean Zone")));

                // 18. 폐기물 관리
                createModule(new ModuleData(
                                "Waste Management",
                                "Waste-Management",
                                "Waste Management",
                                new BigDecimal("3.76"),
                                Arrays.asList("Waste packaging and compression", "Waste storage"),
                                "May cause hygiene issues and odors. Place close to #Contamination Zone 'Waste Collection' and 'Hygiene Space', but separate from all other living spaces.",
                                Arrays.asList("Common Space", "Contamination Zone")));

                logger.info("Module data creation completed.");
        }

        // 모듈 생성 헬퍼 메서드
        private void createModule(ModuleData data) {
                Module module = new Module();
                module.setName(data.name);
                module.setCode(data.code);
                module.setDisplayName(data.displayName);
                module.setVolume(data.volume);
                module.setNhv(data.volume);
                module.setDesignGuide(data.designGuide);
                module.setFunctions(data.functions);

                Module savedModule = moduleRepository.save(module);

                // 태그 추가
                for (String tagName : data.tags) {
                        TagCategory category = determineTagCategory(tagName);
                        ModuleTag tag = new ModuleTag(savedModule, tagName, category);
                        savedModule.getTags().add(tag);
                }

                moduleRepository.save(savedModule);
                logger.debug("Module creation completed: {}", data.name);
        }

        /// 태그명으로 카테고리 결정
        private TagCategory determineTagCategory(String tagName) {
                if (tagName.equals("Private Space") || tagName.equals("Common Space")) {
                        return TagCategory.USAGE;
                } else if (tagName.equals("Noise Generating")) {
                        return TagCategory.IMPACT;
                } else if (tagName.equals("Quiet Required")) {
                        return TagCategory.PRIVACY;
                } else if (tagName.equals("Clean Zone") || tagName.equals("Contamination Zone")
                                || tagName.equals("Contamination Possible")) {
                        return TagCategory.CLEANLINESS;
                } else if (tagName.equals("Resource Consuming")) {
                        return TagCategory.RESOURCE;
                } else if (tagName.equals("Work Space") || tagName.equals("Rest Space")) {
                        return TagCategory.FUNCTION;
                } else if (tagName.equals("Health Maintenance")) {
                        return TagCategory.BENEFIT;
                } else if (tagName.equals("Openness Important")) {
                        return TagCategory.PERCEPTION;
                } else {
                        return TagCategory.FUNCTION; // 기본값
                }
        }

        // 모듈 데이터 클래스
        private static class ModuleData {
                String name;
                String code;
                String displayName;
                BigDecimal volume; // 최소 NHV
                List<String> functions;
                String designGuide;
                List<String> tags;

                ModuleData(String name, String code, String displayName, BigDecimal volume,
                                List<String> functions, String designGuide, List<String> tags) {
                        this.name = name;
                        this.code = code;
                        this.displayName = displayName;
                        this.volume = volume;
                        this.functions = functions;
                        this.designGuide = designGuide;
                        this.tags = tags;
                }
        }
}