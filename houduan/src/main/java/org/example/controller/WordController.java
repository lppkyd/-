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

public class WordController implements HttpHandler {
    private final WordService service;
    public WordController(WordService service) { this.service = service; }
    @Override public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod().toUpperCase();
        if ("GET".equals(method)) { String categoryId = QueryParser.getValue(exchange.getRequestURI().getQuery(), "categoryId"); JsonResponses.write(exchange, 200, service.listWordsJson(categoryId)); return; }
        String body = readBody(exchange.getRequestBody());
        if ("POST".equals(method)) { Integer categoryId = QueryParser.getJsonInt(body, "categoryId", 0); Integer dictId = QueryParser.getJsonInt(body, "dictId", 0); String word = QueryParser.getJsonValue(body, "word"); String meaning = QueryParser.getJsonValue(body, "meaning"); String phonetic = QueryParser.getJsonValue(body, "phonetic"); String example = QueryParser.getJsonValue(body, "example"); int recommended = QueryParser.getJsonInt(body, "recommended", 0); JsonResponses.write(exchange, 200, service.addWord(categoryId == 0 ? null : categoryId, dictId == 0 ? null : dictId, word, meaning, phonetic, example, recommended) ? "{\"success\":true}" : "{\"success\":false}"); return; }
        if ("PUT".equals(method)) { int id = QueryParser.getJsonInt(body, "id", 0); Integer categoryId = QueryParser.getJsonInt(body, "categoryId", 0); Integer dictId = QueryParser.getJsonInt(body, "dictId", 0); String word = QueryParser.getJsonValue(body, "word"); String meaning = QueryParser.getJsonValue(body, "meaning"); String phonetic = QueryParser.getJsonValue(body, "phonetic"); String example = QueryParser.getJsonValue(body, "example"); int recommended = QueryParser.getJsonInt(body, "recommended", 0); JsonResponses.write(exchange, 200, service.editWord(id, categoryId == 0 ? null : categoryId, dictId == 0 ? null : dictId, word, meaning, phonetic, example, recommended) ? "{\"success\":true}" : "{\"success\":false}"); return; }
        if ("DELETE".equals(method)) { int id = QueryParser.getJsonInt(body, "id", 0); JsonResponses.write(exchange, 200, service.removeWord(id) ? "{\"success\":true}" : "{\"success\":false}"); return; }
        JsonResponses.write(exchange, 405, "{\"success\":false,\"message\":\"Method Not Allowed\"}");
    }
    private String readBody(InputStream inputStream) throws IOException { ByteArrayOutputStream outputStream = new ByteArrayOutputStream(); byte[] buffer = new byte[1024]; int len; while ((len = inputStream.read(buffer)) != -1) outputStream.write(buffer, 0, len); return outputStream.toString(StandardCharsets.UTF_8.name()); }
}
