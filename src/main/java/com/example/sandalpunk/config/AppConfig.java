package com.example.sandalpunk.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import javax.sql.DataSource;

@Configuration
@EnableConfigurationProperties({
        ApplicationProperties.class,
        DuelBalanceProperties.class
})
public class AppConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    public RestClient telegramRestClient(ApplicationProperties applicationProperties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        requestFactory.setReadTimeout((int) Duration.ofSeconds(40).toMillis());
        return RestClient.builder()
                .baseUrl("https://api.telegram.org")
                .requestFactory(requestFactory)
                .build();
    }

    @Bean
    @ConditionalOnProperty(name = "app.storage", havingValue = "jdbc", matchIfMissing = true)
    public DataSource appDataSource(ApplicationProperties applicationProperties) {
        String url = applicationProperties.getDb().getUrl();
        if (url == null || url.isBlank()) {
            String configuredDataDir = applicationProperties.getDb().getDataDir();
            Path dataDirectory = (configuredDataDir == null || configuredDataDir.isBlank())
                    ? Path.of("data").toAbsolutePath()
                    : Path.of(configuredDataDir).toAbsolutePath();
            try {
                Files.createDirectories(dataDirectory);
            } catch (IOException exception) {
                throw new IllegalStateException("Не удалось создать директорию для файловой БД: " + dataDirectory, exception);
            }
            url = "jdbc:h2:file:" + dataDirectory.resolve("polus").toString().replace('\\', '/')
                    + ";AUTO_SERVER=TRUE;MODE=PostgreSQL";
        }

        String username = applicationProperties.getDb().getUsername();
        if (username == null || username.isBlank()) {
            username = "sa";
        }

        String password = applicationProperties.getDb().getPassword();
        if (password == null) {
            password = "";
        }

        return DataSourceBuilder.create()
                .url(url)
                .username(username)
                .password(password)
                .build();
    }
}
