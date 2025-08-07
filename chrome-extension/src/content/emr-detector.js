// EMR Detection and Configuration

const EMR_CONFIGS = {
  epic: {
    name: 'Epic',
    identifiers: ['epic.com', 'Epic Systems', 'MyChart'],
    selectors: {
      patientName: '.patient-name, .PatientHeader-name',
      patientMRN: '.patient-mrn, .PatientHeader-mrn',
      patientDOB: '.patient-dob, .PatientHeader-dob',
      orderButton: '.order-button, .btn-order-lab',
      resultsTab: '.results-tab, .lab-results-link'
    }
  },
  cerner: {
    name: 'Cerner',
    identifiers: ['cerner.com', 'PowerChart', 'Millennium'],
    selectors: {
      patientName: '#patient-name, .patient-banner-name',
      patientMRN: '#patient-mrn, .patient-identifier',
      patientDOB: '#patient-dob, .patient-birthdate',
      orderButton: '.order-entry-button',
      resultsTab: '.results-review-tab'
    }
  },
  allscripts: {
    name: 'Allscripts',
    identifiers: ['allscripts.com', 'Sunrise', 'TouchWorks'],
    selectors: {
      patientName: '.patient-header-name',
      patientMRN: '.patient-header-mrn',
      patientDOB: '.patient-header-dob',
      orderButton: '.order-lab-button',
      resultsTab: '.lab-results-section'
    }
  },
  athenahealth: {
    name: 'athenahealth',
    identifiers: ['athenahealth.com', 'athenaNet'],
    selectors: {
      patientName: '.patient-info-name',
      patientMRN: '.patient-info-id',
      patientDOB: '.patient-info-dob',
      orderButton: '.order-lab-test',
      resultsTab: '.lab-results'
    }
  }
};

class EMRDetector {
  constructor() {
    this.emrType = null;
    this.config = null;
    this.observer = null;
  }

  detect() {
    const url = window.location.href;
    const pageContent = document.body.textContent;

    for (const [type, config] of Object.entries(EMR_CONFIGS)) {
      const isMatch = config.identifiers.some(identifier => 
        url.includes(identifier) || pageContent.includes(identifier)
      );
      
      if (isMatch) {
        this.emrType = type;
        this.config = config;
        console.log(`LabFlow: Detected ${config.name} EMR system`);
        return type;
      }
    }

    console.log('LabFlow: No EMR system detected');
    return null;
  }

  getPatientData() {
    if (!this.config) return null;

    const data = {};
    const selectors = this.config.selectors;

    // Extract patient name
    const nameElement = document.querySelector(selectors.patientName);
    if (nameElement) {
      const fullName = nameElement.textContent.trim();
      const [lastName, firstName] = fullName.includes(',') 
        ? fullName.split(',').map(n => n.trim())
        : [fullName.split(' ').pop(), fullName.split(' ').slice(0, -1).join(' ')];
      
      data.firstName = firstName;
      data.lastName = lastName;
    }

    // Extract MRN
    const mrnElement = document.querySelector(selectors.patientMRN);
    if (mrnElement) {
      data.mrn = mrnElement.textContent.replace(/[^0-9]/g, '');
    }

    // Extract DOB
    const dobElement = document.querySelector(selectors.patientDOB);
    if (dobElement) {
      data.dateOfBirth = this.parseDateOfBirth(dobElement.textContent);
    }

    // Try to extract additional data
    this.extractAdditionalData(data);

    return data;
  }

  parseDateOfBirth(dobText) {
    // Try various date formats
    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{1,2})-(\d{1,2})-(\d{4})/ // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = dobText.match(format);
      if (match) {
        // Normalize to YYYY-MM-DD
        if (format.source.includes('YYYY')) {
          return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        } else {
          const year = match[3];
          const month = match[1].padStart(2, '0');
          const day = match[2].padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      }
    }

    return dobText;
  }

  extractAdditionalData(data) {
    // Try to find gender
    const genderPatterns = [
      { pattern: /Gender:\s*([MF])/i, extract: m => m[1].toUpperCase() },
      { pattern: /Sex:\s*([MF])/i, extract: m => m[1].toUpperCase() },
      { pattern: /\b(Male|Female)\b/i, extract: m => m[1].charAt(0).toUpperCase() }
    ];

    for (const { pattern, extract } of genderPatterns) {
      const match = document.body.textContent.match(pattern);
      if (match) {
        data.gender = extract(match);
        break;
      }
    }

    // Try to find phone number
    const phonePattern = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/;
    const phoneMatch = document.body.textContent.match(phonePattern);
    if (phoneMatch) {
      data.phone = phoneMatch[0].replace(/[^\d]/g, '');
    }
  }

  findOrderButton() {
    if (!this.config) return null;
    return document.querySelector(this.config.selectors.orderButton);
  }

  findResultsSection() {
    if (!this.config) return null;
    return document.querySelector(this.config.selectors.resultsTab);
  }

  observePatientChange(callback) {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      const hasRelevantChange = mutations.some(mutation => {
        const target = mutation.target;
        return target.matches && (
          target.matches(this.config.selectors.patientName) ||
          target.matches(this.config.selectors.patientMRN) ||
          target.closest(this.config.selectors.patientName) ||
          target.closest(this.config.selectors.patientMRN)
        );
      });

      if (hasRelevantChange) {
        callback(this.getPatientData());
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Export for use in other scripts
window.LabFlowEMRDetector = new EMRDetector();