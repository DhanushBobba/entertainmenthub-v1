package com.entertainhub.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String appName,
        String appEnv,
        String apiPrefix,
        String supabaseUrl,
        String supabasePublishableKey,
        String supabaseSecretKey,
        String frontendUrl
) {}
