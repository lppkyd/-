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

public class CategoryController implements HttpHandler {
    private final WordService service;
    public CategoryController(WordService service) { this.service = service; }
    @Override public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod().toUpperCase();
        if ("GET".equals(method)) { JsonResponses.write(exchange, 200, service.listCategoriesJson()); return; }
        String body = readBody(exchange.getRequestBody());
        if ("POST".equals(method)) { String name = QueryParser.getJsonValue(body, "name"); int sort = QueryParser.getJsonInt(body, "sort", 0); boolean isSystem = QueryParser.getJsonInt(body, "isSystem", 1) == 1; JsonResponses.write(exchange, 200, service.addCategory(name, sort, isSystem) ? "{\"success\":true}" : "{\"success\":false}"); return; }
        if ("PUT".equals(method)) { int id = QueryParser.getJsonInt(body, "id", 0); String name = QueryParser.getJsonValue(body, "name"); int sort = QueryParser.getJsonInt(body, "sort", 0); boolean isSystem = QueryParser.getJsonInt(body, "isSystem", 1) == 1; JsonResponses.write(exchange, 200, service.editCategory(id, name, sort, isSystem) ? "{\"success\":true}" : "{\"success\":false}"); return; }
        if ("DELETE".equals(method)) { int id = QueryParser.getJsonInt(body, "id", 0); JsonResponses.write(exchange, 200, service.removeCategory(id) ? "{\"success\":true}" : "{\"success\":false}"); return; }
        JsonResponses.write(exchange, 405, "{\"success\":false,\"message\":\"Method Not Allowed\"}");
    }
    private String readBody(InputStream inputStream) throws IOException { ByteArrayOutputStream outputStream = new ByteArrayOutputStream(); byte[] buffer = new byte[1024]; int len; while ((len = inputStream.read(buffer)) != -1) outputStream.write(buffer, 0, len); return outputStream.toString(StandardCharsets.UTF_8.name()); }
}
