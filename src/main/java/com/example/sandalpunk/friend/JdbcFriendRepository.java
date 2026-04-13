package com.example.sandalpunk.friend;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import jakarta.annotation.PostConstruct;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
@ConditionalOnProperty(name = "app.storage", havingValue = "jdbc", matchIfMissing = true)
public class JdbcFriendRepository implements FriendRepository {

    private static final RowMapper<FriendRequest> FRIEND_REQUEST_ROW_MAPPER = JdbcFriendRepository::mapRequest;

    private final JdbcTemplate jdbcTemplate;

    public JdbcFriendRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    void initializeSchema() {
        jdbcTemplate.execute("""
                create table if not exists friend_requests (
                    id varchar(64) primary key,
                    sender_player_id varchar(64) not null,
                    receiver_player_id varchar(64) not null,
                    created_at_ms bigint not null
                )
                """);
        jdbcTemplate.execute("""
                create table if not exists friendships (
                    player_id varchar(64) not null,
                    friend_id varchar(64) not null,
                    primary key (player_id, friend_id)
                )
                """);
        jdbcTemplate.execute("create index if not exists idx_friend_requests_receiver on friend_requests(receiver_player_id)");
        jdbcTemplate.execute("create index if not exists idx_friendships_player on friendships(player_id)");
    }

    @Override
    public FriendRequest saveRequest(FriendRequest friendRequest) {
        int updated = jdbcTemplate.update("""
                        update friend_requests
                        set sender_player_id = ?,
                            receiver_player_id = ?,
                            created_at_ms = ?
                        where id = ?
                        """,
                friendRequest.senderPlayerId(),
                friendRequest.receiverPlayerId(),
                friendRequest.createdAt().toEpochMilli(),
                friendRequest.id()
        );
        if (updated == 0) {
            jdbcTemplate.update("""
                            insert into friend_requests (
                                id,
                                sender_player_id,
                                receiver_player_id,
                                created_at_ms
                            ) values (?, ?, ?, ?)
                            """,
                    friendRequest.id(),
                    friendRequest.senderPlayerId(),
                    friendRequest.receiverPlayerId(),
                    friendRequest.createdAt().toEpochMilli()
            );
        }
        return friendRequest;
    }

    @Override
    public Optional<FriendRequest> findRequestById(String requestId) {
        return jdbcTemplate.query("select * from friend_requests where id = ?", FRIEND_REQUEST_ROW_MAPPER, requestId)
                .stream()
                .findFirst();
    }

    @Override
    public List<FriendRequest> findIncomingRequests(String receiverPlayerId) {
        return jdbcTemplate.query(
                "select * from friend_requests where receiver_player_id = ? order by created_at_ms asc",
                FRIEND_REQUEST_ROW_MAPPER,
                receiverPlayerId
        );
    }

    @Override
    public Optional<FriendRequest> findPendingBetween(String firstPlayerId, String secondPlayerId) {
        return jdbcTemplate.query("""
                        select *
                        from friend_requests
                        where (sender_player_id = ? and receiver_player_id = ?)
                           or (sender_player_id = ? and receiver_player_id = ?)
                        order by created_at_ms asc
                        """,
                FRIEND_REQUEST_ROW_MAPPER,
                firstPlayerId,
                secondPlayerId,
                secondPlayerId,
                firstPlayerId
        ).stream().findFirst();
    }

    @Override
    public void deleteRequest(String requestId) {
        jdbcTemplate.update("delete from friend_requests where id = ?", requestId);
    }

    @Override
    public void linkFriends(String firstPlayerId, String secondPlayerId) {
        insertFriendLink(firstPlayerId, secondPlayerId);
        insertFriendLink(secondPlayerId, firstPlayerId);
    }

    @Override
    public boolean areFriends(String firstPlayerId, String secondPlayerId) {
        Integer count = jdbcTemplate.queryForObject(
                "select count(*) from friendships where player_id = ? and friend_id = ?",
                Integer.class,
                firstPlayerId,
                secondPlayerId
        );
        return count != null && count > 0;
    }

    @Override
    public List<String> findFriendIds(String playerId) {
        return jdbcTemplate.query(
                "select friend_id from friendships where player_id = ? order by friend_id asc",
                (resultSet, rowNumber) -> resultSet.getString("friend_id"),
                playerId
        );
    }

    private static FriendRequest mapRequest(ResultSet resultSet, int rowNumber) throws SQLException {
        return new FriendRequest(
                resultSet.getString("id"),
                resultSet.getString("sender_player_id"),
                resultSet.getString("receiver_player_id"),
                Instant.ofEpochMilli(resultSet.getLong("created_at_ms"))
        );
    }

    private void insertFriendLink(String playerId, String friendId) {
        Integer count = jdbcTemplate.queryForObject(
                "select count(*) from friendships where player_id = ? and friend_id = ?",
                Integer.class,
                playerId,
                friendId
        );
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.update(
                "insert into friendships (player_id, friend_id) values (?, ?)",
                playerId,
                friendId
        );
    }
}
