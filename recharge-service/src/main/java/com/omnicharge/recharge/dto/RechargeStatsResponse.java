package com.omnicharge.recharge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RechargeStatsResponse {

    private Long totalUsers;
    private Long totalRecharges;
    private Long successCount;
    private Long failedCount;
    private Long processingCount;
    private BigDecimal totalAmount;
    private BigDecimal totalRevenue; // Frontend expects totalRevenue
}
