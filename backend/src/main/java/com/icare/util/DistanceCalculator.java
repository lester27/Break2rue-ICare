package com.icare.util;

public final class DistanceCalculator {

    private static final double EARTH_RADIUS_KM = 6371.0;

    private DistanceCalculator() {
    }

    public static double haversineDistance(double latitude1, double longitude1, double latitude2, double longitude2) {
        double latDelta = Math.toRadians(latitude2 - latitude1);
        double lonDelta = Math.toRadians(longitude2 - longitude1);
        double a = Math.sin(latDelta / 2) * Math.sin(latDelta / 2)
                + Math.cos(Math.toRadians(latitude1)) * Math.cos(Math.toRadians(latitude2))
                * Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }
}
