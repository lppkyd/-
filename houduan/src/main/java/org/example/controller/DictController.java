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

public class DictController implements HttpHandler {
    private final WordService service;
    public DictController(WordService service) { this.service = service; }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod().toUpperCase();
        if ("GET".equals(method)) {
            JsonResponses.write(exchange, 200, service.listDictsJson());
            return;
        }

        String body = readBody(exchange.getRequestBody());
        if ("POST".equals(method)) {
            String name = QueryParser.getJsonValue(body, "name");
            String description = QueryParser.getJsonValue(body, "description");
            JsonResponses.write(exchange, 200, service.addDict(name, description, 1, true) ? "{\"success\":true}" : "{\"success\":false}");
            return;
        }
        if ("PUT".equals(method)) {
            int id = QueryParser.getJsonInt(body, "id", 0);
            String name = QueryParser.getJsonValue(body, "name");
            String description = QueryParser.getJsonValue(body, "description");
            JsonResponses.write(exchange, 200, service.editDict(id, name, description) ? "{\"success\":true}" : "{\"success\":false}");
            return;
        }
        if ("DELETE".equals(method)) {
            int id = QueryParser.getJsonInt(body, "id", 0);
            JsonResponses.write(exchange, 200, service.removeDict(id) ? "{\"success\":true}" : "{\"success\":false}");
            return;
        }
        JsonResponses.write(exchange, 405, "{\"success\":false,\"message\":\"Method Not Allowed\"}");
    }

    private String readBody(InputStream inputStream) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];
        int len;
        while ((len = inputStream.read(buffer)) != -1) {
            outputStream.write(buffer, 0, len);
        }
        return outputStream.toString(StandardCharsets.UTF_8.name());
    }
}
