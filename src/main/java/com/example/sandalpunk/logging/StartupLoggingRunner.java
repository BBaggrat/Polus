package com.example.sandalpunk.logging;

import java.util.Map;

import com.example.sandalpunk.config.ApplicationProperties;
import com.example.sandalpunk.config.DuelBalanceProperties;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class StartupLoggingRunner implements ApplicationRunner {

    private final ApplicationProperties applicationProperties;
    private final AppEventLogger appEventLogger;
    private final DuelBalanceProperties balance;

    public StartupLoggingRunner(
            ApplicationProperties applicationProperties,
            AppEventLogger appEventLogger,
            DuelBalanceProperties balance
    ) {
        this.applicationProperties = applicationProperties;
        this.appEventLogger = appEventLogger;
        this.balance = balance;
    }

    @Override
    public void run(ApplicationArguments args) {
        appEventLogger.info(
                AppEventType.APP_STARTUP,
                "Application started",
                Map.of(
                        "appName", applicationProperties.getName(),
                        "version", applicationProperties.getVersion(),
                        "baseUrl", applicationProperties.getBaseUrl(),
                        "storage", applicationProperties.getStorage(),
                        "balanceVersion", balance.getBalanceVersion()
                )
        );
    }
}

