package com.omnicharge.recharge.task;

import com.omnicharge.recharge.entity.Recharge;
import com.omnicharge.recharge.entity.RechargeStatus;
import com.omnicharge.recharge.repository.RechargeRepository;
import com.omnicharge.recharge.service.IRechargeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RechargeCleanupTask {

    private final RechargeRepository rechargeRepository;
    private final IRechargeService rechargeService;

    /**
     * Runs every hour to check for recharges that have passed their plan expiry date.
     * Recharges with status SUCCESS but expiry date in the past are marked as EXPIRED.
     */
    @Scheduled(fixedRate = 3600000) // 1 hour in milliseconds
    public void markExpiredRecharges() {
        log.info("Starting scheduled task to mark expired recharges...");
        
        List<Recharge> expiredPacks = rechargeRepository.findByStatusAndPlanExpiryDateBefore(
                RechargeStatus.SUCCESS, LocalDate.now());
        
        if (expiredPacks.isEmpty()) {
            log.info("No newly expired recharges found.");
            return;
        }
        
        log.info("Found {} recharges to mark as expired.", expiredPacks.size());
        
        for (Recharge recharge : expiredPacks) {
            try {
                rechargeService.markAsExpired(recharge.getRechargeId());
            } catch (Exception e) {
                log.error("Failed to mark recharge {} as expired", recharge.getRechargeId(), e);
            }
        }
        
        log.info("Completed marking expired recharges.");
    }
}
