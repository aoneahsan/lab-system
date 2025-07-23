import type { HL7Segment } from './hl7-parser.service';

// OBR (Observation Request) segment
export interface OBRSegment {
  setId?: string;
  placerOrderNumber?: string;
  fillerOrderNumber?: string;
  universalServiceId?: {
    identifier: string;
    text: string;
    nameOfCodingSystem?: string;
  };
  priority?: string;
  requestedDateTime?: string;
  observationDateTime?: string;
  observationEndDateTime?: string;
  collectionVolume?: string;
  collectorIdentifier?: string[];
  specimenActionCode?: string;
  dangerCode?: string;
  relevantClinicalInfo?: string;
  specimenReceivedDateTime?: string;
  specimenSource?: string;
  orderingProvider?: {
    id: string;
    familyName: string;
    givenName?: string;
  };
  orderCallbackPhoneNumber?: string[];
  placerField1?: string;
  placerField2?: string;
  fillerField1?: string;
  fillerField2?: string;
  resultsRptStatusChngDateTime?: string;
  chargeToPractice?: string;
  diagnosticServSectId?: string;
  resultStatus?: string;
  parentResult?: string;
  quantityTiming?: string[];
  resultCopiesTo?: string[];
  parent?: string;
  transportationMode?: string;
  reasonForStudy?: string[];
  principalResultInterpreter?: string;
}

// OBX (Observation/Result) segment
export interface OBXSegment {
  setId?: string;
  valueType?: string;
  observationIdentifier?: {
    identifier: string;
    text: string;
    nameOfCodingSystem?: string;
  };
  observationSubId?: string;
  observationValue?: string[];
  units?: string;
  referenceRange?: string;
  abnormalFlags?: string[];
  probability?: string;
  natureOfAbnormalTest?: string[];
  observationResultStatus?: string;
  effectiveDateOfReferenceRange?: string;
  userDefinedAccessChecks?: string;
  dateTimeOfObservation?: string;
  producersId?: string;
  responsibleObserver?: string;
  observationMethod?: string[];
}

// ORC (Common Order) segment
export interface ORCSegment {
  orderControl: string;
  placerOrderNumber?: string;
  fillerOrderNumber?: string;
  placerGroupNumber?: string;
  orderStatus?: string;
  responseFlag?: string;
  quantityTiming?: string[];
  parent?: string;
  dateTimeOfTransaction?: string;
  enteredBy?: string;
  verifiedBy?: string;
  orderingProvider?: {
    id: string;
    familyName: string;
    givenName?: string;
  };
  enterersLocation?: string;
  callBackPhoneNumber?: string[];
  orderEffectiveDateTime?: string;
  orderControlCodeReason?: string;
  enteringOrganization?: string;
  enteringDevice?: string;
  actionBy?: string;
}

// NTE (Notes and Comments) segment
export interface NTESegment {
  setId?: string;
  sourceOfComment?: string;
  comment?: string[];
  commentType?: string;
}

class HL7SegmentsService {
  private componentSeparator = '^';
  private repetitionSeparator = '~';
  private subcomponentSeparator = '&';

  // Parse OBR segment
  parseOBRSegment(segment: HL7Segment): OBRSegment | null {
    if (segment.type !== 'OBR') return null;
    
    const fields = segment.fields;
    const obr: OBRSegment = {};

    if (fields[0]) obr.setId = fields[0];
    if (fields[1]) obr.placerOrderNumber = fields[1];
    if (fields[2]) obr.fillerOrderNumber = fields[2];
    
    // Universal Service ID
    if (fields[3]) {
      const components = this.parseComponents(fields[3]);
      obr.universalServiceId = {
        identifier: components[0],
        text: components[1],
        nameOfCodingSystem: components[2],
      };
    }

    if (fields[4]) obr.priority = fields[4];
    if (fields[5]) obr.requestedDateTime = fields[5];
    if (fields[6]) obr.observationDateTime = fields[6];
    if (fields[7]) obr.observationEndDateTime = fields[7];
    
    // Ordering Provider
    if (fields[15]) {
      const components = this.parseComponents(fields[15]);
      obr.orderingProvider = {
        id: components[0],
        familyName: components[1] || '',
        givenName: components[2],
      };
    }

    if (fields[21]) obr.fillerField1 = fields[21];
    if (fields[22]) obr.fillerField2 = fields[22];
    if (fields[24]) obr.diagnosticServSectId = fields[24];
    if (fields[25]) obr.resultStatus = fields[25];

    return obr;
  }

