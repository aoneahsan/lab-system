"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSync = void 0;
const dataSync = async (req, res) => {
    console.log('Data sync endpoint called');
    res.json({ status: 'ok', message: 'Data sync endpoint' });
};
exports.dataSync = dataSync;
//# sourceMappingURL=dataSync.js.map