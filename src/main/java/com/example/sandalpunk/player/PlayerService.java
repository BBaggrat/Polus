package com.example.sandalpunk.player;

import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import com.example.sandalpunk.auth.AuthenticatedUser;
import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.logging.AppEventType;
import com.example.sandalpunk.web.BadRequestException;
import com.example.sandalpunk.web.ConflictException;
import com.example.sandalpunk.web.NotFoundException;
import org.springframework.stereotype.Service;

@Service
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final Clock clock;
    private final AppEventLogger appEventLogger;

    public PlayerService(PlayerRepository playerRepository, Clock clock, AppEventLogger appEventLogger) {
        this.playerRepository = playerRepository;
        this.clock = clock;
        this.appEventLogger = appEventLogger;
    }

    public synchronized PlayerProfile createOrUpdate(AuthenticatedUser authenticatedUser) {
        Instant now = clock.instant();
        PlayerProfile playerProfile = playerRepository.findByIdentityKey(authenticatedUser.identityKey())
                .orElseGet(() -> new PlayerProfile(
                        UUID.randomUUID().toString(),
                        authenticatedUser.identityKey(),
                        authenticatedUser.telegramUserId(),
                        authenticatedUser.username(),
                        null,
                        authenticatedUser.firstName(),
                        authenticatedUser.lastName(),
                        authenticatedUser.languageCode(),
                        0,
                        0,
                        0,
                        0,
                        0,
                        now,
                        now
                ));
        playerProfile.setTelegramUserId(authenticatedUser.telegramUserId());
        playerProfile.setUsername(authenticatedUser.username());
        playerProfile.setFirstName(authenticatedUser.firstName());
        playerProfile.setLastName(authenticatedUser.lastName());
        playerProfile.setLanguageCode(authenticatedUser.languageCode());
        playerProfile.setUpdatedAt(now);
        playerRepository.save(playerProfile);
        appEventLogger.info(
                AppEventType.PLAYER_UPDATED,
                "Player created or updated",
                Map.of(
                        "playerId", playerProfile.getId(),
                        "identityKey", playerProfile.getIdentityKey(),
                        "displayName", playerProfile.displayName()
                )
        );
        return playerProfile;
    }

    public synchronized PlayerProfile registerNickname(String playerId, String nickname) {
        String normalizedNickname = normalizeNickname(nickname);
        PlayerProfile existing = playerRepository.findByNicknameKey(normalizedNickname).orElse(null);
        if (existing != null && !existing.getId().equals(playerId)) {
            throw new ConflictException("Ник уже занят");
        }
        PlayerProfile playerProfile = findRequiredById(playerId);
        playerProfile.setNickname(nickname.trim());
        playerProfile.setUpdatedAt(clock.instant());
        playerRepository.save(playerProfile);
        appEventLogger.info(
                AppEventType.PLAYER_UPDATED,
                "Player nickname registered",
                Map.of(
                        "playerId", playerProfile.getId(),
                        "nickname", playerProfile.getNickname()
                )
        );
        return playerProfile;
    }

    public synchronized PlayerProfile allocateStat(String playerId, PlayerStat stat) {
        PlayerProfile playerProfile = findRequiredById(playerId);
        if (playerProfile.getAvailableStatPoints() <= 0) {
            throw new ConflictException("Нет свободных очков характеристик");
        }
        playerProfile.incrementStat(stat);
        playerProfile.setUpdatedAt(clock.instant());
        playerRepository.save(playerProfile);
        appEventLogger.info(
                AppEventType.PLAYER_UPDATED,
                "Player stat allocated",
                Map.of(
                        "playerId", playerProfile.getId(),
                        "stat", stat.name()
                )
        );
        return playerProfile;
    }

    public synchronized PlayerProfile touch(String playerId) {
        PlayerProfile playerProfile = findRequiredById(playerId);
        playerProfile.setUpdatedAt(clock.instant());
        return playerRepository.save(playerProfile);
    }

    public PlayerProfile findByNickname(String nickname) {
        return playerRepository.findByNicknameKey(normalizeNickname(nickname))
                .orElseThrow(() -> new NotFoundException("Игрок с таким ником не найден"));
    }

    public PlayerProfile findRequiredById(String playerId) {
        return playerRepository.findById(playerId)
                .orElseThrow(() -> new NotFoundException("Player not found: " + playerId));
    }

    public synchronized void setActiveDuel(String playerId, String duelId) {
        PlayerProfile playerProfile = findRequiredById(playerId);
        playerProfile.setActiveDuelId(duelId);
        playerProfile.setUpdatedAt(clock.instant());
        playerRepository.save(playerProfile);
    }

    public synchronized void clearActiveDuel(String playerId) {
        PlayerProfile playerProfile = findRequiredById(playerId);
        playerProfile.setActiveDuelId(null);
        playerProfile.setUpdatedAt(clock.instant());
        playerRepository.save(playerProfile);
    }

    public synchronized void recordWin(String playerId) {
        PlayerProfile playerProfile = findRequiredById(playerId);
        playerProfile.incrementWins();
        playerProfile.setUpdatedAt(clock.instant());
        playerRepository.save(playerProfile);
    }

    public synchronized void rewardVictory(String playerId, int coins, int experience) {
        PlayerProfile playerProfile = findRequiredById(playerId);
        playerProfile.incrementWins();
        playerProfile.setCoins(playerProfile.getCoins() + Math.max(0, coins));
        playerProfile.addExperience(Math.max(0, experience));
        playerProfile.setUpdatedAt(clock.instant());
        playerRepository.save(playerProfile);
    }

    public synchronized void rewardDefeat(String playerId, int experience) {
        PlayerProfile playerProfile = findRequiredById(playerId);
        playerProfile.incrementLosses();
        playerProfile.addExperience(Math.max(0, experience));
        playerProfile.setUpdatedAt(clock.instant());
        playerRepository.save(playerProfile);
    }

    public synchronized void rewardDraw(String playerId, int experience) {
        PlayerProfile playerProfile = findRequiredById(playerId);
        playerProfile.addExperience(Math.max(0, experience));
        playerProfile.setUpdatedAt(clock.instant());
        playerRepository.save(playerProfile);
    }

    public synchronized void recordLoss(String playerId) {
        PlayerProfile playerProfile = findRequiredById(playerId);
        playerProfile.incrementLosses();
        playerProfile.setUpdatedAt(clock.instant());
        playerRepository.save(playerProfile);
    }

    private String normalizeNickname(String nickname) {
        if (nickname == null || nickname.isBlank()) {
            throw new BadRequestException("Ник обязателен");
        }
        String trimmed = nickname.trim();
        if (trimmed.length() < 3 || trimmed.length() > 20) {
            throw new BadRequestException("Ник должен быть длиной от 3 до 20 символов");
        }
        if (!trimmed.matches("[\\p{L}\\p{N}_\\-]+")) {
            throw new BadRequestException("Ник может содержать только буквы, цифры, _ и -");
        }
        return trimmed.toLowerCase(Locale.ROOT);
    }
}
