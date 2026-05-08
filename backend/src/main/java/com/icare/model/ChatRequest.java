package com.icare.model;

import java.util.List;

public class ChatRequest {
    private String message;
    private UserHealthProfile userProfile;
    private Double userLat;
    private Double userLng;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public UserHealthProfile getUserProfile() {
        return userProfile;
    }

    public void setUserProfile(UserHealthProfile userProfile) {
        this.userProfile = userProfile;
    }

    public Double getUserLat() {
        return userLat;
    }

    public void setUserLat(Double userLat) {
        this.userLat = userLat;
    }

    public Double getUserLng() {
        return userLng;
    }

    public void setUserLng(Double userLng) {
        this.userLng = userLng;
    }
}
