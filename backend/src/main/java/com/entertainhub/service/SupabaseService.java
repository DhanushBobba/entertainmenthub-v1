package com.entertainhub.service;

import com.entertainhub.config.AppProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

@Service
public class SupabaseService {
    private final AppProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public SupabaseService(AppProperties properties, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.properties = properties;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    private HttpHeaders adminHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", properties.supabaseSecretKey());
        headers.setBearerAuth(properties.supabaseSecretKey());
        return headers;
    }

    public HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", properties.supabasePublishableKey());
        return headers;
    }

    public JsonNode authPost(String path, Object body) {
        return exchange(properties.supabaseUrl() + "/auth/v1/" + path,
                HttpMethod.POST, authHeaders(), body, JsonNode.class);
    }

    public JsonNode authPostWithAccessToken(String path, String accessToken, Object body) {
        HttpHeaders headers = authHeaders();
        headers.setBearerAuth(accessToken);
        return exchange(properties.supabaseUrl() + "/auth/v1/" + path,
                HttpMethod.POST, headers, body, JsonNode.class);
    }

    public JsonNode verifyUser(String accessToken) {
        HttpHeaders headers = authHeaders();
        headers.setBearerAuth(accessToken);
        return exchange(properties.supabaseUrl() + "/auth/v1/user",
                HttpMethod.GET, headers, null, JsonNode.class);
    }

    public JsonNode tableGet(String table, String select, List<String> filters,
                             String order, Integer rangeStart, Integer rangeEnd,
                             boolean countExact) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(properties.supabaseUrl() + "/rest/v1/" + table)
                .queryParam("select", select);

        if (filters != null) {
            for (String filter : filters) {
                String[] parts = filter.split("=", 2);
                if (parts.length == 2) {
                    builder.queryParam(parts[0], parts[1]);
                }
            }
        }
        if (order != null) {
            builder.queryParam("order", order);
        }

        HttpHeaders headers = adminHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        if (rangeStart != null && rangeEnd != null) {
            headers.set("Range", rangeStart + "-" + rangeEnd);
        }
        if (countExact) {
            headers.set("Prefer", "count=exact");
        }

        ResponseEntity<JsonNode> response = restTemplate.exchange(
                builder.build().encode().toUri(),
                HttpMethod.GET,
                new HttpEntity<>(headers),
                JsonNode.class);
        return response.getBody();
    }

    public TableResult tableGetResult(String table, String select, List<String> filters,
                                      String order, Integer rangeStart, Integer rangeEnd) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(properties.supabaseUrl() + "/rest/v1/" + table)
                .queryParam("select", select);
        if (filters != null) {
            for (String filter : filters) {
                String[] parts = filter.split("=", 2);
                if (parts.length == 2) builder.queryParam(parts[0], parts[1]);
            }
        }
        if (order != null) builder.queryParam("order", order);

        HttpHeaders headers = adminHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        if (rangeStart != null && rangeEnd != null) headers.set("Range", rangeStart + "-" + rangeEnd);
        headers.set("Prefer", "count=exact");

        ResponseEntity<JsonNode> response = restTemplate.exchange(
                builder.build().encode().toUri(), HttpMethod.GET,
                new HttpEntity<>(headers), JsonNode.class);

        int total = response.getHeaders().getFirst("Content-Range") != null
                ? parseContentRange(response.getHeaders().getFirst("Content-Range"))
                : response.getBody() == null ? 0 : response.getBody().size();
        return new TableResult(response.getBody(), total);
    }

    private int parseContentRange(String contentRange) {
        int slash = contentRange.lastIndexOf('/');
        if (slash >= 0) {
            try {
                String total = contentRange.substring(slash + 1);
                if (!"*".equals(total)) return Integer.parseInt(total);
            } catch (NumberFormatException ignored) {
            }
        }
        return 0;
    }

    public record TableResult(JsonNode data, int total) {}

    public JsonNode tableInsert(String table, Object data) {
        HttpHeaders headers = adminHeaders();
        headers.set("Prefer", "return=representation");
        JsonNode result = exchange(properties.supabaseUrl() + "/rest/v1/" + table,
                HttpMethod.POST, headers, data, JsonNode.class);
        return result;
    }

    public JsonNode tableUpdate(String table, Object data, List<String> filters) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(properties.supabaseUrl() + "/rest/v1/" + table);
        addFilters(builder, filters);

        HttpHeaders headers = adminHeaders();
        headers.set("Prefer", "return=representation");
        return exchange(builder.build().encode().toUri().toString(),
                HttpMethod.PATCH, headers, data, JsonNode.class);
    }

    public JsonNode tableDelete(String table, List<String> filters) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(properties.supabaseUrl() + "/rest/v1/" + table);
        addFilters(builder, filters);
        HttpHeaders headers = adminHeaders();
        headers.set("Prefer", "return=representation");
        return exchange(builder.build().encode().toUri().toString(),
                HttpMethod.DELETE, headers, null, JsonNode.class);
    }

    public JsonNode rpc(String functionName, Object body) {
        HttpHeaders headers = adminHeaders();
        headers.set("Prefer", "return=representation");
        return exchange(properties.supabaseUrl() + "/rest/v1/rpc/" + functionName,
                HttpMethod.POST, headers, body, JsonNode.class);
    }

    public <T> T exchange(String url, HttpMethod method, HttpHeaders headers,
                          Object body, Class<T> responseType) {
        try {
            ResponseEntity<T> response = restTemplate.exchange(
                    url, method, new HttpEntity<>(body, headers), responseType);
            return response.getBody();
        } catch (HttpStatusCodeException exception) {
            throw exception;
        }
    }

    private void addFilters(UriComponentsBuilder builder, List<String> filters) {
        if (filters == null) {
            return;
        }
        for (String filter : filters) {
            String[] parts = filter.split("=", 2);
            if (parts.length == 2) {
                builder.queryParam(parts[0], parts[1]);
            }
        }
    }

    public Map<String, Object> objectMap(JsonNode node) {
        return objectMapper.convertValue(node, Map.class);
    }

    public ObjectNode toObjectNode(Map<String, Object> map) {
        return objectMapper.valueToTree(map);
    }

    public ObjectMapper mapper() {
        return objectMapper;
    }

    public int countOf(JsonNode node) {
        return node != null && node.isArray() ? node.size() : 0;
    }
}
