package org.example.support;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class MysqlConnectionFactory {
    private static final String DEFAULT_URL = "jdbc:mysql://localhost:3306/word_learning?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false";
    private static final String DEFAULT_USER = "root";

    public Connection getConnection() throws SQLException {
        String url = env("DB_URL", DEFAULT_URL);
        String user = env("DB_USER", DEFAULT_USER);

        String[] passwordCandidates = new String[] {
                System.getenv("DB_PASSWORD"),
                "abc123",
                "123456",
                "root",
                ""
        };

        SQLException last = null;
        for (String pwd : passwordCandidates) {
            if (pwd == null) continue;
            try {
                return DriverManager.getConnection(url, user, pwd);
            } catch (SQLException e) {
                last = e;
            }
        }

        throw last == null ? new SQLException("Database connection failed") : last;
    }

    private String env(String key, String defaultValue) {
        String value = System.getenv(key);
        return value == null || value.trim().isEmpty() ? defaultValue : value;
    }
}
