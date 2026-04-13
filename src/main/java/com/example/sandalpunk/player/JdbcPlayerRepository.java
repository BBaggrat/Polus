package com.example.sandalpunk.player;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;

import jakarta.annotation.PostConstruct;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
@ConditionalOnProperty(name = "app.storage", havingValue = "jdbc", matchIfMissing = true)
public class JdbcPlayerRepository implements PlayerRepository {

    private static final RowMapper<PlayerProfile> PLAYER_ROW_MAPPER = JdbcPlayerRepository::mapPlayer;

    private final JdbcTemplate jdbcTemplate;

    public JdbcPlayerRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    void initializeSchema() {
        jdbcTemplate.execute("""
                create table if not exists players (
                    id varchar(64) primary key,
                    identity_key varchar(190) not null unique,
                    telegram_user_id bigint,
                    username varchar(190),
                    nickname varchar(64),
                    nickname_key varchar(64),
                    first_name varchar(190),
                    last_name varchar(190),
                    language_code varchar(32),
                    coins integer not null,
                    rating integer not null,
                    wins integer not null,
                    losses integer not null,
                    active_duel_id varchar(64),
                    created_at_ms bigint not null,
                    updated_at_ms bigint not null
                )
                """);
        jdbcTemplate.execute("create unique index if not exists idx_players_nickname_key on players(nickname_key)");
        jdbcTemplate.execute("create index if not exists idx_players_identity_key on players(identity_key)");
    }

    @Override
    public PlayerProfile save(PlayerProfile playerProfile) {
        int updated = jdbcTemplate.update("""
                        update players
                        set identity_key = ?,
                            telegram_user_id = ?,
                            username = ?,
                            nickname = ?,
                            nickname_key = ?,
                            first_name = ?,
                            last_name = ?,
                            language_code = ?,
                            coins = ?,
                            rating = ?,
                            wins = ?,
                            losses = ?,
                            active_duel_id = ?,
                            created_at_ms = ?,
                            updated_at_ms = ?
                        where id = ?
                        """,
                playerProfile.getIdentityKey(),
                playerProfile.getTelegramUserId(),
                playerProfile.getUsername(),
                playerProfile.getNickname(),
                normalizeNicknameKey(playerProfile.getNickname()),
                playerProfile.getFirstName(),
                playerProfile.getLastName(),
                playerProfile.getLanguageCode(),
                playerProfile.getCoins(),
                playerProfile.getRating(),
                playerProfile.getWins(),
                playerProfile.getLosses(),
                playerProfile.getActiveDuelId(),
                playerProfile.getCreatedAt().toEpochMilli(),
                playerProfile.getUpdatedAt().toEpochMilli(),
                playerProfile.getId()
        );
        if (updated == 0) {
            jdbcTemplate.update("""
                            insert into players (
                                id,
                                identity_key,
                                telegram_user_id,
                                username,
                                nickname,
                                nickname_key,
                                first_name,
                                last_name,
                                language_code,
                                coins,
                                rating,
                                wins,
                                losses,
                                active_duel_id,
                                created_at_ms,
                                updated_at_ms
                            ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """,
                    playerProfile.getId(),
                    playerProfile.getIdentityKey(),
                    playerProfile.getTelegramUserId(),
                    playerProfile.getUsername(),
                    playerProfile.getNickname(),
                    normalizeNicknameKey(playerProfile.getNickname()),
                    playerProfile.getFirstName(),
                    playerProfile.getLastName(),
                    playerProfile.getLanguageCode(),
                    playerProfile.getCoins(),
                    playerProfile.getRating(),
                    playerProfile.getWins(),
                    playerProfile.getLosses(),
                    playerProfile.getActiveDuelId(),
                    playerProfile.getCreatedAt().toEpochMilli(),
                    playerProfile.getUpdatedAt().toEpochMilli()
            );
        }
        return playerProfile;
    }

    @Override
    public Optional<PlayerProfile> findById(String playerId) {
        return queryOne("select * from players where id = ?", playerId);
    }

    @Override
    public Optional<PlayerProfile> findByIdentityKey(String identityKey) {
        return queryOne("select * from players where identity_key = ?", identityKey);
    }

    @Override
    public Optional<PlayerProfile> findByNicknameKey(String nicknameKey) {
        return queryOne("select * from players where nickname_key = ?", nicknameKey);
    }

    private Optional<PlayerProfile> queryOne(String sql, Object parameter) {
        return jdbcTemplate.query(sql, PLAYER_ROW_MAPPER, parameter).stream().findFirst();
    }

    private static PlayerProfile mapPlayer(ResultSet resultSet, int rowNumber) throws SQLException {
        PlayerProfile playerProfile = new PlayerProfile(
                resultSet.getString("id"),
                resultSet.getString("identity_key"),
                resultSet.getObject("telegram_user_id", Long.class),
                resultSet.getString("username"),
                resultSet.getString("nickname"),
                resultSet.getString("first_name"),
                resultSet.getString("last_name"),
                resultSet.getString("language_code"),
                resultSet.getInt("coins"),
                resultSet.getInt("rating"),
                Instant.ofEpochMilli(resultSet.getLong("created_at_ms")),
                Instant.ofEpochMilli(resultSet.getLong("updated_at_ms"))
        );
        for (int wins = 0; wins < resultSet.getInt("wins"); wins += 1) {
            playerProfile.incrementWins();
        }
        for (int losses = 0; losses < resultSet.getInt("losses"); losses += 1) {
            playerProfile.incrementLosses();
        }
        playerProfile.setActiveDuelId(resultSet.getString("active_duel_id"));
        return playerProfile;
    }

    private String normalizeNicknameKey(String nickname) {
        if (nickname == null || nickname.isBlank()) {
            return null;
        }
        return nickname.trim().toLowerCase(Locale.ROOT);
    }
}
