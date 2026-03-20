package com.example.sandalpunk.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DuelPageController {

    @GetMapping({"/", "/duel", "/duel/"})
    public String duelPage() {
        return "forward:/duel/index.html";
    }
}

