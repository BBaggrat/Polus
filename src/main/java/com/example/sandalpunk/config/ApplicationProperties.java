package com.example.sandalpunk.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class ApplicationProperties {

    private String name = "sandalpunk";
    private String serviceName = "polus-backend";
    private String version = "0.9";
    private String baseUrl = "http://localhost:8080";
    private String storage = "jdbc";
    private boolean allowDevSessions = true;
    private final Bot bot = new Bot();
    private final Database db = new Database();

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getStorage() {
        return storage;
    }

    public void setStorage(String storage) {
        this.storage = storage;
    }

    public boolean isAllowDevSessions() {
        return allowDevSessions;
    }

    public void setAllowDevSessions(boolean allowDevSessions) {
        this.allowDevSessions = allowDevSessions;
    }

    public Bot getBot() {
        return bot;
    }

    public Database getDb() {
        return db;
    }

    public static class Bot {
        private String token = "";
        private String username = "";

        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public boolean isEnabled() {
            return token != null && !token.isBlank() && username != null && !username.isBlank();
        }
    }

    public static class Database {
        private String url = "";
        private String dataDir = "";
        private String username = "";
        private String password = "";

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getDataDir() {
            return dataDir;
        }

        public void setDataDir(String dataDir) {
            this.dataDir = dataDir;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}
