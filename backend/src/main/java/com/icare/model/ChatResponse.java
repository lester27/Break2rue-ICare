package com.icare.model;

import java.util.List;

public class ChatResponse {
    private String reply;
    private List<HospitalCard> hospitals;
    private List<String> tags;

    public ChatResponse() {
    }

    public ChatResponse(String reply, List<HospitalCard> hospitals, List<String> tags) {
        this.reply = reply;
        this.hospitals = hospitals;
        this.tags = tags;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public List<HospitalCard> getHospitals() {
        return hospitals;
    }

    public void setHospitals(List<HospitalCard> hospitals) {
        this.hospitals = hospitals;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }
}
