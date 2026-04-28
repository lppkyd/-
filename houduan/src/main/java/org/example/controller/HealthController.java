package org.example.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.example.support.JsonResponses;

import java.io.IOException;

public class HealthController implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        JsonResponses.write(exchange, 200, "{\"success\":true,\"message\":\"ok\"}");
    }
}
