// ...existing code...
import { Inject, Injectable, Logger } from '@nestjs/common';
import { TransactionDocument } from 'src/transaction/schemas/transaction.schema';
import { TransactionValidation } from '../transaction-validation';
import { Neo4jService } from 'src/database/neo4j/neo4j.service';
import { GeolocationService } from 'src/geolocation/geolocation.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { SuspiciousBehaviour } from 'src/fraud-system/suspicious-behaviours/suspicious-behaviour';
import { HighFrequencyTransactions } from '../../suspicious-behaviours/impl/high-frequency-transactions';

@Injectable()
export class FrequencyValidation extends TransactionValidation {
  constructor(
    @Inject() private neo4jService: Neo4jService,
    @Inject() private transactionService: TransactionService,
    @Inject() private locationService: GeolocationService,
  ) {
    super();
  }
  private readonly logger = new Logger(FrequencyValidation.name);

  // Configurable thresholds
  private readonly LOOKBACK_DAYS = 30; // how far back to compute baseline
  private readonly MAX_HISTORY = 2000; // cap number of tx to load for baseline
  private readonly MIN_BASELINE_GAPS = 10; // minimum gaps to trust baseline
  private readonly MIN_WINDOW_GAPS = 3; // minimum gaps inside detection window
  private readonly WINDOW_MINUTES = 10; // detection window length in minutes
  private readonly Z_THRESHOLD = 3; // z-score threshold for strong signal
  private readonly RATE_THRESHOLD = 2.0; // fold-change in tx rate considered suspicious
  private readonly GLOBAL_FALLBACK = { medianGapSec: 60 * 60, madSec: 60 * 60 }; // fallback baseline

