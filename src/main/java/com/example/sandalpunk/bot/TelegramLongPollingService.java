package com.example.sandalpunk.bot;

import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import com.example.sandalpunk.config.ApplicationProperties;
import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.logging.AppEventType;
import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Service;

@Service
public class TelegramLongPollingService implements SmartLifecycle {
    private static final String WEB_APP_BUILD = "20260421-4";

    private final ApplicationProperties applicationProperties;
    private final TelegramBotClient telegramBotClient;
    private final AppEventLogger appEventLogger;

    private volatile boolean running;
    private ExecutorService executorService;
    private long offset = 0L;

    public TelegramLongPollingService(
            ApplicationProperties applicationProperties,
            TelegramBotClient telegramBotClient,
            AppEventLogger appEventLogger
    ) {
        this.applicationProperties = applicationProperties;
        this.telegramBotClient = telegramBotClient;
        this.appEventLogger = appEventLogger;
    }

    @Override
    public void start() {
        if (!applicationProperties.getBot().isEnabled() || running) {
            return;
        }
        try {
            telegramBotClient.deleteWebhook(false);
            TelegramBotClient.TelegramBotIdentity botIdentity = telegramBotClient.getMe();
            appEventLogger.info(
                    AppEventType.BOT_STARTUP,
                    "Telegram bot connectivity confirmed",
                    Map.of(
                            "botId", botIdentity != null ? botIdentity.id() : 0L,
                            "botUsername", botIdentity != null ? botIdentity.username() : applicationProperties.getBot().getUsername()
                    )
            );
        } catch (Exception exception) {
            appEventLogger.error("Telegram bot startup handshake failed", exception);
        }
        running = true;
        executorService = Executors.newSingleThreadExecutor(runnable -> {
            Thread thread = new Thread(runnable, "telegram-long-polling");
            thread.setDaemon(true);
            return thread;
        });
        executorService.submit(this::pollLoop);
        appEventLogger.info(
                AppEventType.BOT_STARTUP,
                "Telegram long polling bot started",
                Map.of(
                        "botUsername", applicationProperties.getBot().getUsername(),
                        "baseUrl", applicationProperties.getBaseUrl()
                )
        );
    }

    @Override
    public void stop() {
        running = false;
        if (executorService != null) {
            executorService.shutdownNow();
            try {
                executorService.awaitTermination(5, TimeUnit.SECONDS);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            }
        }
    }

    @Override
    public boolean isRunning() {
        return running;
    }

    @Override
    public boolean isAutoStartup() {
        return true;
    }

    private void pollLoop() {
        while (running) {
            try {
                for (TelegramBotClient.TelegramUpdate update : telegramBotClient.getUpdates(offset + 1, 25)) {
                    offset = Math.max(offset, update.updateId());
                    try {
                        handle(update);
                    } catch (Exception exception) {
                        appEventLogger.error("Telegram update handling failed", exception);
                    }
                }
            } catch (Exception exception) {
                appEventLogger.error("Telegram long polling failed", exception);
                sleepQuietly(5000L);
            }
        }
    }

    private void handle(TelegramBotClient.TelegramUpdate update) {
        TelegramBotClient.TelegramMessage message = update.message();
        if (message == null || message.text() == null || message.chat() == null) {
            return;
        }
        if (message.text().trim().startsWith("/start")) {
            appEventLogger.info(
                    AppEventType.BOT_START_COMMAND,
                    "Telegram /start received",
                    Map.of(
                            "telegramUserId", message.from() != null ? message.from().id() : 0L,
                            "chatId", message.chat().id()
                    )
            );
            try {
                telegramBotClient.sendWelcomeMessage(message.chat().id(), webAppUrl());
            } catch (Exception exception) {
                appEventLogger.error("Telegram /start welcome message failed", exception);
                try {
                    telegramBotClient.sendPlainMessage(
                            message.chat().id(),
                            "Mini App временно открылся в запасном режиме.\nОткрой duel вручную: " + webAppUrl()
                    );
                } catch (Exception fallbackException) {
                    appEventLogger.error("Telegram /start fallback message failed", fallbackException);
                }
            }
        }
    }

    private String webAppUrl() {
        String baseUrl = applicationProperties.getBaseUrl();
        if (baseUrl.endsWith("/")) {
            return baseUrl + "duel?build=" + WEB_APP_BUILD;
        }
        return baseUrl + "/duel?build=" + WEB_APP_BUILD;
    }

    private void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }
}
