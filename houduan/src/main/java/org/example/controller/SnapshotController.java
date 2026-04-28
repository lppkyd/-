package org.example.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.example.service.WordService;
import org.example.support.JsonResponses;
import org.example.support.QueryParser;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class SnapshotController implements HttpHandler {
    private final WordService service;
    public SnapshotController(WordService service) { this.service = service; }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        try {
            String method = exchange.getRequestMethod().toUpperCase();
            String path = exchange.getRequestURI().getPath();
            if ("POST".equals(method)) {
                String body = readBody(exchange.getRequestBody());
                int userId = QueryParser.getJsonInt(body, "userId", 0);
                if (userId <= 0) { JsonResponses.write(exchange, 400, "{\"success\":false,\"message\":\"userId不能为空\"}"); return; }
                service.saveSnapshot(userId, body);
                JsonResponses.write(exchange, 200, "{\"success\":true}");
                return;
            }
            if ("GET".equals(method)) {
                if (path.endsWith("/latest")) { JsonResponses.write(exchange, 200, service.listLatestSnapshotJson()); return; }
                if (path.matches(".*/sync/snapshot/\\d+")) { int userId = Integer.parseInt(path.replaceAll(".*?/sync/snapshot/(\\d+)", "$1")); JsonResponses.write(exchange, 200, service.listSnapshotByUserJson(userId)); return; }
                JsonResponses.write(exchange, 200, service.listSnapshotsJson());
                return;
            }
            JsonResponses.write(exchange, 405, "{\"success\":false,\"message\":\"Method Not Allowed\"}");
        } catch (Exception e) {
            JsonResponses.write(exchange, 500, "{\"success\":false,\"message\":\"同步快照失败\"}");
        } finally { exchange.close(); }
    }

    private String readBody(InputStream inputStream) throws IOException { ByteArrayOutputStream outputStream = new ByteArrayOutputStream(); byte[] buffer = new byte[1024]; int len; while ((len = inputStream.read(buffer)) != -1) outputStream.write(buffer, 0, len); return outputStream.toString(StandardCharsets.UTF_8.name()); }
}
