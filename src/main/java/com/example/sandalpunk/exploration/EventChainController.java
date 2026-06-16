package com.example.sandalpunk.exploration;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EventChainController {

    private final EventChainService eventChainService;

    public EventChainController(EventChainService eventChainService) {
        this.eventChainService = eventChainService;
    }

    @GetMapping("/api/chains/catalog")
    public List<EventChain> catalog() {
        return eventChainService.catalog();
    }
}
