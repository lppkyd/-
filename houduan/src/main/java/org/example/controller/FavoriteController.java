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

public class FavoriteController implements HttpHandler {
    private final WordService service;
    public FavoriteController(WordService service) { this.service = service; }
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        try {
            String method = exchange.getRequestMethod().toUpperCase();
            String path = exchange.getRequestURI().getPath();
            if (path.matches(".*/favorites/\\d+") && "DELETE".equals(method)) {
                int id = Integer.parseInt(path.replaceAll(".*?/favorites/(\\d+)", "$1"));
                JsonResponses.write(exchange, 200, service.deleteFavorite(id) ? "{\"success\":true}" : "{\"success\":false}");
                return;
            }
            if ("GET".equals(method)) { JsonResponses.write(exchange, 200, service.listFavoritesJson()); return; }
            if ("POST".equals(method)) {
                String body = readBody(exchange.getRequestBody());
                int userId = QueryParser.getJsonInt(body, "userId", 0);
                int wordId = QueryParser.getJsonInt(body, "wordId", 0);
                String word = QueryParser.getJsonString(body, "word");
                String trans = QueryParser.getJsonString(body, "trans");
                JsonResponses.write(exchange, 200, service.addFavorite(userId, wordId, word, trans) ? "{\"success\":true}" : "{\"success\":false}");
                return;
            }
            JsonResponses.write(exchange, 405, "{\"success\":false,\"message\":\"Method Not Allowed\"}");
        } catch (Exception e) {
            JsonResponses.write(exchange, 500, "{\"success\":false,\"message\":\"收藏接口失败\"}");
        } finally { exchange.close(); }
    }
    private String readBody(InputStream inputStream) throws IOException { ByteArrayOutputStream outputStream = new ByteArrayOutputStream(); byte[] buffer = new byte[1024]; int len; while ((len = inputStream.read(buffer)) != -1) outputStream.write(buffer, 0, len); return outputStream.toString(StandardCharsets.UTF_8.name()); }
}
