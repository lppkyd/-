package org.example.support;

public class QueryParser {
    public static String getValue(String query, String key) {
        if (query == null || query.isEmpty()) {
            return null;
        }
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 2 && key.equals(kv[0])) {
                return kv[1];
            }
        }
        return null;
    }

    public static String getJsonValue(String json, String key) {
        String token = '"' + key + '"';
        int index = json.indexOf(token);
        if (index < 0) {
            return null;
        }
        int colon = json.indexOf(':', index + token.length());
        if (colon < 0) {
            return null;
        }
        int start = json.indexOf('"', colon + 1);
        if (start < 0) {
            return null;
        }
        int end = json.indexOf('"', start + 1);
        if (end < 0) {
            return null;
        }
        return json.substring(start + 1, end);
    }

    public static int getJsonInt(String json, String key, int defaultValue) {
        String token = '"' + key + '"';
        int index = json.indexOf(token);
        if (index < 0) {
            return defaultValue;
        }
        int colon = json.indexOf(':', index + token.length());
        if (colon < 0) {
            return defaultValue;
        }
        int start = colon + 1;
        while (start < json.length() && Character.isWhitespace(json.charAt(start))) {
            start++;
        }
        int end = start;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '-')) {
            end++;
        }
        try {
            return Integer.parseInt(json.substring(start, end));
        } catch (Exception e) {
            return defaultValue;
        }
    }

    public static String getJsonString(String json, String key) {
        String value = getJsonValue(json, key);
        return value == null ? "" : value;
    }

    public static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
