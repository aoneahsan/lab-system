import {
	collection,
	doc,
	getDocs,
	getDoc,
	addDoc,
	updateDoc,
	query,
	where,
	orderBy,
	limit,
	Timestamp,
	serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/config/firebase-collections';
import type {
	QCMaterial,
	QCRun,
	QCResult,
	QCStatistics,
	QCFilter,
	QCMaterialFormData,
	QCRunFormData,
	QCResultStatus,
	QCLevel,
	WestgardRule,
	WestgardViolation,
	QCDashboardStats,
	QCDataPoint,
} from '@/types/qc.types';

// Westgard rules evaluation
const evaluateWestgardRules = (
	value: number,
	mean: number,
	sd: number,
	previousValues: number[] = [],
	rules: WestgardRule[] = ['13s', '22s', 'R4s', '41s', '10x']
): WestgardViolation[] => {
	const violations: WestgardViolation[] = [];
	const zscore = (value - mean) / sd;

	// Add current value to previous values for multi-point rules
	const allValues = [...previousValues, value];
	const allZScores = allValues.map((v) => (v - mean) / sd);

	rules.forEach((rule) => {
		switch (rule) {
			case '12s':
				if (Math.abs(zscore) > 2) {
					violations.push({
						rule: '12s',
						description: '1 control exceeds 2SD',
						severity: 'warning',
						dataPoints: [value],
					});
				}
				break;

			case '13s':
				if (Math.abs(zscore) > 3) {
					violations.push({
						rule: '13s',
						description: '1 control exceeds 3SD',
						severity: 'rejection',
						dataPoints: [value],
					});
				}
				break;

			case '22s':
				if (allZScores.length >= 2) {
					const last2 = allZScores.slice(-2);
					if (last2.every((z) => z > 2) || last2.every((z) => z < -2)) {
						violations.push({
							rule: '22s',
							description: '2 consecutive controls exceed 2SD on same side',
							severity: 'rejection',
							dataPoints: allValues.slice(-2),
						});
					}
				}
				break;

			case 'R4s':
				if (allValues.length >= 2) {
					const last2 = allValues.slice(-2);
					const range = Math.abs(last2[1] - last2[0]);
					if (range > 4 * sd) {
						violations.push({
							rule: 'R4s',
							description: 'Range of 2 consecutive controls exceeds 4SD',
							severity: 'rejection',
							dataPoints: last2,
						});
					}
				}
				break;

			case '41s':
				if (allZScores.length >= 4) {
					const last4 = allZScores.slice(-4);
					if (last4.every((z) => z > 1) || last4.every((z) => z < -1)) {
						violations.push({
							rule: '41s',
							description: '4 consecutive controls exceed 1SD on same side',
							severity: 'rejection',
							dataPoints: allValues.slice(-4),
						});
					}
				}
				break;

			case '10x':
				if (allZScores.length >= 10) {
					const last10 = allZScores.slice(-10);
					if (last10.every((z) => z > 0) || last10.every((z) => z < 0)) {
						violations.push({
							rule: '10x',
							description: '10 consecutive controls on same side of mean',
							severity: 'rejection',
							dataPoints: allValues.slice(-10),
						});
					}
				}
				break;
		}
	});

	return violations;
};

// Calculate statistics
const calculateStatistics = (
	values: number[]
): {
	mean: number;
	sd: number;
	cv: number;
	min: number;
	max: number;
	median: number;
} => {
	const n = values.length;
	if (n === 0) {
		return { mean: 0, sd: 0, cv: 0, min: 0, max: 0, median: 0 };
	}

	// Mean
	const mean = values.reduce((sum, val) => sum + val, 0) / n;

	// Standard deviation
	const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
	const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (n - 1);
	const sd = Math.sqrt(variance);

	// CV
	const cv = mean !== 0 ? (sd / mean) * 100 : 0;

	// Min, max, median
	const sorted = [...values].sort((a, b) => a - b);
	const min = sorted[0];
	const max = sorted[n - 1];
	const median =
		n % 2 === 0
			? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
			: sorted[Math.floor(n / 2)];

	return { mean, sd, cv, min, max, median };
};

export const qcService = {
	// QC Materials
	async getQCMaterials(tenantId: string): Promise<QCMaterial[]> {
		const materialsRef = collection(db, COLLECTIONS.QC_MATERIALS);
		const q = query(
			materialsRef,
			where('tenantId', '==', tenantId),
			where('active', '==', true),
			orderBy('name')
		);

		const snapshot = await getDocs(q);
		return snapshot.docs.map(
			(doc) => ({ id: doc.id, ...doc.data() } as QCMaterial)
		);
	},

	async getQCMaterial(
		tenantId: string,
		materialId: string
	): Promise<QCMaterial | null> {
		const materialRef = doc(db, COLLECTIONS.QC_MATERIALS, materialId);
		const materialDoc = await getDoc(materialRef);

		if (!materialDoc.exists() || materialDoc.data()?.tenantId !== tenantId) {
			return null;
		}

		return { id: materialDoc.id, ...materialDoc.data() } as QCMaterial;
	},

	async createQCMaterial(
		tenantId: string,
		userId: string,
		data: QCMaterialFormData
	): Promise<string> {
		const now = serverTimestamp() as Timestamp;

		const materialData: Omit<QCMaterial, 'id'> = {
			tenantId,
			...data,
			expirationDate: Timestamp.fromDate(data.expirationDate),
			receivedDate: Timestamp.fromDate(data.receivedDate),
			openedDate: data.openedDate
				? Timestamp.fromDate(data.openedDate)
				: undefined,
			active: true,
			analytes: data.analytes.map((analyte) => ({
				...analyte,
				westgardRules: ['13s', '22s', 'R4s', '41s', '10x'] as WestgardRule[],
			})),
			createdAt: now,
			createdBy: userId,
			updatedAt: now,
			updatedBy: userId,
		};

		const docRef = await addDoc(
			collection(db, COLLECTIONS.QC_MATERIALS),
			materialData
		);
		return docRef.id;
	},

	async updateQCMaterial(
		tenantId: string,
		userId: string,
		materialId: string,
		data: Partial<QCMaterial>
	): Promise<void> {
		const materialRef = doc(db, COLLECTIONS.QC_MATERIALS, materialId);
		const materialDoc = await getDoc(materialRef);

		if (!materialDoc.exists() || materialDoc.data()?.tenantId !== tenantId) {
			throw new Error('QC Material not found');
		}

		await updateDoc(materialRef, {
			...data,
			updatedAt: serverTimestamp(),
			updatedBy: userId,
		});
	},

	// QC Runs
	async getQCRuns(tenantId: string, filter?: QCFilter): Promise<QCRun[]> {
		const runsRef = collection(db, COLLECTIONS.QC_RUNS);
		let q = query(runsRef, where('tenantId', '==', tenantId));

		if (filter?.materialId) {
			q = query(q, where('materialId', '==', filter.materialId));
		}
		if (filter?.testCode) {
			q = query(
				q,
				where('results', 'array-contains-any', [{ testCode: filter.testCode }])
			);
		}
		if (filter?.level) {
			q = query(q, where('level', '==', filter.level));
		}
		if (filter?.shift) {
			q = query(q, where('shift', '==', filter.shift));
		}
		if (filter?.status) {
			q = query(q, where('status', '==', filter.status));
		}

		q = query(q, orderBy('runDate', 'desc'), limit(100));

		const snapshot = await getDocs(q);
		return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as QCRun));
	},

	async getQCRun(tenantId: string, runId: string): Promise<QCRun | null> {
		const runRef = doc(db, COLLECTIONS.QC_RUNS, runId);
		const runDoc = await getDoc(runRef);

		if (!runDoc.exists() || runDoc.data()?.tenantId !== tenantId) {
			return null;
		}

		return { id: runDoc.id, ...runDoc.data() } as QCRun;
	},

	async createQCRun(
		tenantId: string,
		userId: string,
		data: QCRunFormData
	): Promise<string> {
		const now = serverTimestamp() as Timestamp;

		// Get material details
		const material = await this.getQCMaterial(tenantId, data.materialId);
		if (!material) {
			throw new Error('QC Material not found');
		}

		// Get previous values for Westgard rules evaluation
		const previousRuns = await this.getQCRuns(tenantId, {
			materialId: data.materialId,
			startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
		});

		// Process results
		const results: QCResult[] = data.results.map((result) => {
			const analyte = material.analytes.find(
				(a) => a.testCode === result.testCode
			);
			if (!analyte) {
				throw new Error(`Test ${result.testCode} not found in material`);
			}

			// Get previous values for this test
			const previousValues = previousRuns
				.flatMap((run) => run.results)
				.filter((r) => r.testCode === result.testCode && !r.isExcluded)
				.map((r) => r.value)
				.slice(-20); // Last 20 values

			// Evaluate Westgard rules
			const violations = evaluateWestgardRules(
				result.value,
				analyte.targetMean,
				analyte.targetSD,
				previousValues,
				analyte.westgardRules
			);

			// Determine status
			let status: QCResultStatus = 'pass';
			if (violations.some((v) => v.severity === 'rejection')) {
				status = 'fail';
			} else if (violations.length > 0) {
				status = 'warning';
			}

			// Calculate z-score
			const zscore = (result.value - analyte.targetMean) / analyte.targetSD;

			return {
				id: `result-${Date.now()}-${Math.random()}`,
				testCode: result.testCode,
				testName: analyte.testName,
				value: result.value,
				unit: analyte.unit,
				status,
				zscore,
				violatedRules: violations,
				isOutlier: Math.abs(zscore) > 4,
				isExcluded: false,
				resultTime: now,
				enteredBy: userId,
			};
		});

		// Determine overall run status
		const runStatus = results.some((r) => r.status === 'fail')
			? 'rejected'
			: 'completed';

		const runData: Omit<QCRun, 'id'> = {
			tenantId,
			runNumber: `QC-${Date.now()}`,
			runDate: Timestamp.fromDate(data.runDate),
			shift: data.shift,
			materialId: material.id,
			materialName: material.name,
			materialLot: material.lotNumber,
			level: material.level,
			instrumentId: data.instrumentId,
			temperature: data.temperature,
			humidity: data.humidity,
			operator: userId, // TODO: Get user name
			operatorId: userId,
			results,
			status: runStatus,
			comments: data.comments,
			createdAt: now,
			createdBy: userId,
			updatedAt: now,
			updatedBy: userId,
		};

		const docRef = await addDoc(collection(db, COLLECTIONS.QC_RUNS), runData);

		// Update statistics
		await this.updateQCStatistics(tenantId, userId, material.id);

		return docRef.id;
	},

	async updateQCRun(
		tenantId: string,
		userId: string,
		runId: string,
		data: Partial<QCRun>
	): Promise<void> {
		const runRef = doc(db, COLLECTIONS.QC_RUNS, runId);
		const runDoc = await getDoc(runRef);

		if (!runDoc.exists() || runDoc.data()?.tenantId !== tenantId) {
			throw new Error('QC Run not found');
		}

		await updateDoc(runRef, {
			...data,
			updatedAt: serverTimestamp(),
			updatedBy: userId,
		});
	},

	async reviewQCRun(
		tenantId: string,
		userId: string,
		runId: string,
		accept: boolean,
		comments?: string
	): Promise<void> {
		const status = accept ? 'accepted' : 'rejected';

		await this.updateQCRun(tenantId, userId, runId, {
			status,
			reviewedBy: userId,
			reviewedAt: serverTimestamp() as Timestamp,
			comments,
		});
	},

	// QC Statistics
	async getQCStatistics(
		tenantId: string,
		materialId: string,
		testCode: string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		_startDate?: Date, // TODO: Implement date filtering
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		_endDate?: Date // TODO: Implement date filtering
	): Promise<QCStatistics | null> {
		const statsRef = collection(db, COLLECTIONS.QC_STATISTICS);
		const q = query(
			statsRef,
			where('tenantId', '==', tenantId),
			where('materialId', '==', materialId),
			where('testCode', '==', testCode),
			orderBy('calculatedAt', 'desc'),
			limit(1)
		);

		const snapshot = await getDocs(q);
		if (snapshot.empty) {
			return null;
		}

		return {
			id: snapshot.docs[0].id,
			...snapshot.docs[0].data(),
		} as QCStatistics;
	},

	async updateQCStatistics(
		tenantId: string,
		userId: string,
		materialId: string
	): Promise<void> {
		const material = await this.getQCMaterial(tenantId, materialId);
		if (!material) return;

		// Get all runs for this material in the last 30 days
		const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const runs = await this.getQCRuns(tenantId, {
			materialId,
			startDate,
		});

		// Calculate statistics for each analyte
		for (const analyte of material.analytes) {
			const dataPoints: QCDataPoint[] = [];
			const values: number[] = [];

			runs.forEach((run) => {
				const result = run.results.find((r) => r.testCode === analyte.testCode);
				if (result && !result.isExcluded) {
					values.push(result.value);
					dataPoints.push({
						runId: run.id,
						runDate: run.runDate,
						value: result.value,
						zscore: result.zscore || 0,
						status: result.status,
						isExcluded: false,
					});
				}
			});

			if (values.length === 0) continue;

			const stats = calculateStatistics(values);
			const bias =
				((stats.mean - analyte.targetMean) / analyte.targetMean) * 100;
			const totalError = Math.abs(bias) + 1.65 * stats.cv;
			const sigma = analyte.targetCV
				? (analyte.targetCV - Math.abs(bias)) / stats.cv
				: 0;

			const statisticsData: Omit<QCStatistics, 'id'> = {
				tenantId,
				materialId,
				testCode: analyte.testCode,
				level: material.level,
				periodStart: Timestamp.fromDate(startDate),
				periodEnd: serverTimestamp() as Timestamp,
				n: values.length,
				mean: stats.mean,
				sd: stats.sd,
				cv: stats.cv,
				min: stats.min,
				max: stats.max,
				median: stats.median,
				bias,
				totalError,
				sigma,
				dataPoints,
				calculatedAt: serverTimestamp() as Timestamp,
				calculatedBy: userId,
			};

			await addDoc(collection(db, COLLECTIONS.QC_STATISTICS), statisticsData);
		}
	},

	// Dashboard
	async getQCDashboardStats(tenantId: string): Promise<QCDashboardStats> {
		// const today = new Date();
		// today.setHours(0, 0, 0, 0);
		// const todayTimestamp = Timestamp.fromDate(today);

		// Get recent runs
		const runsRef = collection(db, COLLECTIONS.QC_RUNS);
		// const recentRunsQuery = query(
		//   runsRef,
		//   where('tenantId', '==', tenantId),
		//   where('runDate', '>=', todayTimestamp),
		//   orderBy('runDate', 'desc')
		// );

		// const recentRunsSnapshot = await getDocs(recentRunsQuery);
		// const todayRuns = recentRunsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QCRun));

		// Get all runs for statistics
		const allRunsQuery = query(
			runsRef,
			where('tenantId', '==', tenantId),
			orderBy('runDate', 'desc'),
			limit(500)
		);

		const allRunsSnapshot = await getDocs(allRunsQuery);
		const allRuns = allRunsSnapshot.docs.map(
			(doc) => ({ id: doc.id, ...doc.data() } as QCRun)
		);

		// Calculate statistics
		const totalRuns = allRuns.length;
		const passedRuns = allRuns.filter(
			(run) => run.status === 'accepted' || run.status === 'completed'
		).length;
		const failedRuns = allRuns.filter(
			(run) => run.status === 'rejected'
		).length;
		const pendingReview = allRuns.filter(
			(run) => run.status === 'completed' && !run.reviewedBy
		).length;

		const passRate = totalRuns > 0 ? (passedRuns / totalRuns) * 100 : 0;
		const failureRate = totalRuns > 0 ? (failedRuns / totalRuns) * 100 : 0;

		// By level statistics
		const byLevel: Record<string, { runs: number; passRate: number }> = {};
		const levels = ['level1', 'level2', 'level3', 'abnormal', 'normal'];

		levels.forEach((level) => {
			const levelRuns = allRuns.filter((run) => run.level === level);
			const levelPassed = levelRuns.filter(
				(run) => run.status === 'accepted' || run.status === 'completed'
			).length;
			byLevel[level] = {
				runs: levelRuns.length,
				passRate:
					levelRuns.length > 0 ? (levelPassed / levelRuns.length) * 100 : 0,
			};
		});

		// By test statistics
		const testMap = new Map<
			string,
			{ name: string; runs: number; passed: number; values: number[] }
		>();

		allRuns.forEach((run) => {
			run.results.forEach((result) => {
				if (!testMap.has(result.testCode)) {
					testMap.set(result.testCode, {
						name: result.testName,
						runs: 0,
						passed: 0,
						values: [],
					});
				}

				const test = testMap.get(result.testCode)!;
				test.runs++;
				if (result.status === 'pass') test.passed++;
				if (!result.isExcluded) test.values.push(result.value);
			});
		});

		const byTest = Array.from(testMap.entries()).map(([testCode, data]) => {
			const stats = calculateStatistics(data.values);
			return {
				testCode,
				testName: data.name,
				runs: data.runs,
				passRate: data.runs > 0 ? (data.passed / data.runs) * 100 : 0,
				cv: stats.cv,
			};
		});

		// Recent violations
		const recentViolations = allRuns
			.slice(0, 20)
			.filter((run) => run.results.some((r) => r.violatedRules.length > 0))
			.map((run) => ({
				runId: run.id,
				runDate: run.runDate,
				testName:
					run.results.find((r) => r.violatedRules.length > 0)?.testName || '',
				level: run.level,
				violations: run.results
					.filter((r) => r.violatedRules.length > 0)
					.flatMap((r) => r.violatedRules),
			}));

		// Expiring materials
		const materialsRef = collection(db, COLLECTIONS.QC_MATERIALS);
		const materialsQuery = query(
			materialsRef,
			where('tenantId', '==', tenantId),
			where('active', '==', true)
		);

		const materialsSnapshot = await getDocs(materialsQuery);
		const materials = materialsSnapshot.docs.map(
			(doc) => ({ id: doc.id, ...doc.data() } as QCMaterial)
		);

		const expiringMaterials = materials
			.map((material) => {
				const daysUntilExpiration = Math.floor(
					(material.expirationDate.toDate().getTime() - Date.now()) /
						(1000 * 60 * 60 * 24)
				);
				return {
					id: material.id,
					name: material.name,
					lotNumber: material.lotNumber,
					expirationDate: material.expirationDate,
					daysUntilExpiration,
				};
			})
			.filter((m) => m.daysUntilExpiration <= 30)
			.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);

		return {
			totalRuns,
			passRate,
			failureRate,
			pendingReview,
			byLevel: byLevel as Record<QCLevel, { runs: number; passRate: number }>,
			byTest,
			recentViolations,
			expiringMaterials,
		};
	},
};
