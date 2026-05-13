package com.omnicharge.operator.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Internal Spring application event fired when an operator's status is toggled.
 * Handled by {@link com.omnicharge.operator.messaging.OperatorEventPublisher}
 * via @TransactionalEventListener(AFTER_COMMIT) to prevent race conditions.
 */
@Getter
@AllArgsConstructor
public class OperatorStatusChangedEvent {
    private final Long operatorId;
}
