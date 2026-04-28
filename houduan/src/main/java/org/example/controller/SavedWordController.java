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

public class SavedWordController implements HttpHandler {
    private final WordService service;
    public SavedWordController(WordService service) { this.service = service; }
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        try {
            String method = exchange.getRequestMethod().toUpperCase();
            String path = exchange.getRequestURI().getPath();
            if (path.matches(".*/saved-words/\\d+") && "DELETE".equals(method)) {
                int id = Integer.parseInt(path.replaceAll(".*?/saved-words/(\\d+)", "$1"));
                JsonResponses.write(exchange, 200, service.deleteSavedWord(id) ? "{\"success\":true}" : "{\"success\":false}");
                return;
            }
            if ("GET".equals(method)) { JsonResponses.write(exchange, 200, service.listSavedWordsJson()); return; }
            if ("POST".equals(method)) {
                String body = readBody(exchange.getRequestBody());
                int userId = QueryParser.getJsonInt(body, "userId", 0);
                String word = QueryParser.getJsonString(body, "word");
                String trans = QueryParser.getJsonString(body, "trans");
                String usphone = QueryParser.getJsonString(body, "usphone");
                String ukphone = QueryParser.getJsonString(body, "ukphone");
                String example = QueryParser.getJsonString(body, "example");
                JsonResponses.write(exchange, 200, service.addSavedWord(userId, word, trans, usphone, ukphone, example) ? "{\"success\":true}" : "{\"success\":false}");
                return;
            }
            JsonResponses.write(exchange, 405, "{\"success\":false,\"message\":\"Method Not Allowed\"}");
        } catch (Exception e) {
            JsonResponses.write(exchange, 500, "{\"success\":false,\"message\":\"获取生词本失败\"}");
        } finally {
            exchange.close();
        }
    }
    private String readBody(InputStream inputStream) throws IOException { ByteArrayOutputStream outputStream = new ByteArrayOutputStream(); byte[] buffer = new byte[1024]; int len; while ((len = inputStream.read(buffer)) != -1) outputStream.write(buffer, 0, len); return outputStream.toString(StandardCharsets.UTF_8.name()); }
}
