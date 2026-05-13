package com.omnicharge.user.config;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Collections;

@Configuration
public class GoogleOAuth2Config {

    @Value("${google.client-id}")
    private String googleClientId;

    @Bean
    public GoogleIdTokenVerifier googleIdTokenVerifier() {
        if (googleClientId == null || googleClientId.isEmpty() || googleClientId.equals("${google.client-id}")) {
             org.slf4j.LoggerFactory.getLogger(GoogleOAuth2Config.class)
                .error("[CONFIG-DIAGNOSTIC] Google Client ID is MISSING or default: {}", googleClientId);
        } else {
             org.slf4j.LoggerFactory.getLogger(GoogleOAuth2Config.class)
                .info("[CONFIG-DIAGNOSTIC] Initializing GoogleIdTokenVerifier with Client ID: {}...", 
                    googleClientId.substring(0, 10) + "****");
        }
        
        return new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }
}
