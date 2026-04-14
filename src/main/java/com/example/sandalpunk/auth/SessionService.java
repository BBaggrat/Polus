package com.example.sandalpunk.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import com.example.sandalpunk.config.ApplicationProperties;
import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.logging.AppEventType;
import com.example.sandalpunk.player.PlayerProfile;
import com.example.sandalpunk.player.PlayerResponse;
import com.example.sandalpunk.player.RegisterPlayerRequest;
import com.example.sandalpunk.player.PlayerService;
import com.example.sandalpunk.web.BadRequestException;
import com.example.sandalpunk.web.UnauthorizedException;
import org.springframework.stereotype.Service;

@Service
public class SessionService {

    private static final Duration SESSION_TTL = Duration.ofDays(30);

    private final SessionRepository sessionRepository;
    private final PlayerService playerService;
    private final TelegramInitDataValidator telegramInitDataValidator;
    private final ApplicationProperties applicationProperties;
    private final Clock clock;
    private final AppEventLogger appEventLogger;

    public SessionService(
            SessionRepository sessionRepository,
            PlayerService playerService,
            TelegramInitDataValidator telegramInitDataValidator,
            ApplicationProperties applicationProperties,
            Clock clock,
            AppEventLogger appEventLogger
    ) {
        this.sessionRepository = sessionRepository;
        this.playerService = playerService;
        this.telegramInitDataValidator = telegramInitDataValidator;
        this.applicationProperties = applicationProperties;
        this.clock = clock;
        this.appEventLogger = appEventLogger;
    }

    public SessionResponse createSession(SessionRequest request) {
        AuthenticatedUser authenticatedUser = resolveUser(request);
        PlayerProfile playerProfile = playerService.createOrUpdate(authenticatedUser);
        Instant now = clock.instant();
        PlayerSession session = new PlayerSession(
                UUID.randomUUID().toString(),
                playerProfile.getId(),
                now,
                now.plus(SESSION_TTL)
        );
        sessionRepository.save(session);
        appEventLogger.info(
                AppEventType.PLAYER_SESSION,
                "Player session created",
                Map.of(
                        "playerId", playerProfile.getId(),
                        "verified", authenticatedUser.verified(),
                        "telegramUser", authenticatedUser.telegramUser()
                )
        );
        return new SessionResponse(session.getToken(), PlayerResponse.from(playerProfile));
    }

    public PlayerProfile requirePlayer(String sessionToken) {
        if (sessionToken == null || sessionToken.isBlank()) {
            throw new UnauthorizedException("X-Session-Token header is required");
        }
        PlayerSession session = sessionRepository.findByToken(sessionToken)
                .orElseThrow(() -> new UnauthorizedException("Session not found"));
        if (session.isExpired(clock.instant())) {
            sessionRepository.deleteByToken(sessionToken);
            throw new UnauthorizedException("Session expired");
        }
        return playerService.touch(session.getPlayerId());
    }

    public PlayerResponse registerNickname(String sessionToken, RegisterPlayerRequest request) {
        if (request == null) {
            throw new BadRequestException("Registration request body is required");
        }
        PlayerProfile playerProfile = requirePlayer(sessionToken);
        return PlayerResponse.from(playerService.registerNickname(playerProfile.getId(), request.nickname(), request.journalStyle()));
    }

    private AuthenticatedUser resolveUser(SessionRequest request) {
        if (request == null) {
            throw new BadRequestException("Session request body is required");
        }
        String initData = request.initData();
        if (initData != null && !initData.isBlank()) {
            boolean validateSignature = applicationProperties.getBot().getToken() != null
                    && !applicationProperties.getBot().getToken().isBlank();
            return telegramInitDataValidator.parseAndValidate(
                    initData,
                    applicationProperties.getBot().getToken(),
                    validateSignature
            );
        }
        if (!applicationProperties.isAllowDevSessions()) {
            throw new UnauthorizedException("Telegram initData is required");
        }
        AuthUserPayload fallbackUser = request.fallbackUser();
        String guestId = fallbackUser != null && fallbackUser.guestId() != null && !fallbackUser.guestId().isBlank()
                ? fallbackUser.guestId()
                : UUID.randomUUID().toString();
        String username = fallbackUser != null ? fallbackUser.username() : null;
        String firstName = fallbackUser != null ? fallbackUser.firstName() : "Guest";
        String lastName = fallbackUser != null ? fallbackUser.lastName() : null;
        String languageCode = fallbackUser != null ? fallbackUser.languageCode() : null;
        return new AuthenticatedUser(
                "guest:" + guestId,
                fallbackUser != null ? fallbackUser.telegramUserId() : null,
                username,
                firstName,
                lastName,
                languageCode,
                false,
                false
        );
    }
}