  // Parse OBX segment
  parseOBXSegment(segment: HL7Segment): OBXSegment | null {
    if (segment.type !== 'OBX') return null;
    
    const fields = segment.fields;
    const obx: OBXSegment = {};

    if (fields[0]) obx.setId = fields[0];
    if (fields[1]) obx.valueType = fields[1];
    
    // Observation Identifier
    if (fields[2]) {
      const components = this.parseComponents(fields[2]);
      obx.observationIdentifier = {
        identifier: components[0],
        text: components[1],
        nameOfCodingSystem: components[2],
      };
    }

    if (fields[3]) obx.observationSubId = fields[3];
    
    // Observation Value (can be repeating)
    if (fields[4]) {
      obx.observationValue = this.parseRepeatingField(fields[4]);
    }

    if (fields[5]) obx.units = fields[5];
    if (fields[6]) obx.referenceRange = fields[6];
    
    // Abnormal Flags (can be repeating)
    if (fields[7]) {
      obx.abnormalFlags = this.parseRepeatingField(fields[7]);
    }

    if (fields[10]) obx.observationResultStatus = fields[10];
    if (fields[13]) obx.dateTimeOfObservation = fields[13];

    return obx;
  }

  // Parse ORC segment
  parseORCSegment(segment: HL7Segment): ORCSegment | null {
    if (segment.type !== 'ORC') return null;
    
    const fields = segment.fields;
    const orc: ORCSegment = {
      orderControl: fields[0] || '',
    };

    if (fields[1]) orc.placerOrderNumber = fields[1];
    if (fields[2]) orc.fillerOrderNumber = fields[2];
    if (fields[3]) orc.placerGroupNumber = fields[3];
    if (fields[4]) orc.orderStatus = fields[4];
    if (fields[5]) orc.responseFlag = fields[5];
    
    if (fields[8]) orc.dateTimeOfTransaction = fields[8];
    
    // Ordering Provider
    if (fields[11]) {
      const components = this.parseComponents(fields[11]);
      orc.orderingProvider = {
        id: components[0],
        familyName: components[1] || '',
        givenName: components[2],
      };
    }

    if (fields[14]) orc.orderEffectiveDateTime = fields[14];

    return orc;
  }

  // Parse NTE segment
  parseNTESegment(segment: HL7Segment): NTESegment | null {
    if (segment.type !== 'NTE') return null;
    
    const fields = segment.fields;
    const nte: NTESegment = {};

    if (fields[0]) nte.setId = fields[0];
    if (fields[1]) nte.sourceOfComment = fields[1];
    
    // Comment (can be repeating)
    if (fields[2]) {
      nte.comment = this.parseRepeatingField(fields[2]);
    }

    if (fields[3]) nte.commentType = fields[3];

    return nte;
  }

  // Generate OBR segment
  generateOBRSegment(data: OBRSegment): HL7Segment {
    const fields: string[] = [];

    fields.push(data.setId || '1');
    fields.push(data.placerOrderNumber || '');
    fields.push(data.fillerOrderNumber || '');
    
    // Universal Service ID
    if (data.universalServiceId) {
      fields.push([
        data.universalServiceId.identifier,
        data.universalServiceId.text,
        data.universalServiceId.nameOfCodingSystem || '',
      ].join(this.componentSeparator));
    } else {
      fields.push('');
    }

    fields.push(data.priority || '');
    fields.push(data.requestedDateTime || '');
    fields.push(data.observationDateTime || '');
    fields.push(data.observationEndDateTime || '');
    
    // Add empty fields up to ordering provider
    for (let i = fields.length; i < 16; i++) {
      fields.push('');
    }

    // Ordering Provider
    if (data.orderingProvider) {
      fields[15] = [
        data.orderingProvider.id,
        data.orderingProvider.familyName,
        data.orderingProvider.givenName || '',
      ].join(this.componentSeparator);
    }

    return {
      type: 'OBR',
      fields,
    };
  }

  // Generate OBX segment
  generateOBXSegment(data: OBXSegment): HL7Segment {
    const fields: string[] = [];

    fields.push(data.setId || '1');
    fields.push(data.valueType || 'ST');
    
    // Observation Identifier
    if (data.observationIdentifier) {
      fields.push([
        data.observationIdentifier.identifier,
        data.observationIdentifier.text,
        data.observationIdentifier.nameOfCodingSystem || '',
      ].join(this.componentSeparator));
    } else {
      fields.push('');
    }

    fields.push(data.observationSubId || '');
    
    // Observation Value
    if (data.observationValue) {
      fields.push(data.observationValue.join(this.repetitionSeparator));
    } else {
      fields.push('');
    }

    fields.push(data.units || '');
    fields.push(data.referenceRange || '');
    
    // Abnormal Flags
    if (data.abnormalFlags) {
      fields.push(data.abnormalFlags.join(this.repetitionSeparator));
    } else {
      fields.push('');
    }

    fields.push(''); // probability
    fields.push(''); // nature of abnormal test
    fields.push(data.observationResultStatus || 'F');

    return {
      type: 'OBX',
      fields,
    };
  }

  // Helper methods
  private parseComponents(field: string): string[] {
    return field.split(this.componentSeparator);
  }

  private parseRepeatingField(field: string): string[] {
    return field.split(this.repetitionSeparator);
  }
}

export const hl7Segments = new HL7SegmentsService();