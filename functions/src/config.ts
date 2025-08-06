import * as functions from 'firebase-functions';

export const config = {
  // SendGrid Configuration
  sendgrid: {
    apiKey: functions.config().sendgrid?.api_key || '',
    fromEmail: functions.config().sendgrid?.from_email || 'noreply@labflow.app',
    fromName: functions.config().sendgrid?.from_name || 'LabFlow',
  },
  
  // Twilio Configuration
  twilio: {
    accountSid: functions.config().twilio?.account_sid || '',
    authToken: functions.config().twilio?.auth_token || '',
    fromNumber: functions.config().twilio?.from_number || '',
  },
  
  // Vertex AI Configuration
  vertexai: {
    projectId: functions.config().vertexai?.project_id || process.env.GCLOUD_PROJECT || '',
    location: functions.config().vertexai?.location || 'us-central1',
    model: functions.config().vertexai?.model || 'gemini-1.5-pro',
  },
  
  // App Configuration
  app: {
    url: functions.config().app?.url || 'https://labflow.app',
    name: functions.config().app?.name || 'LabFlow',
  },
  
  // Firebase Configuration
  firebase: {
    projectId: process.env.GCLOUD_PROJECT || '',
    databaseURL: functions.config().firebase?.database_url || '',
  },
  
  // Feature Flags
  features: {
    enableSMS: functions.config().features?.enable_sms === 'true',
    enableEmail: functions.config().features?.enable_email === 'true',
    enableAI: functions.config().features?.enable_ai === 'true',
  },
};

export default config;