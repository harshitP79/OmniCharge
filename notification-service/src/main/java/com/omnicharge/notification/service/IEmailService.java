package com.omnicharge.notification.service;

import com.omnicharge.contracts.event.PaymentCompletedEvent;
import com.omnicharge.contracts.event.RechargeCompletedEvent;

public interface IEmailService {

    void sendPaymentConfirmation(String toEmail, PaymentCompletedEvent event);

    void sendRechargeConfirmation(String toEmail, RechargeCompletedEvent event);

    void sendPlanExpiryReminder(String toEmail, String userName, String operatorName, 
                                String planName, String mobileNumber, int daysLeft);

    void sendPlanExpiredNotification(String toEmail, String userName, String operatorName, 
                                     String planName, String mobileNumber);
}
