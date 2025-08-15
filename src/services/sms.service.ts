/**
 * SMS Service for sending text messages
 * In production, integrate with Twilio, AWS SNS, or other SMS providers
 */
class SMSService {
  private isProduction = import.meta.env.PROD;

  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    if (this.isProduction) {
      // In production, use actual SMS provider
      // Example with Twilio:
      // const client = twilio(accountSid, authToken);
      // await client.messages.create({
      //   body: message,
      //   from: '+1234567890',
      //   to: phoneNumber
      // });
      
      console.log('SMS would be sent in production:', { phoneNumber, message });
    } else {
      // Development mode - log to console
      console.log('📱 SMS Service (Dev Mode)');
      console.log('To:', phoneNumber);
      console.log('Message:', message);
      console.log('---');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async sendBulkSMS(recipients: { phoneNumber: string; message: string }[]): Promise<void> {
    // Send multiple SMS messages
    const promises = recipients.map(({ phoneNumber, message }) => 
      this.sendSMS(phoneNumber, message)
    );
    
    await Promise.all(promises);
  }

  validatePhoneNumber(phoneNumber: string): boolean {
    // E.164 format validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber.replace(/\s/g, ''));
  }

  formatPhoneNumber(phoneNumber: string, countryCode: string = '+1'): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    if (!phoneNumber.startsWith('+')) {
      return `${countryCode}${digits}`;
    }
    
    return `+${digits}`;
  }
}

export const smsService = new SMSService();