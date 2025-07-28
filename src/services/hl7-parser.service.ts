import type { HL7MessageType } from '@/types/emr.types';

// HL7 Segment interfaces
export interface HL7Segment {
  type: string;
  fields: string[];
}

export interface HL7Message {
  segments: HL7Segment[];
  messageType: HL7MessageType;
  messageControlId: string;
  sendingApplication?: string;
  sendingFacility?: string;
  receivingApplication?: string;
  receivingFacility?: string;
  timestamp?: string;
  version?: string;
}

// MSH (Message Header) fields
export interface MSHSegment {
  fieldSeparator: string;
  encodingCharacters: string;
  sendingApplication: string;
  sendingFacility: string;
  receivingApplication: string;
  receivingFacility: string;
  dateTimeOfMessage: string;
  security?: string;
  messageType: string;
  messageControlId: string;
  processingId: string;
  versionId: string;
}

// PID (Patient Identification) fields
export interface PIDSegment {
  setId?: string;
  patientId?: string;
  patientIdentifierList?: Array<{
    id: string;
    assigningAuthority?: string;
    identifierType?: string;
  }>;
  alternatePatientId?: string;
  patientName?: Array<{
    familyName: string;
    givenName?: string;
    middleName?: string;
    suffix?: string;
    prefix?: string;
  }>;
  mothersMaidenName?: string;
  dateOfBirth?: string;
  sex?: string;
  patientAlias?: string[];
  race?: string;
  patientAddress?: Array<{
    streetAddress?: string;
    otherDesignation?: string;
    city?: string;
    stateOrProvince?: string;
    zipOrPostalCode?: string;
    country?: string;
  }>;
  countyCode?: string;
  phoneNumberHome?: string;
  phoneNumberBusiness?: string;
  primaryLanguage?: string;
  maritalStatus?: string;
  religion?: string;
  patientAccountNumber?: string;
  ssnNumber?: string;
  driversLicenseNumber?: string;
}

class HL7ParserService {
  private fieldSeparator = '|';
  private componentSeparator = '^';
  private repetitionSeparator = '~';

  // Parse HL7 message
  parseMessage(rawMessage: string): HL7Message {
    const lines = rawMessage.trim().split(/\r?\n/);
    const segments: HL7Segment[] = [];

    let messageType: HL7MessageType = 'ADT';
    let messageControlId = '';
    let sendingApplication = '';
    let sendingFacility = '';
    let receivingApplication = '';
    let receivingFacility = '';
    let timestamp = '';
    let version = '';

    for (const line of lines) {
      if (!line.trim()) continue;

      const fields = this.parseSegment(line);
      if (fields.length === 0) continue;

      const segmentType = fields[0];
      segments.push({
        type: segmentType,
        fields: fields.slice(1),
      });

      // Extract key information from MSH segment
      if (segmentType === 'MSH') {
        const msh = this.parseMSHSegment(fields);
        messageType = msh.messageType.split('^')[0] as HL7MessageType;
        messageControlId = msh.messageControlId;
        sendingApplication = msh.sendingApplication;
        sendingFacility = msh.sendingFacility;
        receivingApplication = msh.receivingApplication;
        receivingFacility = msh.receivingFacility;
        timestamp = msh.dateTimeOfMessage;
        version = msh.versionId;
      }
    }

    return {
      segments,
      messageType,
      messageControlId,
      sendingApplication,
      sendingFacility,
      receivingApplication,
      receivingFacility,
      timestamp,
      version,
    };
  }

  // Parse individual segment
  private parseSegment(segmentString: string): string[] {
    // Special handling for MSH segment
    if (segmentString.startsWith('MSH')) {
      const fields = ['MSH'];
      // MSH has field separator as second character
      this.fieldSeparator = segmentString.charAt(3);
      // Encoding characters are in field 2
      const encodingChars = segmentString.substring(4, 8);
      this.componentSeparator = encodingChars[0];
      this.repetitionSeparator = encodingChars[1];
      // escapeCharacter = encodingChars[2];
      // subcomponentSeparator = encodingChars[3];

      // Parse remaining fields
      const remainingFields = segmentString.substring(4).split(this.fieldSeparator);
      fields.push(...remainingFields);
      return fields;
    }

    return segmentString.split(this.fieldSeparator);
  }

  // Parse MSH segment
  private parseMSHSegment(fields: string[]): MSHSegment {
    return {
      fieldSeparator: this.fieldSeparator,
      encodingCharacters: fields[1],
      sendingApplication: fields[2] || '',
      sendingFacility: fields[3] || '',
      receivingApplication: fields[4] || '',
      receivingFacility: fields[5] || '',
      dateTimeOfMessage: fields[6] || '',
      security: fields[7],
      messageType: fields[8] || '',
      messageControlId: fields[9] || '',
      processingId: fields[10] || '',
      versionId: fields[11] || '',
    };
  }

