package com.example.sandalpunk.player;

import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import com.example.sandalpunk.auth.AuthenticatedUser;
import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.logging.AppEventType;
import com.example.sandalpunk.web.BadRequestException;
import com.example.sandalpunk.web.ConflictException;
import com.example.sandalpunk.web.NotFoundException;
import org.springframework.stereotype.Service;

@Service
public class PlayerService {

    private static final String BROWSER_DEMO_ID_PREFIX = "browser-demo-";
    private static final String BROWSER_DEMO_IDENTITY_PREFIX = "browser-demo:";

    private final PlayerRepository playerRepository;
    private final Clock clock;
    private final AppEventLogger appEventLogger;
    private final ConcurrentHashMap<String, PlayerProfile> browserDemoPlayers = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> browserDemoIdentityIndex = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> browserDemoNicknameIndex = new ConcurrentHashMap<>();

    public PlayerService(PlayerRepository playerRepository, Clock clock, AppEventLogger appEventLogger) {
        this.playerRepository = playerRepository;
        this.clock = clock;
        this.appEventLogger = appEventLogger;
    }

    public synchronized PlayerProfile createOrUpdate(AuthenticatedUser authenticatedUser) {
        if (isBrowserDemoIdentity(authenticatedUser.identityKey())) {
            return createOrUpdateBrowserDemo(authenticatedUser);
        }
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
                        null,
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

    public synchronized PlayerProfile registerNickname(String playerId, String nickname, String journalStyle) {
        String normalizedNickname = normalizeNickname(nickname);
        String normalizedJournalStyle = normalizeJournalStyle(journalStyle);
        if (isBrowserDemoPlayerId(playerId)) {
            PlayerProfile existingDemo = findBrowserDemoByNicknameKey(normalizedNickname).orElse(null);
            if (existingDemo != null && !existingDemo.getId().equals(playerId)) {
                throw new ConflictException("Ник уже занят");
            }
            PlayerProfile playerProfile = findRequiredById(playerId);
            playerProfile.setNickname(nickname.trim());
            playerProfile.setJournalStyle(normalizedJournalStyle);
            playerProfile.setUpdatedAt(clock.instant());
            saveBrowserDemo(playerProfile);
            appEventLogger.info(
                    AppEventType.PLAYER_UPDATED,
                    "Browser demo player nickname registered",
                    Map.of(
                            "playerId", playerProfile.getId(),
                            "nickname", playerProfile.getNickname(),
                            "journalStyle", playerProfile.getJournalStyle()
                    )
            );
            return playerProfile;
        }
        PlayerProfile existing = playerRepository.findByNicknameKey(normalizedNickname).orElse(null);
        if (existing != null && !existing.getId().equals(playerId)) {
            throw new ConflictException("Ник уже занят");
        }
        PlayerProfile playerProfile = findRequiredById(playerId);
        playerProfile.setNickname(nickname.trim());
        playerProfile.setJournalStyle(normalizedJournalStyle);
        playerProfile.setUpdatedAt(clock.instant());
        playerRepository.save(playerProfile);
        appEventLogger.info(
                AppEventType.PLAYER_UPDATED,
                "Player nickname registered",
                Map.of(
                        "playerId", playerProfile.getId(),
                        "nickname", playerProfile.getNickname(),
                        "journalStyle", playerProfile.getJournalStyle()
                )
        );
        return playerProfile;
    }

    public synchronized PlayerProfile touch(String playerId) {
        PlayerProfile playerProfile = findRequiredById(playerId);
        playerProfile.setUpdatedAt(clock.instant());
        return save(playerProfile);
    }

    public PlayerProfile findByNickname(String nickname) {
        return playerRepository.findByNicknameKey(normalizeNickname(nickname))
                .orElseThrow(() -> new NotFoundException("Игрок с таким ником не найден"));
    }

    public PlayerProfile findRequiredById(String playerId) {
        if (isBrowserDemoPlayerId(playerId)) {
            PlayerProfile browserDemoPlayer = browserDemoPlayers.get(playerId);
            if (browserDemoPlayer != null) {
                return browserDemoPlayer;
            }
        }
        return playerRepository.findById(playerId)
                .orElseThrow(() -> new NotFoundException("Player not found: " + playerId));
    }

    public synchronized void setActiveDuel(String playerId, String duelId) {
        PlayerProfile playerProfile = findRequiredById(playerId);
        playerProfile.setActiveDuelId(duelId);
        playerProfile.setUpdatedAt(clock.instant());
        save(playerProfile);
    }

    public synchronized void clearActiveDuel(String playerId) {
        PlayerProfile playerProfile = findRequiredById(playerId);
        playerProfile.setActiveDuelId(null);
        playerProfile.setUpdatedAt(clock.instant());
        save(playerProfile);
    }

    public synchronized void recordWin(String playerId) {
        PlayerProfile playerProfile = findRequiredById(playerId);
        playerProfile.incrementWins();
        playerProfile.setUpdatedAt(clock.instant());
        save(playerProfile);
    }

    public synchronized void rewardVictory(String playerId, int coins, int ratingDelta) {
        PlayerProfile playerProfile = findRequiredById(playerId);
        playerProfile.incrementWins();
        playerProfile.setCoins(playerProfile.getCoins() + Math.max(0, coins));
        playerProfile.addRating(ratingDelta);
        playerProfile.setUpdatedAt(clock.instant());
        save(playerProfile);
    }

    public synchronized void rewardDefeat(String playerId, int coins, int ratingDelta) {
        PlayerProfile playerProfile = findRequiredById(playerId);
        playerProfile.incrementLosses();
        playerProfile.setCoins(playerProfile.getCoins() + Math.max(0, coins));
        playerProfile.addRating(ratingDelta);
        playerProfile.setUpdatedAt(clock.instant());
        save(playerProfile);
    }

    public synchronized void rewardDraw(String playerId) {
        PlayerProfile playerProfile = findRequiredById(playerId);
        playerProfile.setUpdatedAt(clock.instant());
        save(playerProfile);
    }

    public synchronized void recordLoss(String playerId) {
        PlayerProfile playerProfile = findRequiredById(playerId);
        playerProfile.incrementLosses();
        playerProfile.setUpdatedAt(clock.instant());
        save(playerProfile);
    }

    private PlayerProfile createOrUpdateBrowserDemo(AuthenticatedUser authenticatedUser) {
        Instant now = clock.instant();
        String playerId = browserDemoIdentityIndex.get(authenticatedUser.identityKey());
        PlayerProfile playerProfile = playerId == null ? null : browserDemoPlayers.get(playerId);
        if (playerProfile == null) {
            playerProfile = new PlayerProfile(
                    BROWSER_DEMO_ID_PREFIX + UUID.randomUUID(),
                    authenticatedUser.identityKey(),
                    null,
                    authenticatedUser.username(),
                    null,
                    authenticatedUser.firstName(),
                    authenticatedUser.lastName(),
                    authenticatedUser.languageCode(),
                    null,
                    0,
                    0,
                    now,
                    now
            );
        }
        playerProfile.setUsername(authenticatedUser.username());
        playerProfile.setFirstName(authenticatedUser.firstName());
        playerProfile.setLastName(authenticatedUser.lastName());
        playerProfile.setLanguageCode(authenticatedUser.languageCode());
        playerProfile.setUpdatedAt(now);
        saveBrowserDemo(playerProfile);
        appEventLogger.info(
                AppEventType.PLAYER_UPDATED,
                "Browser demo player created or updated",
                Map.of(
                        "playerId", playerProfile.getId(),
                        "identityKey", playerProfile.getIdentityKey(),
                        "displayName", playerProfile.displayName()
                )
        );
        return playerProfile;
    }

    private PlayerProfile save(PlayerProfile playerProfile) {
        if (isBrowserDemoPlayer(playerProfile)) {
            return saveBrowserDemo(playerProfile);
        }
        return playerRepository.save(playerProfile);
    }

    private PlayerProfile saveBrowserDemo(PlayerProfile playerProfile) {
        browserDemoPlayers.put(playerProfile.getId(), playerProfile);
        browserDemoIdentityIndex.put(playerProfile.getIdentityKey(), playerProfile.getId());
        browserDemoNicknameIndex.entrySet().removeIf(entry -> entry.getValue().equals(playerProfile.getId()));
        if (playerProfile.getNickname() != null && !playerProfile.getNickname().isBlank()) {
            browserDemoNicknameIndex.put(normalizeNicknameKey(playerProfile.getNickname()), playerProfile.getId());
        }
        return playerProfile;
    }

    private java.util.Optional<PlayerProfile> findBrowserDemoByNicknameKey(String nicknameKey) {
        String playerId = browserDemoNicknameIndex.get(nicknameKey);
        return playerId == null ? java.util.Optional.empty() : java.util.Optional.ofNullable(browserDemoPlayers.get(playerId));
    }

    private boolean isBrowserDemoPlayer(PlayerProfile playerProfile) {
        return playerProfile != null
                && (isBrowserDemoPlayerId(playerProfile.getId()) || isBrowserDemoIdentity(playerProfile.getIdentityKey()));
    }

    private boolean isBrowserDemoPlayerId(String playerId) {
        return playerId != null && playerId.startsWith(BROWSER_DEMO_ID_PREFIX);
    }

    private boolean isBrowserDemoIdentity(String identityKey) {
        return identityKey != null && identityKey.startsWith(BROWSER_DEMO_IDENTITY_PREFIX);
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

    private String normalizeNicknameKey(String nickname) {
        return nickname.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeJournalStyle(String journalStyle) {
        if (journalStyle == null || journalStyle.isBlank()) {
            throw new BadRequestException("Выбери стиль дневника");
        }
        String normalized = journalStyle.trim().toUpperCase(Locale.ROOT);
        if (!normalized.equals("M") && !normalized.equals("W")) {
            throw new BadRequestException("Стиль дневника должен быть M или W");
        }
        return normalized;
    }
}
