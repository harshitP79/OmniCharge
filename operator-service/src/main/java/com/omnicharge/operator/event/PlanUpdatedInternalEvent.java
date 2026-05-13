package com.omnicharge.operator.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PlanUpdatedInternalEvent {
    private final Long operatorId;
}
