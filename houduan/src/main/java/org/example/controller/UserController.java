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

public class UserController implements HttpHandler {
    private final WordService service;
    public UserController(WordService service) { this.service = service; }
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod().toUpperCase();
        String path = exchange.getRequestURI().getPath();
        if (path.matches(".*/users/\\d+/favorites") && "GET".equals(method)) { int userId = Integer.parseInt(path.replaceAll(".*?/users/(\\d+)/favorites", "$1")); JsonResponses.write(exchange, 200, service.listUserFavoritesJson(userId)); return; }
        if (path.matches(".*/users/\\d+/errors") && "GET".equals(method)) { int userId = Integer.parseInt(path.replaceAll(".*?/users/(\\d+)/errors", "$1")); JsonResponses.write(exchange, 200, service.listUserErrorsJson(userId)); return; }
        if (path.matches(".*/users/\\d+/study-records") && "GET".equals(method)) { int userId = Integer.parseInt(path.replaceAll(".*?/users/(\\d+)/study-records", "$1")); JsonResponses.write(exchange, 200, service.listUserStudyRecordsJson(userId)); return; }
        if (path.matches(".*/users/\\d+/saved-words") && "GET".equals(method)) { int userId = Integer.parseInt(path.replaceAll(".*?/users/(\\d+)/saved-words", "$1")); JsonResponses.write(exchange, 200, service.listUserSavedWordsJson(userId)); return; }
        if (path.matches(".*/users/\\d+/clear-favorites") && "POST".equals(method)) { int userId = Integer.parseInt(path.replaceAll(".*?/users/(\\d+)/clear-favorites", "$1")); JsonResponses.write(exchange, 200, service.clearUserFavorites(userId) ? "{\"success\":true}" : "{\"success\":false}"); return; }
        if (path.matches(".*/users/\\d+/clear-errors") && "POST".equals(method)) { int userId = Integer.parseInt(path.replaceAll(".*?/users/(\\d+)/clear-errors", "$1")); JsonResponses.write(exchange, 200, service.clearUserErrors(userId) ? "{\"success\":true}" : "{\"success\":false}"); return; }
        if (path.matches(".*/users/\\d+/clear-study-records") && "POST".equals(method)) { int userId = Integer.parseInt(path.replaceAll(".*?/users/(\\d+)/clear-study-records", "$1")); JsonResponses.write(exchange, 200, service.clearUserStudyRecords(userId) ? "{\"success\":true}" : "{\"success\":false}"); return; }
        if (path.matches(".*/users/\\d+/clear-saved-words") && "POST".equals(method)) { int userId = Integer.parseInt(path.replaceAll(".*?/users/(\\d+)/clear-saved-words", "$1")); JsonResponses.write(exchange, 200, service.clearUserSavedWords(userId) ? "{\"success\":true}" : "{\"success\":false}"); return; }
        if (path.matches(".*/users/\\d+") && "DELETE".equals(method)) { int userId = Integer.parseInt(path.replaceAll(".*?/users/(\\d+)", "$1")); JsonResponses.write(exchange, 200, service.removeUser(userId) ? "{\"success\":true}" : "{\"success\":false}"); return; }
        if (!"GET".equals(method)) { JsonResponses.write(exchange, 405, "{\"success\":false,\"message\":\"Method Not Allowed\"}"); return; }
        JsonResponses.write(exchange, 200, service.listUsersJson());
    }
}
