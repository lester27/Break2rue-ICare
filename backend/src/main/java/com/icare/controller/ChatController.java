package com.icare.controller;

import com.icare.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS})
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private AIService aiService;

    @PostMapping("/message")
    public Map<String, Object> handleMessage(@RequestBody Map<String, String> request) {
        String userMessage = request.get("message");
        boolean offline = Boolean.parseBoolean(request.getOrDefault("offline", "false"));

        if (offline) {
            return aiService.offlineTriage(userMessage == null ? "" : userMessage);
        }

        Map<String, Object> response = new HashMap<>();
        try {
            String triage = aiService.getTriageResponse(userMessage);
            String aiResponse = aiService.callGemini("User symptoms: " + userMessage + ". Triage: " + triage);
            response.put("message", aiResponse);
            response.put("mode", "online");
        } catch (Exception e) {
            response.put("message", "AI service failed. Switching to offline mode.");
            response.put("options", new String[]{"Chest pain", "Fever", "Headache", "Shortness of breath", "Abdominal pain", "Other"});
            response.put("mode", "offline");
            response.put("autoSwitch", true);
        }

        return response;
    }

    @PostMapping("/offline/select")
    public Map<String, Object> handleOfflineSelection(@RequestBody Map<String, String> request) {
        String symptom = request.get("symptom");
        if (symptom == null || symptom.isBlank()) {
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("reply", "Please type your symptom or condition so we can search the Tagbilaran, Bohol database.");
            fallback.put("hospitals", Collections.emptyList());
            fallback.put("found", false);
            return fallback;
        }
        return aiService.offlineTriage(symptom);
    }
}