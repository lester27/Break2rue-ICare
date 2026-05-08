package com.icare.model;

import java.util.List;

public class HospitalCard {
    private int id;
    private String name;
    private String type;
    private String address;
    private String distance;
    private String travel;
    private String status;
    private List<String> specializations;
    private String directoryUrl;
    private List<String> tags;
    private String pinX;
    private String pinY;
    private double lat;
    private double lng;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getDistance() {
        return distance;
    }

    public void setDistance(String distance) {
        this.distance = distance;
    }

    public String getTravel() {
        return travel;
    }

    public void setTravel(String travel) {
        this.travel = travel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<String> getSpecializations() {
        return specializations;
    }

    public void setSpecializations(List<String> specializations) {
        this.specializations = specializations;
    }

    public String getDirectoryUrl() {
        return directoryUrl;
    }

    public void setDirectoryUrl(String directoryUrl) {
        this.directoryUrl = directoryUrl;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public String getPinX() {
        return pinX;
    }

    public void setPinX(String pinX) {
        this.pinX = pinX;
    }

    public String getPinY() {
        return pinY;
    }

    public void setPinY(String pinY) {
        this.pinY = pinY;
    }

    public double getLat() {
        return lat;
    }

    public void setLat(double lat) {
        this.lat = lat;
    }

    public double getLng() {
        return lng;
    }

    public void setLng(double lng) {
        this.lng = lng;
    }
}
