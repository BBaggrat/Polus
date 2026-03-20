package com.example.sandalpunk.zrp;

import java.util.List;

import com.example.sandalpunk.logging.AppEvent;
import com.example.sandalpunk.logging.AppEventLogger;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/zrp")
public class ZrpController {

    private final AppEventLogger appEventLogger;

    public ZrpController(AppEventLogger appEventLogger) {
        this.appEventLogger = appEventLogger;
    }

    @GetMapping("/events")
    public List<AppEvent> events() {
        return appEventLogger.recentEvents();
    }
}
