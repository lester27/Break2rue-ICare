package com.icare.service;

import com.icare.model.UserHealthProfile;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserProfileStore {
    private UserHealthProfile currentProfile;

    public void save(UserHealthProfile profile) {
        this.currentProfile = profile;
    }

    public Optional<UserHealthProfile> load() {
        return Optional.ofNullable(currentProfile);
    }
}
