package org.example.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.example.support.JsonResponses;
import org.example.support.MysqlConnectionFactory;
import org.example.support.QueryParser;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class    AuthController implements HttpHandler {
    private final MysqlConnectionFactory connectionFactory;
    public AuthController(MysqlConnectionFactory connectionFactory) { this.connectionFactory = connectionFactory; }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod().toUpperCase();
        String body = readBody(exchange.getRequestBody());
        try {
            if (!"POST".equals(method)) {
                JsonResponses.write(exchange, 405, "{\"success\":false,\"message\":\"Method Not Allowed\"}");
                return;
            }
            String action = QueryParser.getJsonValue(body, "action");
            if ("register".equals(action)) { handleRegister(exchange, body); return; }
            String type = QueryParser.getJsonValue(body, "type");
            String username = QueryParser.getJsonValue(body, "username");
            String password = QueryParser.getJsonValue(body, "password");
            if ("admin".equals(type)) { handleAdminLogin(exchange, username, password); return; }
            handleUserLogin(exchange, username, password); return;
        } finally {
            exchange.close();
        }
    }

    private void handleRegister(HttpExchange exchange, String body) throws IOException {
        String nickname = QueryParser.getJsonValue(body, "nickname");
        String username = QueryParser.getJsonValue(body, "username");
        String password = QueryParser.getJsonValue(body, "password");
        try (Connection connection = connectionFactory.getConnection()) {
            try (PreparedStatement exists = connection.prepareStatement("select id from user where openid=? or nickname=? limit 1")) {
                exists.setString(1, username);
                exists.setString(2, nickname);
                try (ResultSet rs = exists.executeQuery()) {
                    if (rs.next()) { JsonResponses.write(exchange, 409, "{\"success\":false,\"message\":\"用户已存在\"}"); return; }
                }
            }
            try (PreparedStatement insert = connection.prepareStatement("insert into user(openid, password, nickname) values(?,?,?)", PreparedStatement.RETURN_GENERATED_KEYS)) {
                insert.setString(1, username);
                insert.setString(2, password);
                insert.setString(3, nickname);
                insert.executeUpdate();
                try (ResultSet keys = insert.getGeneratedKeys()) {
                    int id = keys.next() ? keys.getInt(1) : 0;
                    JsonResponses.write(exchange, 200, "{\"success\":true,\"data\":{\"role\":\"user\",\"userId\":" + id + ",\"nickname\":\"" + QueryParser.escape(nickname) + "\"}}"
                    );
                }
            }
        } catch (SQLException e) { JsonResponses.write(exchange, 500, "{\"success\":false,\"message\":\"数据库异常\"}"); }
    }

    private void handleAdminLogin(HttpExchange exchange, String username, String password) throws IOException {
        String sql = "select id, nickname from admin where username=? and password=? limit 1";
        try (Connection connection = connectionFactory.getConnection(); PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, username);
            ps.setString(2, password);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    int id = rs.getInt("id");
                    String nickname = rs.getString("nickname");
                    JsonResponses.write(exchange, 200, "{\"success\":true,\"data\":{\"role\":\"admin\",\"userId\":" + id + ",\"nickname\":\"" + QueryParser.escape(nickname) + "\"}}"
                    );
                    return;
                }
            }
        } catch (SQLException e) { JsonResponses.write(exchange, 500, "{\"success\":false,\"message\":\"数据库异常\"}"); return; }
        JsonResponses.write(exchange, 401, "{\"success\":false,\"message\":\"管理员账号或密码错误\"}");
    }

    private void handleUserLogin(HttpExchange exchange, String username, String password) throws IOException {
        String sql = "select id, openid, nickname from user where (openid=? or nickname=?) and password=? limit 1";
        try (Connection connection = connectionFactory.getConnection(); PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, username);
            ps.setString(2, username);
            ps.setString(3, password);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    int id = rs.getInt("id");
                    String nickname = rs.getString("nickname");
                    JsonResponses.write(exchange, 200, "{\"success\":true,\"data\":{\"role\":\"user\",\"userId\":" + id + ",\"nickname\":\"" + QueryParser.escape(nickname) + "\"}}"
                    );
                    return;
                }
            }
        } catch (SQLException e) { JsonResponses.write(exchange, 500, "{\"success\":false,\"message\":\"数据库异常\"}"); return; }
        JsonResponses.write(exchange, 401, "{\"success\":false,\"message\":\"用户不存在或密码错误\"}");
    }

    private String readBody(InputStream inputStream) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024]; int len; while ((len = inputStream.read(buffer)) != -1) outputStream.write(buffer, 0, len);
        return outputStream.toString(StandardCharsets.UTF_8.name());
    }
}
