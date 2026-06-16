package com.example.sandalpunk.bot;

import java.util.List;

import com.example.sandalpunk.config.ApplicationProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class TelegramBotClient {

    private final RestClient restClient;
    private final ApplicationProperties applicationProperties;

    public TelegramBotClient(RestClient telegramRestClient, ApplicationProperties applicationProperties) {
        this.restClient = telegramRestClient;
        this.applicationProperties = applicationProperties;
    }

    public List<TelegramUpdate> getUpdates(long offset, int timeoutSeconds) {
        GetUpdatesResponse response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path(botPath("/getUpdates"))
                        .queryParam("offset", offset)
                        .queryParam("timeout", timeoutSeconds)
                        .build())
                .retrieve()
                .body(GetUpdatesResponse.class);
        return response == null || response.result() == null ? List.of() : response.result();
    }

    public void deleteWebhook(boolean dropPendingUpdates) {
        restClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path(botPath("/deleteWebhook"))
                        .queryParam("drop_pending_updates", dropPendingUpdates)
                        .build())
                .retrieve()
                .toBodilessEntity();
    }

    public TelegramBotIdentity getMe() {
        GetMeResponse response = restClient.get()
                .uri(botPath("/getMe"))
                .retrieve()
                .body(GetMeResponse.class);
        return response == null ? null : response.result();
    }

    public void sendWelcomeMessage(long chatId, String webAppUrl) {
        SendMessageRequest request = new SendMessageRequest(
                chatId,
                "Ты у края топи. База еще держится, но припасы не бесконечны. "
                        + "Открой дневник, выйди наружу и реши сам: идти скрытно или перестать скрываться.",
                new ReplyMarkup(List.of(List.of(new InlineKeyboardButton("Открыть топь", new WebAppInfo(webAppUrl)))))
        );
        restClient.post()
                .uri(botPath("/sendMessage"))
                .body(request)
                .retrieve()
                .toBodilessEntity();
    }

    public void sendPlainMessage(long chatId, String text) {
        SendMessageRequest request = new SendMessageRequest(chatId, text, null);
        restClient.post()
                .uri(botPath("/sendMessage"))
                .body(request)
                .retrieve()
                .toBodilessEntity();
    }

    private String botPath(String methodPath) {
        return "/bot" + applicationProperties.getBot().getToken() + methodPath;
    }

    public record GetUpdatesResponse(
            boolean ok,
            List<TelegramUpdate> result
    ) {
    }

    public record GetMeResponse(
            boolean ok,
            TelegramBotIdentity result
    ) {
    }

    public record TelegramBotIdentity(
            long id,
            @JsonProperty("first_name")
            String firstName,
            String username
    ) {
    }

    public record TelegramUpdate(
            @JsonProperty("update_id")
            long updateId,
            TelegramMessage message
    ) {
    }

    public record TelegramMessage(
            @JsonProperty("message_id")
            long messageId,
            TelegramChat chat,
            TelegramUser from,
            String text
    ) {
    }

    public record TelegramChat(
            long id
    ) {
    }

    public record TelegramUser(
            long id,
            @JsonProperty("first_name")
            String firstName,
            String username
    ) {
    }

    public record SendMessageRequest(
            @JsonProperty("chat_id")
            long chatId,
            String text,
            @JsonProperty("reply_markup")
            ReplyMarkup replyMarkup
    ) {
    }

    public record ReplyMarkup(
            @JsonProperty("inline_keyboard")
            List<List<InlineKeyboardButton>> inlineKeyboard
    ) {
    }

    public record InlineKeyboardButton(
            String text,
            @JsonProperty("web_app")
            WebAppInfo webApp
    ) {
    }

    public record WebAppInfo(
            String url
    ) {
    }
}
