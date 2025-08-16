import React, { useState } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Users, TestTube, FileText, 
  CreditCard, Package, BarChart3, Smartphone, Shield, Activity,
  Globe, Zap, ClipboardCheck, Keyboard, Hand
} from 'lucide-react';
import { hotkeysService } from '@/services/hotkeys.service';
import { Link } from 'react-router-dom';

interface FeatureSlide {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
}

const featureSlides: FeatureSlide[] = [
  {
    id: 'patient-management',
    title: 'Patient Management',
    icon: <Users className="h-12 w-12 text-primary-600" />,
    description: 'Comprehensive patient record management system',
    features: [
      'Complete patient demographics and medical history',
      'Insurance information and document management',
      'Appointment scheduling and reminders',
      'Patient portal for results and reports',
      'Barcode/QR code generation for quick access',
    ],
  },
  {
    id: 'test-processing',
    title: 'Test & Sample Processing',
    icon: <TestTube className="h-12 w-12 text-primary-600" />,
    description: 'Advanced laboratory test and sample management',
    features: [
      'LOINC-integrated test catalog',
      'Custom test panels and profiles',
      'Sample collection and tracking',
      'Barcode scanning for sample identification',
      'Chain of custody documentation',
    ],
  },
  {
    id: 'results-reporting',
    title: 'Results & Reporting',
    icon: <FileText className="h-12 w-12 text-primary-600" />,
    description: 'Efficient result entry and report generation',
    features: [
      'Quick result entry with validation',
      'Critical value alerts and notifications',
      'PDF report generation with digital signatures',
      'Result history and trend analysis',
      'Automated report delivery via email/SMS',
    ],
  },
  {
    id: 'billing-insurance',
    title: 'Billing & Insurance',
    icon: <CreditCard className="h-12 w-12 text-primary-600" />,
    description: 'Complete billing and insurance claim management',
    features: [
      'Insurance claim processing and tracking',
      'Multiple payment methods support',
      'Automated invoice generation',
      'Payment reminders and collections',
      'Financial reports and analytics',
    ],
  },
  {
    id: 'inventory-management',
    title: 'Inventory Management',
    icon: <Package className="h-12 w-12 text-primary-600" />,
    description: 'Smart inventory tracking and management',
    features: [
      'Real-time inventory tracking',
      'Automatic reorder alerts',
      'Vendor management',
      'Expiry date tracking',
      'Stock movement reports',
    ],
  },
  {
    id: 'quality-control',
    title: 'Quality Control',
    icon: <ClipboardCheck className="h-12 w-12 text-primary-600" />,
    description: 'Comprehensive quality assurance system',
    features: [
      'QC run management and tracking',
      'Levey-Jennings charts',
      'Westgard rules implementation',
      'Corrective action documentation',
      'Proficiency testing management',
    ],
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    icon: <Keyboard className="h-12 w-12 text-primary-600" />,
    description: 'Quick navigation and actions with keyboard shortcuts',
    features: [
      'Alt+D: Go to Dashboard',
      'Alt+P: Go to Patients',
      'Alt+T: Go to Tests',
      'Alt+S: Go to Samples',
      'Alt+R: Go to Results',
      'Ctrl+N: Create New (context-aware)',
      'Ctrl+S: Save current form',
      'Ctrl+K: Open global search',
      'Ctrl+Shift+H: Show all shortcuts',
      'Escape: Go back or close modal',
    ],
  },
  {
    id: 'touch-gestures',
    title: 'Touch Gestures (Mobile)',
    icon: <Hand className="h-12 w-12 text-primary-600" />,
    description: 'Intuitive touch gestures for mobile devices',
    features: [
      'Swipe Right: Go back',
      'Swipe Left: Go forward',
      'Swipe Down: Pull to refresh',
      'Long Press: Show context menu',
      'Pinch: Zoom out',
      'Spread: Zoom in',
      'Double Tap: Quick action',
    ],
  },
  {
    id: 'mobile-access',
    title: 'Mobile Access',
    icon: <Smartphone className="h-12 w-12 text-primary-600" />,
    description: 'Full-featured mobile applications',
    features: [
      'Native iOS and Android apps',
      'Role-based mobile interfaces',
      'Offline mode with data sync',
      'Biometric authentication',
      'Push notifications for critical alerts',
    ],
  },
  {
    id: 'emr-integration',
    title: 'EMR Integration',
    icon: <Globe className="h-12 w-12 text-primary-600" />,
    description: 'Seamless integration with healthcare systems',
    features: [
      'HL7/FHIR standard compliance',
      'Chrome extension for EMR integration',
      'Direct result transmission',
      'Bidirectional data exchange',
      'Support for major EMR systems',
    ],
  },
  {
    id: 'workflow-automation',
    title: 'Workflow Automation',
    icon: <Zap className="h-12 w-12 text-primary-600" />,
    description: 'Intelligent automation for efficiency',
    features: [
      'Customizable workflow rules',
      'Automated TAT monitoring',
      'Smart notifications and escalations',
      'Auto-validation of normal results',
      'Batch processing capabilities',
    ],
  },
  {
    id: 'analytics-reporting',
    title: 'Analytics & Reporting',
    icon: <BarChart3 className="h-12 w-12 text-primary-600" />,
    description: 'Powerful analytics and business intelligence',
    features: [
      'Real-time dashboards',
      'Custom report builder',
      'Performance metrics tracking',
      'Revenue analytics',
      'Exportable reports in multiple formats',
    ],
  },
  {
    id: 'security-compliance',
    title: 'Security & Compliance',
    icon: <Shield className="h-12 w-12 text-primary-600" />,
    description: 'Enterprise-grade security and compliance',
    features: [
      'HIPAA compliant infrastructure',
      'Role-based access control',
      'Audit trail for all activities',
      'Data encryption at rest and in transit',
      'Regular automated backups',
    ],
  },
  {
    id: 'home-collection',
    title: 'Home Collection Service',
    icon: <Activity className="h-12 w-12 text-primary-600" />,
    description: 'Manage home sample collection services',
    features: [
      'Online booking for home collections',
      'Route optimization for phlebotomists',
      'Real-time tracking of collection status',
      'Mobile app for field staff',
      'Automated customer notifications',
    ],
  },
];

interface FeatureInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeatureInfoModal: React.FC<FeatureInfoModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const handlePrevious = () => {
    setCurrentSlide((prev) => (prev === 0 ? featureSlides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev === featureSlides.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index: number) => {
    setCurrentSlide(index);
  };

  const slide = featureSlides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              LabFlow Features
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Slide Content */}
            <div className="min-h-[400px]">
              <div className="flex flex-col items-center text-center mb-6">
                {slide.icon}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
                  {slide.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-lg">
                  {slide.description}
                </p>
              </div>

              {/* Features List */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Key Features
                  </h4>
                  {(slide.id === 'keyboard-shortcuts' || slide.id === 'touch-gestures') && (
                    <Link
                      to="/settings/hotkeys"
                      onClick={onClose}
                      className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Customize Shortcuts →
                    </Link>
                  )}
                </div>
                <ul className="space-y-3">
                  {slide.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300 font-mono text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={handlePrevious}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                Previous
              </button>

              {/* Dots Indicator */}
              <div className="flex gap-2">
                {featureSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      index === currentSlide
                        ? 'bg-primary-600 w-8'
                        : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Next
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Slide {currentSlide + 1} of {featureSlides.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};