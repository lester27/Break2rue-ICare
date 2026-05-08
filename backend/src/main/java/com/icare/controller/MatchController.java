package com.icare.controller;

import com.icare.model.Hospital;
import com.icare.model.UserProfile;
import com.icare.service.ExcelService;
import com.icare.service.MatchingEngine;
import com.icare.service.MatchingEngine.HospitalMatch;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class MatchController {

    private final MatchingEngine matchingEngine;
    private final ExcelService excelService;

    public MatchController(MatchingEngine matchingEngine, ExcelService excelService) {
        this.matchingEngine = matchingEngine;
        this.excelService = excelService;
    }

    @PostMapping("/match")
    public ResponseEntity<List<HospitalMatch>> matchHospitals(@RequestBody UserProfile userProfile) {
        if (userProfile == null) {
            return ResponseEntity.badRequest().build();
        }
        List<HospitalMatch> matches = matchingEngine.findMatchingHospitals(userProfile);
        return ResponseEntity.ok(matches);
    }

    @GetMapping("/hospital/{id}")
    public ResponseEntity<Hospital> getHospitalById(@PathVariable("id") String hospitalId) {
        Optional<Hospital> hospital = excelService.findHospitalById(hospitalId);
        return hospital.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleException(Exception exception) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("An error occurred while processing the health facility request.");
    }
}