  private median(values: number[]): number {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private mad(values: number[], med = NaN): number {
    if (!values || values.length === 0) return 0;
    if (isNaN(med)) med = this.median(values);
    const deviations = values.map((v) => Math.abs(v - med));
    return this.median(deviations);
  }

  /**
   * Validate frequency anomalies for a transaction.
   *
   * Approach:
   * - Fetch recent transactions for the sender account (bounded by LOOKBACK_DAYS and MAX_HISTORY).
   * - Compute gaps between consecutive tx timestamps (in seconds), excluding duplicates and malformed timestamps.
   * - Build baseline (median, MAD) from gaps strictly before detection window.
   * - Compute detection window gaps/rate and z-score vs baseline.
   * - Combine z-score and rate thresholds to produce behaviours.
   *
   * Notes:
   * - If account is new or baseline insufficient, use GLOBAL_FALLBACK or mark as "cold" (no alert).
   * - This method is careful with sorting, duplicate removal and UTC timestamps.
   */
  async validate(tx: TransactionDocument): Promise<SuspiciousBehaviour[]> {
    const behaviours: SuspiciousBehaviour[] = [];

    try {
      // Basic validation
      const senderAcc = tx?.snapshot?.request?.senderAccountNumber;
      if (!senderAcc) {
        this.logger.warn('FrequencyValidation: missing sender account number');
        return behaviours;
      }

      // Determine lookback cutoff
      const now = new Date();
      const lookbackCutoff = new Date(
        now.getTime() - this.LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
      );

      // Fetch transactions for this account.
      // Expect transactionService to provide a method that returns recent tx documents sorted by createdAt desc.
      // If not present, implement: find({ $or: [{ senderAccount: acc }, { receiverAccount: acc }] }, { sort: { createdAt: -1 }, limit: MAX_HISTORY })
      const history: TransactionDocument[] =
        await this.transactionService.getTransactionsForAccount(senderAcc, {
          limit: this.MAX_HISTORY,
          since: lookbackCutoff.toISOString(),
        });

      if (!Array.isArray(history) || history.length === 0) {
        // New user / no history -> cold account, no alert but log for metrics
        this.logger.log(`FrequencyValidation: no history for ${senderAcc}`);
        return behaviours;
      }

      // Extract and normalize timestamps (UTC). Use tx.createdAt if present, fallback to snapshot.request.timestamp if available.
      const timestamps = history
        .map((h) => {
          const t = h.createdAt;
          return t instanceof Date && !isNaN(t.getTime()) ? t : null;
        })
        .filter((d): d is Date => d !== null)
        // sort ascending (oldest first) for gap computation
        .sort((a, b) => a.getTime() - b.getTime());

      if (timestamps.length < 2) {
        this.logger.log(
          `FrequencyValidation: insufficient timestamps for ${senderAcc}`,
        );
        return behaviours;
      }

      // Remove exact-duplicate timestamps (possible batching)
      const uniqueTimestamps: Date[] = [];
      for (const t of timestamps) {
        if (
          uniqueTimestamps.length === 0 ||
          uniqueTimestamps[uniqueTimestamps.length - 1].getTime() !==
            t.getTime()
        ) {
          uniqueTimestamps.push(t);
        }
      }

      if (uniqueTimestamps.length < 2) {
        this.logger.log(
          `FrequencyValidation: after dedupe insufficient timestamps for ${senderAcc}`,
        );
        return behaviours;
      }

      // Compute gaps (seconds) between consecutive events
      const gapsSec: number[] = [];
      for (let i = 1; i < uniqueTimestamps.length; i++) {
        const gap =
          (uniqueTimestamps[i].getTime() - uniqueTimestamps[i - 1].getTime()) /
          1000;
        // sanity filter
        if (gap <= 0 || !isFinite(gap) || gap > 365 * 24 * 3600) continue;
        gapsSec.push(gap);
      }

      if (gapsSec.length < 1) {
        this.logger.log(`FrequencyValidation: no valid gaps for ${senderAcc}`);
        return behaviours;
      }

      // Define detection window end = tx.createdAt (use now if missing)
      const detectionTime = tx.createdAt ? new Date(tx.createdAt) : new Date();
      const windowStart = new Date(
        detectionTime.getTime() - this.WINDOW_MINUTES * 60 * 1000,
      );

      // Split gaps into baseline (before windowStart) and window gaps (those that end inside window)
      const baselineGaps: number[] = [];
      const windowGaps: number[] = [];

      // To get gap timestamps we need pairs; derive the timestamp for the later event of each gap
      const eventTimes = uniqueTimestamps;
      for (let i = 1; i < eventTimes.length; i++) {
        const later = eventTimes[i];
        const earlier = eventTimes[i - 1];
        const gap = (later.getTime() - earlier.getTime()) / 1000;
        if (!isFinite(gap) || gap <= 0) continue;
        if (later < windowStart) {
          baselineGaps.push(gap);
        } else if (later >= windowStart && later <= detectionTime) {
          windowGaps.push(gap);
        } else {
          // beyond detection window - ignore for this detection run
        }
      }

      // If baseline not enough, fallback to global baseline or skip alert
      let baselineMedian = this.GLOBAL_FALLBACK.medianGapSec;
      let baselineMad = this.GLOBAL_FALLBACK.madSec;

      if (baselineGaps.length >= this.MIN_BASELINE_GAPS) {
        baselineMedian = this.median(baselineGaps);
        baselineMad = Math.max(this.mad(baselineGaps, baselineMedian), 1); // avoid zero MAD
      } else {
        this.logger.log(
          `FrequencyValidation: baseline too small (${baselineGaps.length}) for ${senderAcc}, using fallback`,
        );
      }

      // Detection window stats
      const windowCount = windowGaps.length;
      const windowAvgGap =
        windowGaps.length > 0
          ? windowGaps.reduce((s, v) => s + v, 0) / windowGaps.length
          : Infinity;
      // Convert to rate: events per minute inside window
      const windowDurationSec = Math.min(
        (detectionTime.getTime() - windowStart.getTime()) / 1000,
        Math.max(60, this.WINDOW_MINUTES * 60),
      );
      const txRate = windowGaps.length / (windowDurationSec / 60); // tx per minute

      // Baseline rate (approx) from median gap -> events per minute
      const baselineRate = baselineMedian > 0 ? 60 / baselineMedian : 0;
      const rateFold =
        baselineRate > 0 ? txRate / baselineRate : Number.POSITIVE_INFINITY;

      // Z-score like signal: (baselineMedian - windowAvgGap) / MAD -> large positive means gaps decreased => more frequent
      const z = (baselineMedian - windowAvgGap) / baselineMad;

      this.logger.log({
        msg: 'FrequencyValidation stats',
        account: senderAcc,
        baselineMedian,
        baselineMad,
        windowCount,
        windowAvgGap,
        txRate,
        baselineRate,
        rateFold,
        z,
      });

      const strongZ = z >= this.Z_THRESHOLD;
      const strongRate =
        rateFold >= this.RATE_THRESHOLD && windowCount >= this.MIN_WINDOW_GAPS;

      if ((strongZ && windowCount >= this.MIN_WINDOW_GAPS) || strongRate) {
        const behaviour = new HighFrequencyTransactions({
          z,
          rateFold,
          windowCount,
          baselineMedian,
          baselineMad,
          windowAvgGap,
          txRate,
          baselineRate,
        });

        behaviours.push(behaviour);
      } else {
        this.logger.log(
          `FrequencyValidation: no significant anomaly for ${senderAcc}`,
        );
      }

      return behaviours;
    } catch (error) {
      this.logger.error(
        `FrequencyValidation error: ${error?.message || error}`,
      );
      return [];
    }
  }
}
