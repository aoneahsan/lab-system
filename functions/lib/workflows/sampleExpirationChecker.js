"use strict";
const __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    let desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
const __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
const __importStar = (this && this.__importStar) || (function () {
    let ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            const ar = [];
            for (const k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        const result = {};
        if (mod != null) for (let k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleExpirationChecker = void 0;
const admin = __importStar(require("firebase-admin"));
const sampleExpirationChecker = async () => {
    console.log('Checking for expiring samples...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expiringSamples = await admin.firestore()
        .collection('labflow_samples')
        .where('expirationDate', '<=', tomorrow)
        .where('status', 'in', ['collected', 'in_transit', 'received'])
        .get();
    console.log(`Found ${expiringSamples.size} expiring samples`);
    // Process and notify about expiring samples
    for (const doc of expiringSamples.docs) {
        const sample = doc.data();
        console.log(`Sample ${sample.sampleNumber} expires on ${sample.expirationDate.toDate()}`);
    }
};
exports.sampleExpirationChecker = sampleExpirationChecker;
//# sourceMappingURL=sampleExpirationChecker.js.map