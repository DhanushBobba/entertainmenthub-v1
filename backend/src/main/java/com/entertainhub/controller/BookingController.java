package com.entertainhub.controller;

import com.entertainhub.common.ApiException;
import com.entertainhub.service.AuthService;
import com.entertainhub.service.SupabaseService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;

import java.util.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final SupabaseService supabase;
    private final AuthService auth;

    private static final String SELECT =
            "*,profiles(id,full_name,email),movies(id,title,poster_url,language),events(id,title,banner_url,venue,city,event_date,event_time)";

    public BookingController(SupabaseService supabase, AuthService auth) {
        this.supabase = supabase;
        this.auth = auth;
    }

    @PostMapping({"", "/"})
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createBooking(
            @RequestHeader("Authorization") String authorization,
            @RequestBody Map<String, Object> payload) {
        Map<String, Object> customer = auth.requireCustomer(authorization);
        String type = Objects.toString(payload.get("booking_type"), "");
        Object itemId = payload.get("item_id");
        Object quantityValue = payload.getOrDefault("quantity", 1);
        int quantity;
        try {
            quantity = Integer.parseInt(quantityValue.toString());
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Invalid ticket quantity");
        }
        if (!List.of("movie", "event").contains(type)) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Invalid booking type");
        }
        if (quantity < 1 || quantity > 10 || itemId == null) {
            throw new ApiException(HttpStatus.CONFLICT, "Invalid ticket quantity");
        }
        try {
            JsonNode result = supabase.rpc("create_booking", Map.of(
                    "p_user_id", customer.get("id").toString(),
                    "p_booking_type", type,
                    "p_item_id", itemId.toString(),
                    "p_quantity", quantity));
            JsonNode booking = result.isArray() ? (result.isEmpty() ? null : result.get(0)) : result;
            if (booking == null || booking.isNull()) {
                throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Booking creation failed");
            }
            return Map.of("message", "Booking created successfully",
                    "booking", supabase.mapper().convertValue(booking, Map.class));
        } catch (ApiException exception) {
            throw exception;
        } catch (HttpStatusCodeException exception) {
            String body = exception.getResponseBodyAsString();
            Map<String, String> errors = Map.of(
                    "INVALID_QUANTITY", "Invalid ticket quantity",
                    "INVALID_CUSTOMER", "Invalid customer account",
                    "MOVIE_NOT_AVAILABLE", "Movie is not available",
                    "EVENT_NOT_AVAILABLE", "Event is not available",
                    "INSUFFICIENT_SEATS", "Not enough seats available",
                    "INVALID_BOOKING_TYPE", "Invalid booking type");
            for (Map.Entry<String, String> error : errors.entrySet()) {
                if (body.contains(error.getKey())) {
                    throw new ApiException(HttpStatus.CONFLICT, error.getValue());
                }
            }
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to create booking");
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to create booking");
        }
    }

    @GetMapping({"", "/"})
    public Map<String, Object> getBookings(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(required = false) String bookingType,
            @RequestParam(required = false) String bookingStatus,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        Map<String, Object> user = auth.getCurrentUser(authorization);
        if (page < 1 || limit < 1 || limit > 100) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Invalid pagination");
        }
        List<String> filters = new ArrayList<>();
        if (!"admin".equals(user.get("role"))) {
            filters.add("user_id=eq." + user.get("id"));
        }
        if (bookingType != null) filters.add("booking_type=eq." + bookingType);
        if (bookingStatus != null) filters.add("booking_status=eq." + bookingStatus);
        int start = (page - 1) * limit;
        SupabaseService.TableResult result = supabase.tableGetResult("bookings", SELECT,
                filters, "created_at.desc", start, start + limit - 1);
        return Map.of("total", result.total(), "page", page, "limit", limit,
                "bookings", supabase.mapper().convertValue(result.data(), List.class));
    }

    @GetMapping("/{bookingId}")
    public Map<String, Object> getBooking(
            @RequestHeader("Authorization") String authorization,
            @PathVariable UUID bookingId) {
        Map<String, Object> user = auth.getCurrentUser(authorization);
        List<String> filters = new ArrayList<>(List.of("id=eq." + bookingId));
        if (!"admin".equals(user.get("role"))) {
            filters.add("user_id=eq." + user.get("id"));
        }
        JsonNode data = supabase.tableGet("bookings", SELECT, filters, null, 0, 0, false);
        if (data == null || data.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Booking not found");
        }
        return supabase.mapper().convertValue(data.get(0), Map.class);
    }

    @PatchMapping("/{bookingId}/status")
    public Map<String, Object> updateBookingStatus(
            @RequestHeader("Authorization") String authorization,
            @PathVariable UUID bookingId,
            @RequestBody Map<String, Object> payload) {
        auth.requireAdmin(authorization);
        JsonNode existing = supabase.tableGet("bookings", "*",
                List.of("id=eq." + bookingId), null, 0, 0, false);
        if (existing == null || existing.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Booking not found");
        }
        Map<String, Object> booking = supabase.mapper().convertValue(existing.get(0), Map.class);
        String currentStatus = Objects.toString(booking.get("booking_status"), "");
        String newStatus = Objects.toString(payload.get("booking_status"), "");
        Map<String, List<String>> allowed = Map.of(
                "pending", List.of("confirmed", "cancelled"),
                "confirmed", List.of("completed", "cancelled"),
                "completed", List.of(),
                "cancelled", List.of());
        if (!allowed.getOrDefault(currentStatus, List.of()).contains(newStatus)) {
            throw new ApiException(HttpStatus.CONFLICT, "Invalid booking status transition");
        }
        if ("cancelled".equals(newStatus) && "paid".equals(booking.get("payment_status"))) {
            throw new ApiException(HttpStatus.CONFLICT, "Paid bookings require refund processing");
        }
        JsonNode data = supabase.tableUpdate("bookings", Map.of("booking_status", newStatus),
                List.of("id=eq." + bookingId,
                        "booking_status=eq." + currentStatus,
                        "payment_status=eq." + booking.get("payment_status")));
        if (data == null || data.isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "Booking status changed. Please refresh.");
        }
        return Map.of("message", "Booking status updated successfully",
                "booking", supabase.mapper().convertValue(data.get(0), Map.class));
    }

    @PatchMapping("/{bookingId}/cancel")
    public Map<String, Object> cancelBooking(
            @RequestHeader("Authorization") String authorization,
            @PathVariable UUID bookingId) {
        Map<String, Object> customer = auth.requireCustomer(authorization);
        JsonNode data = supabase.tableUpdate("bookings", Map.of("booking_status", "cancelled"),
                List.of("id=eq." + bookingId,
                        "user_id=eq." + customer.get("id"),
                        "booking_status=in.(pending,confirmed)",
                        "payment_status=in.(pending,failed)"));
        if (data == null || data.isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "Booking not found or cannot be cancelled");
        }
        return Map.of("message", "Booking cancelled successfully",
                "booking", supabase.mapper().convertValue(data.get(0), Map.class));
    }
}
