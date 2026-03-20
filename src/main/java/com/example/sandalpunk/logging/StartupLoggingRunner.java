package com.example.sandalpunk.logging;

import java.util.Map;

import com.example.sandalpunk.config.ApplicationProperties;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class StartupLoggingRunner implements ApplicationRunner {

    private final ApplicationProperties applicationProperties;
    private final AppEventLogger appEventLogger;

    public StartupLoggingRunner(ApplicationProperties applicationProperties, AppEventLogger appEventLogger) {
        this.applicationProperties = applicationProperties;
        this.appEventLogger = appEventLogger;
    }

    @Override
    public void run(ApplicationArguments args) {
        appEventLogger.info(
                AppEventType.APP_STARTUP,
                "Application started",
                Map.of(
                        "appName", applicationProperties.getName(),
                        "baseUrl", applicationProperties.getBaseUrl(),
                        "storage", applicationProperties.getStorage()
                )
        );
    }
}

