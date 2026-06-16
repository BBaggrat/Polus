package com.example.sandalpunk.exploration;

import java.util.List;

public record EventChain(
        String chainId,
        String title,
        String description,
        ExplorationVisibilityMode mode,
        List<String> requiredTags,
        List<EventChainStep> steps,
        PlayerResources completionReward,
        int failurePenalty,
        boolean isRepeatable
) {
    public EventChain {
        requiredTags = requiredTags == null ? List.of() : List.copyOf(requiredTags);
        steps = steps == null ? List.of() : List.copyOf(steps);
        completionReward = completionReward == null ? PlayerResources.empty() : completionReward;
    }
}
