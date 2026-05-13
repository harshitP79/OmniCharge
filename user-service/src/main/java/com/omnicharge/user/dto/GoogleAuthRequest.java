package com.omnicharge.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoogleAuthRequest {

    @NotBlank(message = "Token is required")
    @com.fasterxml.jackson.annotation.JsonProperty("token")
    @com.fasterxml.jackson.annotation.JsonAlias("idToken")
    private String token;
}
