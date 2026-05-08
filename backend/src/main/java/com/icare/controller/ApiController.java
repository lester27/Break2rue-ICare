package com.icare.controller;

import com.icare.model.ChatRequest;
import com.icare.model.ChatResponse;
import com.icare.model.Doctor;
import com.icare.model.Hospital;
import com.icare.model.HospitalCard;
import com.icare.model.UserHealthProfile;
import com.icare.service.ExcelService;
import com.icare.service.MatchingEngine;
import com.icare.service.UserProfileStore;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@org.springframework.web.bind.annotation.CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class ApiController {

    private final MatchingEngine matchingEngine;
    private final ExcelService excelService;
    private final UserProfileStore userProfileStore;

    private static final double MIN_LAT = 9.6400;
    private static final double MAX_LAT = 9.6700;
    private static final double MIN_LNG = 123.8400;
    private static final double MAX_LNG = 123.8600;

    public ApiController(MatchingEngine matchingEngine, ExcelService excelService, UserProfileStore userProfileStore) {
        this.matchingEngine = matchingEngine;
        this.excelService = excelService;
        this.userProfileStore = userProfileStore;
    }

    @GetMapping("/hospitals/center")
    public ResponseEntity<java.util.Map<String, Double>> getHospitalsCenter() {
        List<Hospital> all = excelService.getHospitals().stream()
                .filter(h -> h.getLatitude() != 0.0 && h.getLongitude() != 0.0)
                .collect(Collectors.toList());

        if (all.isEmpty()) {
            // Fallback: Tagbilaran City geographic center
            return ResponseEntity.ok(java.util.Map.of("lat", 9.6412, "lng", 123.8566));
        }

        double avgLat = all.stream().mapToDouble(Hospital::getLatitude).average().orElse(9.6412);
        double avgLng = all.stream().mapToDouble(Hospital::getLongitude).average().orElse(123.8566);

        return ResponseEntity.ok(java.util.Map.of("lat", avgLat, "lng", avgLng));
    }

    @GetMapping("/hospitals/nearby")
    public ResponseEntity<List<HospitalCard>> getNearbyHospitals(
            @RequestParam("lat") Double latitude,
            @RequestParam("lng") Double longitude,
            @RequestParam(value = "radius", defaultValue = "10") Integer radiusKm,
            @RequestParam(value = "limit", defaultValue = "6") Integer limit
    ) {
        if (latitude == null || longitude == null) {
            return ResponseEntity.badRequest().build();
        }
        if (radiusKm == null || radiusKm <= 0) {
            radiusKm = 10;
        }
        if (limit == null || limit <= 0) {
            limit = 6;
        }

        List<HospitalCard> cards = matchingEngine.findNearbyHospitals(latitude, longitude, radiusKm, limit).stream()
                .map(match -> toHospitalCard(match.getHospital(), match.getDistanceKm()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(cards);
    }

    @GetMapping("/hospitals/{id}/doctors")
    public ResponseEntity<List<Doctor>> getDoctorsForHospital(@PathVariable("id") int hospitalId) {
        Optional<Hospital> hospital = excelService.findHospitalByNumericId(hospitalId);
        if (hospital.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(hospital.get().getDoctors());
    }

    @PostMapping("/users/profile")
    public ResponseEntity<Void> saveUserProfile(@RequestBody UserHealthProfile profile) {
        if (profile == null) {
            return ResponseEntity.badRequest().build();
        }
        userProfileStore.save(profile);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/users/profile")
    public ResponseEntity<UserHealthProfile> loadUserProfile() {
        return userProfileStore.load()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NO_CONTENT).build());
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> handleChat(@RequestBody ChatRequest request) {
        if (request == null || request.getMessage() == null) {
            return ResponseEntity.badRequest().build();
        }
        double lat = request.getUserLat() != null ? request.getUserLat() : 9.6461;
        double lng = request.getUserLng() != null ? request.getUserLng() : 123.8519;
        List<String> tags = extractTags(request.getMessage());

        List<HospitalCard> hospitals = matchingEngine.findNearbyHospitals(lat, lng, 10, 6).stream()
                .map(match -> toHospitalCard(match.getHospital(), match.getDistanceKm()))
                .filter(card -> tags.isEmpty() || card.getTags().stream().anyMatch(tags::contains))
                .collect(Collectors.toList());

        if (hospitals.isEmpty()) {
            hospitals = matchingEngine.findNearbyHospitals(lat, lng, 20, 6).stream()
                    .map(match -> toHospitalCard(match.getHospital(), match.getDistanceKm()))
                    .collect(Collectors.toList());
        }

        String reply = buildChatReply(request.getMessage(), tags);
        return ResponseEntity.ok(new ChatResponse(reply, hospitals, tags));
    }

    @PostMapping("/chat/health-form")
    public ResponseEntity<ChatResponse> handleHealthFormChat(@RequestBody ChatRequest request) {
        String reply = "Thanks for sharing your health details. I can help you understand your profile and recommend what to do next.";
        if (request != null && request.getUserProfile() != null) {
            UserHealthProfile profile = request.getUserProfile();
            if (profile.getBloodType() != null && !profile.getBloodType().isBlank()) {
                reply = "I see your blood type is " + profile.getBloodType() + ". Keep it handy during emergencies. " +
                        "If you want, I can also suggest hospitals that accept PhilHealth and emergency care near you.";
            }
        }
        return ResponseEntity.ok(new ChatResponse(reply, Collections.emptyList(), Collections.emptyList()));
    }

    private HospitalCard toHospitalCard(Hospital hospital, double distanceKm) {
        HospitalCard card = new HospitalCard();
        card.setId(hospital.getNumericId() != null ? hospital.getNumericId() : 0);
        card.setName(hospital.getName());
        card.setType(determineHospitalType(hospital));
        card.setAddress(hospital.getAddress());
        card.setDistance(String.format(Locale.ENGLISH, "%.1f km", distanceKm));
        card.setTravel(computeTravelTime(distanceKm));
        card.setStatus(computeStatus(hospital));
        card.setSpecializations(hospital.getServices());
        card.setDirectoryUrl("#");
        card.setTags(generateTags(hospital));
        card.setLat(hospital.getLatitude());
        card.setLng(hospital.getLongitude());
        card.setPinX(toPercent(hospital.getLongitude(), MIN_LNG, MAX_LNG));
        card.setPinY(toPercent(MAX_LAT - hospital.getLatitude(), 0, MAX_LAT - MIN_LAT));
        return card;
    }

    private String determineHospitalType(Hospital hospital) {
        String name = hospital.getName() != null ? hospital.getName().toLowerCase(Locale.ENGLISH) : "";
        if (name.contains("city") || name.contains("government") || name.contains("regional") || name.contains("municipal")) {
            return "Government Hospital";
        }
        return "Private Hospital";
    }

    private String computeTravelTime(double distanceKm) {
        int minutes = Math.max(5, (int) Math.round(distanceKm * 4.5));
        return minutes + " min";
    }

    private String computeStatus(Hospital hospital) {
        String hours = hospital.getOperatingHours();
        if (hours != null && hours.toLowerCase(Locale.ENGLISH).contains("24/7")) {
            return "Open 24/7";
        }
        return hours != null && !hours.isBlank() ? hours : "Open";
    }

    private List<String> generateTags(Hospital hospital) {
        if (hospital.getServices() == null || hospital.getServices().isEmpty()) {
            return Collections.singletonList("general");
        }
        return hospital.getServices().stream()
                .filter(s -> s != null && !s.isBlank())
                .map(s -> s.trim().toLowerCase(Locale.ENGLISH))
                .map(s -> s.replace(" ", "-"))
                .collect(Collectors.toList());
    }

    private String toPercent(double value, double min, double max) {
        double clipped = Math.max(min, Math.min(max, value));
        double percent = (clipped - min) / (max - min) * 100.0;
        return String.format(Locale.ENGLISH, "%.1f%%", percent);
    }

    private List<Doctor> getSampleDoctors(int hospitalId) {
        if (hospitalId == 1) {
            return Arrays.asList(
                    buildDoctor(101, "Dr. Ramon dela Cruz", "Specialist", "Cardiology", "Mon, Wed, Fri 8AM–12PM", "₱500 – ₱800", Arrays.asList("PhilHealth", "MediCard"), "+63 38 412 3456", "Ms. Lourdes Ramos", Arrays.asList("cardiology", "emergency")),
                    buildDoctor(102, "Dr. Ana Bautista", "Specialist", "Neurology", "Tue, Thu 9AM–3PM", "₱600 – ₱900", Arrays.asList("PhilHealth", "Intellicare"), "+63 38 412 3457", "Ms. Cecilia Torres", Arrays.asList("neurology"))
            );
        }
        if (hospitalId == 2) {
            return Arrays.asList(
                    buildDoctor(201, "Dr. Sophia Cruz", "Specialist", "Cardiology", "Mon, Wed 8AM–1PM; Fri 1PM–6PM", "₱1,200 – ₱2,000", Arrays.asList("Maxicare", "MediCard", "Intellicare", "PhilHealth"), "+63 38 409 8765", "Ms. Jennifer Go", Arrays.asList("cardiology")),
                    buildDoctor(202, "Dr. Carlos Mendoza", "Specialist", "Orthopedics", "Tue, Thu, Sat 9AM–4PM", "₱1,000 – ₱1,800", Arrays.asList("Maxicare", "Intellicare", "PhilHealth"), "+63 38 409 8766", "Ms. Rachel Uy", Arrays.asList("general"))
            );
        }
        if (hospitalId == 3) {
            return Arrays.asList(
                    buildDoctor(301, "Dr. Luisa Fernandez", "Specialist", "Oncology", "Mon, Wed, Fri 9AM–3PM", "₱1,500 – ₱2,500", Arrays.asList("Maxicare", "MediCard", "Intellicare", "PhilHealth"), "+63 38 412 3987", "Ms. Diana Chavez", Arrays.asList("oncology"))
            );
        }
        return Collections.emptyList();
    }

    private Doctor buildDoctor(int id, String name, String type, String department, String schedule,
                               String priceRange, List<String> hmos, String contact, String secretary, List<String> tags) {
        Doctor doctor = new Doctor();
        doctor.setId(id);
        doctor.setName(name);
        doctor.setType(type);
        doctor.setDepartment(department);
        doctor.setSchedule(schedule);
        doctor.setPriceRange(priceRange);
        doctor.setHmos(hmos);
        doctor.setContact(contact);
        doctor.setSecretary(secretary);
        doctor.setTags(tags);
        return doctor;
    }

    private List<String> extractTags(String message) {
        if (message == null || message.isBlank()) {
            return Collections.emptyList();
        }
        String lower = message.toLowerCase(Locale.ENGLISH);
        Set<String> tags = new HashSet<>();
        if (lower.contains("cardio") || lower.contains("heart") || lower.contains("chest")) {
            tags.add("cardiology");
        }
        if (lower.contains("pediatric") || lower.contains("child") || lower.contains("baby")) {
            tags.add("pediatrics");
        }
        if (lower.contains("cancer") || lower.contains("oncology")) {
            tags.add("oncology");
        }
        if (lower.contains("emergency") || lower.contains("urgent") || lower.contains("accident")) {
            tags.add("emergency");
        }
        if (lower.contains("respir") || lower.contains("fever") || lower.contains("cough") || lower.contains("asthma")) {
            tags.add("general");
        }
        return new ArrayList<>(tags);
    }

    private String buildChatReply(String message, List<String> tags) {
        String lower = message.toLowerCase(Locale.ENGLISH);
        if (lower.contains("heart") || lower.contains("cardio") || lower.contains("chest")) {
            return "I recommend seeing a cardiology specialist soon. Here are nearby hospitals with cardiology support.";
        }
        if (lower.contains("child") || lower.contains("pediatric")) {
            return "These nearby hospitals offer pediatric care and emergency support for children.";
        }
        if (lower.contains("emergency") || lower.contains("urgent") || lower.contains("accident")) {
            return "This looks urgent. Please use the nearest hospital with 24/7 emergency services.";
        }
        if (tags.isEmpty()) {
            return "Based on your location, here are nearby hospitals that may be able to help.";
        }
        return "I found hospitals matching your concern. Please review the recommendations and tap a hospital for details.";
    }
}
