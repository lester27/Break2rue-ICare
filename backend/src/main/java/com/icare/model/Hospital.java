package com.icare.model;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

public class Hospital {

    private String id;
    private Integer numericId;
    private String name;
    private String address;
    private double latitude;
    private double longitude;
    private List<String> services;
    private String contactNumber;
    private String operatingHours;
    private String philHealthStatus;
    private String referenceKey;
    private String level;
    private List<Doctor> doctors;

    public Hospital() {
        this.services = Collections.emptyList();
        this.doctors = Collections.emptyList();
    }

    public Hospital(String id, String name, String address, double latitude, double longitude, List<String> services,
                    String contactNumber, String operatingHours, String philHealthStatus) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.services = services;
        this.contactNumber = contactNumber;
        this.operatingHours = operatingHours;
        this.philHealthStatus = philHealthStatus;
        this.doctors = Collections.emptyList();
    }

    public Hospital(String id, String name, String address, double latitude, double longitude, List<String> services,
                    String contactNumber, String operatingHours, String philHealthStatus, String referenceKey, String level) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.services = services;
        this.contactNumber = contactNumber;
        this.operatingHours = operatingHours;
        this.philHealthStatus = philHealthStatus;
        this.referenceKey = referenceKey;
        this.level = level;
        this.doctors = Collections.emptyList();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Integer getNumericId() {
        return numericId;
    }

    public void setNumericId(Integer numericId) {
        this.numericId = numericId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public List<String> getServices() {
        return services;
    }

    public void setServices(List<String> services) {
        this.services = services;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }

    public String getOperatingHours() {
        return operatingHours;
    }

    public void setOperatingHours(String operatingHours) {
        this.operatingHours = operatingHours;
    }

    public String getPhilHealthStatus() {
        return philHealthStatus;
    }

    public void setPhilHealthStatus(String philHealthStatus) {
        this.philHealthStatus = philHealthStatus;
    }

    public String getReferenceKey() {
        return referenceKey;
    }

    public void setReferenceKey(String referenceKey) {
        this.referenceKey = referenceKey;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public List<Doctor> getDoctors() {
        return doctors != null ? doctors : Collections.emptyList();
    }

    public void setDoctors(List<Doctor> doctors) {
        this.doctors = doctors != null ? doctors : Collections.emptyList();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Hospital)) return false;
        Hospital hospital = (Hospital) o;
        return Objects.equals(id, hospital.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
