package com.example.sandalpunk.health;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import com.example.sandalpunk.config.ApplicationProperties;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class HealthControllerTest {

    @Test
    void healthEndpointReturnsReleaseStatusAndCompatibilityFields() throws Exception {
        ApplicationProperties properties = new ApplicationProperties();
        properties.setName("sandalpunk");
        properties.setServiceName("polus-backend");
        properties.setVersion("0.8");
        properties.setStorage("jdbc");
        Clock clock = Clock.fixed(Instant.parse("2026-06-14T12:00:00Z"), ZoneOffset.UTC);
        HealthController controller = new HealthController(properties, clock);
        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .build();

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.service").value("polus-backend"))
                .andExpect(jsonPath("$.version").value("0.8"))
                .andExpect(jsonPath("$.appName").value("sandalpunk"))
                .andExpect(jsonPath("$.storage").value("jdbc"));

        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.service").value("polus-backend"))
                .andExpect(jsonPath("$.version").value("0.8"))
                .andExpect(jsonPath("$.appName").value("sandalpunk"))
                .andExpect(jsonPath("$.storage").value("jdbc"));

        HealthResponse response = controller.health();
        assertEquals(Instant.parse("2026-06-14T12:00:00Z"), response.timestamp());
        assertEquals(response.timestamp(), response.time());
    }
}
