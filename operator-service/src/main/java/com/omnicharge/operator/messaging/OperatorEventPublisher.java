package com.omnicharge.operator.messaging;

import com.omnicharge.operator.config.RabbitMQConfig;
import com.omnicharge.operator.event.PlanUpdatedMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class OperatorEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final RedisTemplate<String, String> redisTemplate;

    // ── Plan Cache Refresh ─────────────────────────────────────────────────

    public void publishPlanUpdatedEvent(Long operatorId) {
        log.debug("Publishing internal plan-updated event for operatorId: {}", operatorId);
        applicationEventPublisher.publishEvent(new com.omnicharge.operator.event.PlanUpdatedInternalEvent(operatorId));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void handlePlanUpdatedInternalEvent(com.omnicharge.operator.event.PlanUpdatedInternalEvent event) {
        Long operatorId = event.getOperatorId();
        String eventId = UUID.randomUUID().toString();
        PlanUpdatedMessage message = PlanUpdatedMessage.builder()
                .eventId(eventId)
                .operatorId(operatorId)
                .timestamp(Instant.now().toEpochMilli())
                .build();

        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "plan.updated", message);
            log.info("Published post-commit plan.updated event {} for operatorId: {}", eventId, operatorId);
        } catch (Exception e) {
            log.error("Failed to publish plan.updated event {} for operatorId: {}", eventId, operatorId, e);
        }
    }

    // ── Operator Cache Invalidation ────────────────────────────────────────

    public void publishOperatorStatusChangedEvent(Long operatorId) {
        log.debug("Publishing internal operator-status-changed event for operatorId: {}", operatorId);
        applicationEventPublisher.publishEvent(new com.omnicharge.operator.event.OperatorStatusChangedEvent(operatorId));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void handleOperatorStatusChangedEvent(com.omnicharge.operator.event.OperatorStatusChangedEvent event) {
        try {
            // Invalidate the active-operators list cache
            redisTemplate.delete("operators:active");
            log.info("Post-commit: Invalidated operators:active cache for operatorId: {}", event.getOperatorId());

            // Also invalidate all detection caches — operator status change means
            // the 24-hour detection cache may now point to an inactive operator or
            // miss an activated one. Force fresh detection on next user request.
            java.util.Set<String> detectionKeys = redisTemplate.keys("operator:detect:*");
            if (detectionKeys != null && !detectionKeys.isEmpty()) {
                redisTemplate.delete(detectionKeys);
                log.info("Post-commit: Invalidated {} operator detection cache entries for operatorId: {}", detectionKeys.size(), event.getOperatorId());
            }
        } catch (Exception e) {
            log.warn("Post-commit: Failed to invalidate operator caches for operatorId: {}", event.getOperatorId(), e);
        }
    }
}
