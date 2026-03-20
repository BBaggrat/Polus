package com.example.sandalpunk.duel;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DuelChatRequest(
        @NotBlank(message = "Сообщение не должно быть пустым")
        @Size(max = 300, message = "Сообщение должно быть не длиннее 300 символов")
        String message
) {
}
