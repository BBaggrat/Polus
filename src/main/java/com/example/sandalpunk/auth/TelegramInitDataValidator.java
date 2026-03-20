package com.example.sandalpunk.auth;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import com.example.sandalpunk.web.BadRequestException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public class TelegramInitDataValidator {

    private final ObjectMapper objectMapper;

    public TelegramInitDataValidator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public AuthenticatedUser parseAndValidate(String initData, String botToken, boolean validateSignature) {
        Map<String, String> values = parseInitData(initData);
        if (validateSignature) {
            validateHash(values, botToken);
        }
        String userJson = values.get("user");
        if (userJson == null || userJson.isBlank()) {
            throw new BadRequestException("Telegram initData does not contain a user payload");
        }
        try {
            JsonNode userNode = objectMapper.readTree(userJson);
            Long telegramUserId = userNode.hasNonNull("id") ? userNode.get("id").asLong() : null;
            if (telegramUserId == null) {
                throw new BadRequestException("Telegram initData is missing user.id");
            }
            String username = text(userNode, "username");
            String firstName = text(userNode, "first_name");
            String lastName = text(userNode, "last_name");
            String languageCode = text(userNode, "language_code");
            return new AuthenticatedUser(
                    "tg:" + telegramUserId,
                    telegramUserId,
                    username,
                    firstName,
                    lastName,
                    languageCode,
                    validateSignature,
                    true
            );
        } catch (BadRequestException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BadRequestException("Failed to parse Telegram initData user payload");
        }
    }

    private Map<String, String> parseInitData(String initData) {
        if (initData == null || initData.isBlank()) {
            throw new BadRequestException("initData is required");
        }
        return Arrays.stream(initData.split("&"))
                .map(part -> part.split("=", 2))
                .collect(Collectors.toMap(
                        pair -> decode(pair[0]),
                        pair -> pair.length > 1 ? decode(pair[1]) : "",
                        (left, right) -> right,
                        LinkedHashMap::new
                ));
    }

    private void validateHash(Map<String, String> values, String botToken) {
        String providedHash = values.remove("hash");
        if (providedHash == null || providedHash.isBlank()) {
            throw new BadRequestException("Telegram initData is missing hash");
        }
        String dataCheckString = values.entrySet()
                .stream()
                .sorted(Comparator.comparing(Map.Entry::getKey))
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .collect(Collectors.joining("\n"));
        String computedHash = hmacSha256Hex(secretKey(botToken), dataCheckString);
        if (!providedHash.equalsIgnoreCase(computedHash)) {
            throw new BadRequestException("Telegram initData signature validation failed");
        }
    }

    private byte[] secretKey(String botToken) {
        return hmacSha256("WebAppData".getBytes(StandardCharsets.UTF_8), botToken.getBytes(StandardCharsets.UTF_8));
    }

    private byte[] hmacSha256(byte[] key, byte[] message) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(message);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to calculate HMAC", exception);
        }
    }

    private String hmacSha256Hex(byte[] key, String message) {
        byte[] bytes = hmacSha256(key, message.getBytes(StandardCharsets.UTF_8));
        StringBuilder builder = new StringBuilder();
        for (byte current : bytes) {
            builder.append(String.format("%02x", current & 0xff));
        }
        return builder.toString();
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private String text(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
