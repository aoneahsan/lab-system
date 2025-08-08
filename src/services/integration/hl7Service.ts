import { logger } from '@/services/monitoring/logger';

export interface HL7Message {
  messageType: string;
  messageId: string;
  timestamp: Date;
  segments: HL7Segment[];
}

export interface HL7Segment {
  type: string;
  fields: string[];
}

export class HL7Service {
  parseMessage(rawMessage: string): HL7Message {
    try {
      const lines = rawMessage.split('\r');
      const segments = lines.map(line => this.parseSegment(line));
      
      const mshSegment = segments.find(s => s.type === 'MSH');
      if (!mshSegment) {
        throw new Error('Invalid HL7 message: MSH segment not found');
      }

      return {
        messageType: mshSegment.fields[8] || '',
        messageId: mshSegment.fields[9] || '',
        timestamp: new Date(),
        segments
      };
    } catch (error) {
      logger.error('Failed to parse HL7 message', error);
      throw error;
    }
  }

  private parseSegment(line: string): HL7Segment {
    const fields = line.split('|');
    return {
      type: fields[0],
      fields
    };
  }

  generateORU(result: any): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '').split('.')[0];
    const messageId = `MSG${Date.now()}`;
    
    const segments = [
      `MSH|^~\\&|LABFLOW|LAB|EMR|HOSP|${timestamp}||ORU^R01|${messageId}|P|2.5.1|||AL|NE`,
      `PID|1||${result.patient.mrn}||${result.patient.lastName}^${result.patient.firstName}||${result.patient.dateOfBirth}|${result.patient.gender}`,
      `OBR|1||${result.accessionNumber}|${result.test.code}^${result.test.name}|||${timestamp}`,
      `OBX|1|NM|${result.test.code}^${result.test.name}||${result.value}|${result.unit}|${result.referenceRange}|${result.flag}|||F|||${timestamp}||`
    ];

    return segments.join('\r');
  }
}

export const hl7Service = new HL7Service();