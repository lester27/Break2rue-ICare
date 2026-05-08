package com.icare.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.icare.model.Doctor;
import com.icare.model.Hospital;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AIService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private JsonNode specialties;
    private JsonNode triageData;
    private final ExcelService excelService;

    private static final LinkedHashMap<String, String> SYMPTOM_SPECIALTY_RULES = createSymptomSpecialtyRules();
    private static final Map<String, List<String>> SPECIALTY_KEYWORDS = createSpecialtyKeywords();

    @Autowired
    public AIService(ExcelService excelService) {
        this.excelService = excelService;
        try {
            specialties = loadJsonResource("ph_medical_specialties_mvp.json");
            triageData = loadJsonResource("ph_nurse_ai_dataset_mvp.json");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private JsonNode loadJsonResource(String filename) throws IOException {
        Path path = Paths.get(filename);
        if (!Files.exists(path)) {
            path = Paths.get("..", filename);
        }
        if (Files.exists(path)) {
            return objectMapper.readTree(Files.readAllBytes(path));
        }

        ClassPathResource resource = new ClassPathResource(filename);
        if (resource.exists()) {
            try (InputStream stream = resource.getInputStream()) {
                return objectMapper.readTree(stream);
            }
        }

        throw new IOException("Missing resource: " + filename + " in current folder, parent folder, or classpath.");
    }

    private static LinkedHashMap<String, String> createSymptomSpecialtyRules() {
        LinkedHashMap<String, String> rules = new LinkedHashMap<>();
        rules.put("chest pain", "Cardiology");
        rules.put("heart", "Cardiology");
        rules.put("shortness of breath", "Pulmonology");
        rules.put("difficulty breathing", "Pulmonology");
        rules.put("breath", "Pulmonology");
        rules.put("fever", "Internal Medicine");
        rules.put("cough", "Internal Medicine");
        rules.put("infection", "Internal Medicine");
        rules.put("headache", "Neurology");
        rules.put("migraine", "Neurology");
        rules.put("stomach", "Gastroenterology");
        rules.put("abdominal", "Gastroenterology");
        rules.put("nausea", "Gastroenterology");
        rules.put("dizzy", "General Practice");
        rules.put("other", "General Practice");
        return rules;
    }

    private static Map<String, List<String>> createSpecialtyKeywords() {
        Map<String, List<String>> keywords = new HashMap<>();
        keywords.put("cardiology", List.of("cardiology", "cardiac", "heart", "cardio"));
        keywords.put("pulmonology", List.of("pulmonology", "pulmonary", "respiratory", "lung", "lungs", "breathing"));
        keywords.put("internal medicine", List.of("internal medicine", "internal", "general medicine", "medicine", "general internal"));
        keywords.put("neurology", List.of("neurology", "neuro", "brain", "headache", "migraine", "nerve", "stroke"));
        keywords.put("gastroenterology", List.of("gastroenterology", "gastro", "digestive", "stomach", "abdominal", "nausea", "gut", "bowel"));
        keywords.put("general practice", List.of("general practice", "general", "family", "primary", "primary care", "gp", "family medicine", "general medicine"));
        return keywords;
    }

    private List<String> getKeywordsForSpecialty(String specialty) {
        if (specialty == null) {
            return Collections.emptyList();
        }
        return SPECIALTY_KEYWORDS.getOrDefault(specialty.toLowerCase(Locale.ROOT), Collections.singletonList(specialty.toLowerCase(Locale.ROOT)));
    }

    private boolean matchesAnyKeyword(String target, List<String> keywords) {
        if (target == null || target.isBlank()) {
            return false;
        }
        String normalized = target.toLowerCase(Locale.ROOT);
        for (String keyword : keywords) {
            if (keyword != null && !keyword.isBlank() && normalized.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    // Simple keyword matching for RAG
    public String getTriageResponse(String userInput) {
        // Match to cases based on keywords
        for (JsonNode caseNode : triageData.get("cases")) {
            String complaint = caseNode.get("complaint").asText().toLowerCase();
            if (userInput.toLowerCase().contains(complaint)) {
                // Return first branch for simplicity
                JsonNode branch = caseNode.get("branches").get(0);
                return "Based on your symptoms, this seems " + branch.get("condition").asText() +
                       ". Recommended action: " + branch.get("action").asText() +
                       ". Specialty: " + getSpecialtyName(branch.get("spec").asText());
            }
        }
        return "Please provide more details about your symptoms.";
    }

    public String getSpecialtyName(String specId) {
        JsonNode specs = specialties.get("specs");
        return specs.has(specId) ? specs.get(specId).asText() : "General Practitioner";
    }

    // Lazy load specialty description
    public String getSpecialtyDescription(String specId) {
        // For MVP, return name only, or fetch from full JSON if needed
        return getSpecialtyName(specId);
    }

    // Call Gemini 1.5 API with minimal context
    public String callGemini(String prompt) {
        // Placeholder for Gemini API call
        // Use RestTemplate to call Google AI Studio API
        // For now, return mock response
        return "AI Response: " + prompt.substring(0, 50) + "...";
    }

    // Offline mode: checklist triage
    public Map<String, Object> offlineTriage(String symptoms) {
        String cleaned = symptoms == null ? "" : symptoms.trim();
        String specialty = mapSymptomToSpecialty(cleaned);
        List<Hospital> matchedHospitals = findHospitalsForSpecialty(specialty, cleaned);

        Map<String, Object> result = new HashMap<>();
        if (!matchedHospitals.isEmpty()) {
            result.put("reply", "These are the suited hospitals for that section. All recommendations are based on the loaded hospital database.");
            result.put("specialty", specialty);
            result.put("location", "Hospital database region");
            result.put("hospitals", matchedHospitals.stream()
                    .map(this::buildHospitalSummary)
                    .collect(Collectors.toList()));
            result.put("found", true);
        } else {
            result.put("reply", "The specific specialist or hospital for this condition may not be available in the current hospital database.");
            result.put("hospitals", Collections.emptyList());
            result.put("found", false);
        }
        return result;
    }

    private String mapSymptomToSpecialty(String symptoms) {
        String normalized = symptoms == null ? "" : symptoms.toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) {
            return "General Practice";
        }
        for (Map.Entry<String, String> entry : SYMPTOM_SPECIALTY_RULES.entrySet()) {
            if (normalized.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return "General Practice";
    }

    private List<Hospital> findHospitalsForSpecialty(String specialty, String symptoms) {
        String lowerSpecialty = specialty.toLowerCase(Locale.ROOT);
        String lowerSymptoms = symptoms == null ? "" : symptoms.toLowerCase(Locale.ROOT);
        return excelService.getHospitals().stream()
                .filter(hospital -> matchesHospitalSpecialty(hospital, lowerSpecialty, lowerSymptoms))
                .collect(Collectors.toList());
    }

    private boolean matchesHospitalSpecialty(Hospital hospital, String lowerSpecialty, String lowerSymptoms) {
        if (hospital == null) {
            return false;
        }

        List<String> keywords = getKeywordsForSpecialty(lowerSpecialty);
        boolean hasServiceMatch = hospital.getServices() != null && hospital.getServices().stream()
                .anyMatch(service -> matchesAnyKeyword(service, keywords));
        if (hasServiceMatch) {
            return true;
        }

        if (hospital.getDoctors() != null) {
            for (Doctor doctor : hospital.getDoctors()) {
                if (doctor == null) continue;
                if (matchesAnyKeyword(doctor.getDepartment(), keywords)) {
                    return true;
                }
                if (matchesAnyKeyword(doctor.getType(), keywords)) {
                    return true;
                }
                if (doctor.getTags() != null) {
                    for (String tag : doctor.getTags()) {
                        if (matchesAnyKeyword(tag, keywords)) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    private Map<String, Object> buildHospitalSummary(Hospital hospital) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("id", hospital.getId());
        summary.put("name", hospital.getName());
        summary.put("address", hospital.getAddress());
        summary.put("type", hospital.getLevel() != null && !hospital.getLevel().isBlank() ? hospital.getLevel() : "Hospital");
        summary.put("lat", hospital.getLatitude());
        summary.put("lng", hospital.getLongitude());
        summary.put("specializations", hospital.getServices() != null ? hospital.getServices() : Collections.emptyList());
        summary.put("contactNumber", hospital.getContactNumber());
        summary.put("doctors", hospital.getDoctors().stream()
                .map(Doctor::getName)
                .filter(Objects::nonNull)
                .limit(3)
                .collect(Collectors.toList()));
        return summary;
    }
}