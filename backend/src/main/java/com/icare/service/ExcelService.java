package com.icare.service;

import com.icare.model.Doctor;
import com.icare.model.Hospital;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ExcelService {

    private static final String HOSPITALS_RESOURCE = "data/Hospital_DB.xlsx";
    private static final String REFERENCE_SHEET_NAME = "Reference Table";

    private List<Hospital> hospitals = Collections.emptyList();
    private Map<String, List<Doctor>> doctorsByReferenceKey = Collections.emptyMap();

    @PostConstruct
    public void init() {
        this.hospitals = loadHospitals();
    }

    public List<Hospital> getHospitals() {
        return new ArrayList<>(hospitals);
    }

    public Optional<Hospital> findHospitalById(String hospitalId) {
        if (hospitalId == null) {
            return Optional.empty();
        }
        return hospitals.stream()
                .filter(hospital -> hospitalId.equals(hospital.getId()) ||
                        (hospital.getNumericId() != null && hospitalId.equals(String.valueOf(hospital.getNumericId()))))
                .findFirst();
    }

    public Optional<Hospital> findHospitalByNumericId(int numericId) {
        return hospitals.stream()
                .filter(hospital -> hospital.getNumericId() != null && hospital.getNumericId() == numericId)
                .findFirst();
    }

    public List<Doctor> findDoctorsByHospitalNumericId(int numericId) {
        return findHospitalByNumericId(numericId)
                .map(Hospital::getDoctors)
                .orElse(Collections.emptyList());
    }

    private List<Hospital> loadHospitals() {
        try (InputStream stream = new ClassPathResource(HOSPITALS_RESOURCE).getInputStream();
             Workbook workbook = new XSSFWorkbook(stream)) {

            Map<String, Sheet> sheets = buildSheetMap(workbook);
            Sheet referenceSheet = findReferenceSheet(sheets);
            if (referenceSheet == null) {
                return Collections.emptyList();
            }

            Map<String, List<Doctor>> doctorsByReference = loadDoctorSheets(sheets);
            this.doctorsByReferenceKey = doctorsByReference;

            List<Hospital> loaded = loadReferenceTable(referenceSheet, doctorsByReference);
            return loaded;
        } catch (IOException exception) {
            return Collections.emptyList();
        }
    }

    private Map<String, Sheet> buildSheetMap(Workbook workbook) {
        Map<String, Sheet> map = new HashMap<>();
        for (int index = 0; index < workbook.getNumberOfSheets(); index++) {
            Sheet sheet = workbook.getSheetAt(index);
            if (sheet != null) {
                map.put(sheet.getSheetName().trim(), sheet);
            }
        }
        return map;
    }

    private Sheet findReferenceSheet(Map<String, Sheet> sheets) {
        if (sheets.containsKey(REFERENCE_SHEET_NAME)) {
            return sheets.get(REFERENCE_SHEET_NAME);
        }
        for (Sheet sheet : sheets.values()) {
            Row headerRow = sheet.getRow(0);
            if (headerRow != null) {
                String header = normalizeHeader(safeString(headerRow.getCell(0)));
                if (header.contains("nameofhealthcarefacility") || header.contains("healthcarefacility")) {
                    return sheet;
                }
            }
        }
        return null;
    }

    private List<Hospital> loadReferenceTable(Sheet sheet, Map<String, List<Doctor>> doctorsByReference) {
        Row headerRow = sheet.getRow(0);
        List<String> headers = buildHeaderNames(headerRow);
        List<Hospital> loaded = new ArrayList<>();

        for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row == null) {
                continue;
            }
            Hospital hospital = parseReferenceRow(row, headers, rowIndex, doctorsByReference);
            if (hospital != null) {
                loaded.add(hospital);
            }
        }
        return loaded;
    }

    private Hospital parseReferenceRow(Row row, List<String> headers, int rowIndex, Map<String, List<Doctor>> doctorsByReference) {
        if (isReferenceRowEmpty(row)) {
            return null;
        }

        String referenceKey = safeString(row.getCell(getColumnIndex(headers, "referencekey", 5)));
        String name = safeString(row.getCell(getColumnIndex(headers, "nameofhealthcarefacility", 0)));
        if (name.isEmpty()) {
            name = safeString(row.getCell(getColumnIndex(headers, "name", 0)));
        }
        // Skip rows with no hospital name
        if (name.isEmpty()) {
            return null;
        }

        String type = safeString(row.getCell(getColumnIndex(headers, "type", 1)));
        String level = safeString(row.getCell(getColumnIndex(headers, "level", 2)));
        double latitude = safeDouble(row.getCell(getColumnIndex(headers, "latitude", 3)));
        double longitude = safeDouble(row.getCell(getColumnIndex(headers, "longitude", 4)));
        String address = safeString(row.getCell(getColumnIndex(headers, "address", 2)));

        // Skip rows with no valid coordinates — they cannot be placed on the map
        if (latitude == 0.0 && longitude == 0.0) {
            return null;
        }

        List<String> services = Collections.emptyList();

        Hospital hospital = new Hospital(referenceKey.isEmpty() ? String.valueOf(rowIndex) : referenceKey,
                name,
                address,
                latitude,
                longitude,
                services,
                "",
                "",
                "",
                referenceKey,
                level);
        hospital.setNumericId(rowIndex);

        List<Doctor> doctors = doctorsByReference.getOrDefault(referenceKey, Collections.emptyList());
        hospital.setDoctors(doctors);
        hospital.setServices(buildHospitalServices(doctors, type));

        return hospital;
    }

    private List<String> buildHospitalServices(List<Doctor> doctors, String hospitalType) {
        if (doctors == null || doctors.isEmpty()) {
            return Collections.singletonList(hospitalType != null && !hospitalType.isBlank() ? hospitalType : "General");
        }
        return doctors.stream()
                .map(Doctor::getDepartment)
                .filter(dep -> dep != null && !dep.isBlank())
                .map(String::trim)
                .distinct()
                .collect(Collectors.toList());
    }

    private boolean isReferenceRowEmpty(Row row) {
        if (row == null) {
            return true;
        }
        short lastCell = row.getLastCellNum();
        if (lastCell < 0) {
            return true;
        }
        for (int i = 0; i < lastCell; i++) {
            if (!safeString(row.getCell(i)).isBlank()) {
                return false;
            }
        }
        return true;
    }

    private Map<String, List<Doctor>> loadDoctorSheets(Map<String, Sheet> sheets) {
        Map<String, List<Doctor>> doctorsByReference = new HashMap<>();
        for (Map.Entry<String, Sheet> entry : sheets.entrySet()) {
            String sheetName = entry.getKey();
            Sheet sheet = entry.getValue();
            if (sheetName.equalsIgnoreCase(REFERENCE_SHEET_NAME)) {
                continue;
            }
            if (isDoctorSheet(sheet)) {
                List<Doctor> doctors = parseDoctorSheet(sheet);
                if (!doctors.isEmpty()) {
                    doctorsByReference.put(sheetName, doctors);
                }
            }
        }
        return doctorsByReference;
    }

    private boolean isDoctorSheet(Sheet sheet) {
        Row headerRow = sheet.getRow(0);
        if (headerRow == null) {
            return false;
        }
        String firstCell = normalizeHeader(safeString(headerRow.getCell(0)));
        return firstCell.contains("nameofdoctor") || firstCell.contains("doctor");
    }

    private List<Doctor> parseDoctorSheet(Sheet sheet) {
        Row headerRow = sheet.getRow(0);
        List<String> headers = buildHeaderNames(headerRow);
        List<Doctor> doctors = new ArrayList<>();

        for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row == null) {
                continue;
            }
            String name = safeString(row.getCell(getColumnIndex(headers, "nameofdoctor", 0)));
            if (name.isBlank()) {
                continue;
            }

            Doctor doctor = new Doctor();
            doctor.setId(generateDoctorId(sheet.getSheetName(), name, safeString(row.getCell(getColumnIndex(headers, "department", 2)))));
            doctor.setName(name);
            doctor.setType(safeString(row.getCell(getColumnIndex(headers, "typeofdoctor", 1))));
            doctor.setDepartment(safeString(row.getCell(getColumnIndex(headers, "department", 2))));
            String otherSpecializations = safeString(row.getCell(getColumnIndex(headers, "otherspecializations", 3)));
            doctor.setSchedule(safeString(row.getCell(getColumnIndex(headers, "schedule", 4))));
            doctor.setPriceRange(safeString(row.getCell(getColumnIndex(headers, "price", 7))));
            doctor.setHmos(parseHmos(row.getCell(getColumnIndex(headers, "hmos", 6))));
            doctor.setContact(safeString(row.getCell(getColumnIndex(headers, "contactnumber", 9))));
            doctor.setSecretary(safeString(row.getCell(getColumnIndex(headers, "medicalsecretary", 8))));
            doctor.setTags(buildDoctorTags(doctor.getDepartment(), otherSpecializations, doctor.getType()));

            doctor.setType(doctor.getType().isBlank() ? "General Practitioner" : doctor.getType());
            doctors.add(doctor);
        }

        return doctors;
    }

    private int generateDoctorId(String sheetName, String name, String department) {
        return Math.abs(Objects.hash(sheetName, name, department));
    }

    private List<String> buildDoctorTags(String department, String specializations, String type) {
        List<String> tags = new ArrayList<>();
        if (department != null && !department.isBlank()) {
            tags.addAll(Arrays.stream(department.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .map(this::normalizeTag)
                    .collect(Collectors.toList()));
        }
        if (specializations != null && !specializations.isBlank()) {
            tags.addAll(Arrays.stream(specializations.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .map(this::normalizeTag)
                    .collect(Collectors.toList()));
        }
        if (type != null && !type.isBlank()) {
            tags.add(normalizeTag(type));
        }
        if (tags.isEmpty()) {
            tags.add("general");
        }
        return tags.stream().distinct().collect(Collectors.toList());
    }

    private String normalizeTag(String value) {
        return value.trim().toLowerCase(Locale.ENGLISH).replaceAll("[^a-z0-9]+", "-");
    }

    private int getColumnIndex(List<String> headers, String fieldName, int fallbackIndex) {
        int index = headers.indexOf(fieldName);
        return index >= 0 ? index : fallbackIndex;
    }

    private List<String> buildHeaderNames(Row headerRow) {
        if (headerRow == null) {
            return Collections.emptyList();
        }
        List<String> headers = new ArrayList<>();
        for (int cellIndex = 0; cellIndex < headerRow.getLastCellNum(); cellIndex++) {
            headers.add(normalizeHeader(safeString(headerRow.getCell(cellIndex))));
        }
        return headers;
    }

    private String normalizeHeader(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.toLowerCase(Locale.ENGLISH)
                .replace(" ", "")
                .replace("_", "")
                .replace("-", "");
    }

    private String safeString(Cell cell) {
        if (cell == null) {
            return "";
        }
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                return String.valueOf(cell.getNumericCellValue()).trim();
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue()).trim();
            default:
                return "";
        }
    }

    private double safeDouble(Cell cell) {
        if (cell == null) {
            return 0.0; // missing cell — caller will skip rows with 0.0 lat/lng
        }
        if (cell.getCellType() == org.apache.poi.ss.usermodel.CellType.NUMERIC) {
            return cell.getNumericCellValue();
        }
        String text = safeString(cell);
        if (text.isEmpty()) {
            return 0.0;
        }
        try {
            return Double.parseDouble(text);
        } catch (NumberFormatException e) {
            return 0.0; // unparseable — treat as missing
        }
    }

    private List<String> parseHmos(Cell hmosCell) {
        String raw = safeString(hmosCell);
        if (raw.isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .collect(Collectors.toList());
    }
}
