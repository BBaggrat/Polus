package com.example.sandalpunk.exploration;

public record EventChainStep(
        String stepId,
        String eventId,
        int order,
        String requiredPreviousChoice,
        String nextStepOnSuccess,
        String nextStepOnFailure
) {
}
