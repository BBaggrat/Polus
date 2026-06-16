package com.example.sandalpunk.exploration;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EventCatalogController {

    private final EncounterGenerator encounterGenerator;

    public EventCatalogController(EncounterGenerator encounterGenerator) {
        this.encounterGenerator = encounterGenerator;
    }

    @GetMapping("/api/events/catalog")
    public Map<String, Object> catalog() {
        return encounterGenerator.catalogSummary();
    }
}
