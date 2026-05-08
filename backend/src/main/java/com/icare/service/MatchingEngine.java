package com.icare.service;

import com.icare.model.Hospital;
import com.icare.model.UserProfile;
import com.icare.util.DistanceCalculator;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class MatchingEngine {

    private final ExcelService excelService;

    private static final Map<String, String> CONDITION_TO_SERVICE = Map.ofEntries(
            Map.entry("kidney", "Dialysis"),
            Map.entry("diabetes", "Endocrinology"),
            Map.entry("heart", "Cardiology"),
            Map.entry("maternal", "Maternity"),
            Map.entry("pregnancy", "Maternity"),
            Map.entry("pediatrics", "Pediatrics"),
            Map.entry("fever", "Internal Medicine"),
            Map.entry("respiratory", "Pulmonology"),
            Map.entry("wound", "Emergency"),
            Map.entry("stroke", "Neurology")
    );

    public MatchingEngine(ExcelService excelService) {
        this.excelService = excelService;
    }

    public List<HospitalMatch> findMatchingHospitals(UserProfile profile) {
        List<Hospital> hospitals = excelService.getHospitals();
        if (profile == null || hospitals.isEmpty()) {
            return new ArrayList<>();
        }

        Set<String> normalizedNeeds = buildSearchTerms(profile);
        double userLatitude = profile.getLatitude();
        double userLongitude = profile.getLongitude();

        return hospitals.stream()
                .map(hospital -> buildMatch(hospital, normalizedNeeds, userLatitude, userLongitude))
                .filter(match -> match.getSuitabilityScore() >= 0)
                .sorted(Comparator.comparingDouble(HospitalMatch::getSuitabilityScore).reversed())
                .collect(Collectors.toList());
    }

    public List<HospitalMatch> findNearbyHospitals(double latitude, double longitude, int radiusKm, int limit) {
        List<Hospital> hospitals = excelService.getHospitals();
        if (hospitals.isEmpty()) {
            return new ArrayList<>();
        }

        return hospitals.stream()
                .map(hospital -> {
                    double distanceKm = DistanceCalculator.haversineDistance(latitude, longitude, hospital.getLatitude(), hospital.getLongitude());
                    return new HospitalMatch(hospital, distanceKm, 0.0);
                })
                .filter(match -> match.getDistanceKm() <= radiusKm)
                .sorted(Comparator.comparingDouble(HospitalMatch::getDistanceKm))
                .limit(limit)
                .collect(Collectors.toList());
    }

    private Set<String> buildSearchTerms(UserProfile profile) {
        Set<String> terms = new HashSet<>();
        if (profile.getChronicConditions() != null) {
            for (String condition : profile.getChronicConditions()) {
                if (condition != null && !condition.isBlank()) {
                    terms.add(condition.trim().toLowerCase());
                }
            }
        }
        if (profile.getAllergies() != null) {
            for (String allergy : profile.getAllergies()) {
                if (allergy != null && !allergy.isBlank()) {
                    terms.add(allergy.trim().toLowerCase());
                }
            }
        }
        if (profile.getMedications() != null) {
            for (String medication : profile.getMedications()) {
                if (medication != null && !medication.isBlank()) {
                    terms.add(medication.trim().toLowerCase());
                }
            }
        }
        if (profile.getBloodType() != null && !profile.getBloodType().isBlank()) {
            terms.add(profile.getBloodType().trim().toUpperCase());
        }
        return terms;
    }

    private HospitalMatch buildMatch(Hospital hospital, Set<String> normalizedNeeds, double userLatitude, double userLongitude) {
        double distanceKm = DistanceCalculator.haversineDistance(userLatitude, userLongitude, hospital.getLatitude(), hospital.getLongitude());
        int matchingKeywords = countMatchingServices(hospital, normalizedNeeds);
        double score = calculateSuitabilityScore(distanceKm, matchingKeywords);
        return new HospitalMatch(hospital, distanceKm, score);
    }

    private int countMatchingServices(Hospital hospital, Set<String> needs) {
        if (hospital.getServices() == null || hospital.getServices().isEmpty() || needs.isEmpty()) {
            return 0;
        }
        int count = 0;
        for (String service : hospital.getServices()) {
            if (service == null) {
                continue;
            }
            String normalizedService = service.toLowerCase();
            for (String need : needs) {
                if (normalizedService.contains(need) || need.contains(normalizedService)) {
                    count++;
                    break;
                }
                String mappedService = CONDITION_TO_SERVICE.get(need);
                if (mappedService != null && normalizedService.contains(mappedService.toLowerCase())) {
                    count++;
                    break;
                }
            }
        }
        return count;
    }

    private double calculateSuitabilityScore(double distanceKm, int matchingKeywords) {
        double distanceScore = Math.max(0.0, 100.0 - (distanceKm * 3.0));
        double relevanceBonus = matchingKeywords * 20.0;
        return Math.round((distanceScore + relevanceBonus) * 100.0) / 100.0;
    }

    public static class HospitalMatch {
        private final Hospital hospital;
        private final double distanceKm;
        private final double suitabilityScore;

        public HospitalMatch(Hospital hospital, double distanceKm, double suitabilityScore) {
            this.hospital = hospital;
            this.distanceKm = distanceKm;
            this.suitabilityScore = suitabilityScore;
        }

        public Hospital getHospital() {
            return hospital;
        }

        public double getDistanceKm() {
            return distanceKm;
        }

        public double getSuitabilityScore() {
            return suitabilityScore;
        }
    }
}