  // Parse PID segment
  parsePIDSegment(segment: HL7Segment): PIDSegment | null {
    if (segment.type !== 'PID') return null;

    const fields = segment.fields;
    const pid: PIDSegment = {};

    // Set ID
    if (fields[0]) pid.setId = fields[0];

    // Patient ID (deprecated)
    if (fields[1]) pid.patientId = fields[1];

    // Patient Identifier List
    if (fields[2]) {
      pid.patientIdentifierList = this.parseRepeatingField(fields[2]).map((id) => {
        const components = this.parseComponents(id);
        return {
          id: components[0],
          assigningAuthority: components[3],
          identifierType: components[4],
        };
      });
    }

    // Patient Name
    if (fields[4]) {
      pid.patientName = this.parseRepeatingField(fields[4]).map((name) => {
        const components = this.parseComponents(name);
        return {
          familyName: components[0] || '',
          givenName: components[1],
          middleName: components[2],
          suffix: components[3],
          prefix: components[4],
        };
      });
    }

    // Date of Birth
    if (fields[6]) pid.dateOfBirth = fields[6];

    // Sex
    if (fields[7]) pid.sex = fields[7];

    // Patient Address
    if (fields[10]) {
      pid.patientAddress = this.parseRepeatingField(fields[10]).map((address) => {
        const components = this.parseComponents(address);
        return {
          streetAddress: components[0],
          otherDesignation: components[1],
          city: components[2],
          stateOrProvince: components[3],
          zipOrPostalCode: components[4],
          country: components[5],
        };
      });
    }

    // Phone Numbers
    if (fields[12]) pid.phoneNumberHome = fields[12];
    if (fields[13]) pid.phoneNumberBusiness = fields[13];

    // Marital Status
    if (fields[15]) pid.maritalStatus = fields[15];

    // SSN
    if (fields[18]) pid.ssnNumber = fields[18];

    return pid;
  }

  // Parse components within a field
  private parseComponents(field: string): string[] {
    return field.split(this.componentSeparator);
  }

  // Parse repeating fields
  private parseRepeatingField(field: string): string[] {
    return field.split(this.repetitionSeparator);
  }

  // Generate HL7 message
  generateMessage(message: Partial<HL7Message>): string {
    const segments: string[] = [];

    // Generate MSH segment
    const msh = this.generateMSHSegment({
      sendingApplication: message.sendingApplication || '',
      sendingFacility: message.sendingFacility || '',
      receivingApplication: message.receivingApplication || '',
      receivingFacility: message.receivingFacility || '',
      messageType: message.messageType || 'ADT',
      messageControlId: message.messageControlId || this.generateMessageControlId(),
      timestamp: message.timestamp || new Date().toISOString(),
      version: message.version || '2.5',
    });

    segments.push(msh);

    // Add other segments
    if (message.segments) {
      for (const segment of message.segments) {
        if (segment.type !== 'MSH') {
          segments.push(this.generateSegment(segment));
        }
      }
    }

    return segments.join('\r\n');
  }

  // Generate MSH segment
  private generateMSHSegment(data: {
    sendingApplication: string;
    sendingFacility: string;
    receivingApplication: string;
    receivingFacility: string;
    messageType: string;
    messageControlId: string;
    timestamp: string;
    version: string;
  }): string {
    const fields = [
      'MSH',
      '^~\\&',
      data.sendingApplication,
      data.sendingFacility,
      data.receivingApplication,
      data.receivingFacility,
      this.formatHL7Timestamp(data.timestamp),
      '',
      data.messageType,
      data.messageControlId,
      'P',
      data.version,
    ];

    return fields.join(this.fieldSeparator);
  }

  // Generate generic segment
  private generateSegment(segment: HL7Segment): string {
    return [segment.type, ...segment.fields].join(this.fieldSeparator);
  }

  // Generate unique message control ID
  private generateMessageControlId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Format timestamp for HL7
  private formatHL7Timestamp(isoTimestamp: string): string {
    const date = new Date(isoTimestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  // Validate HL7 message
  validateMessage(message: HL7Message): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for MSH segment
    if (!message.segments.find((s) => s.type === 'MSH')) {
      errors.push('Missing required MSH segment');
    }

    // Check message control ID
    if (!message.messageControlId) {
      errors.push('Missing message control ID');
    }

    // Check message type
    if (!message.messageType) {
      errors.push('Missing message type');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const hl7Parser = new HL7ParserService();
