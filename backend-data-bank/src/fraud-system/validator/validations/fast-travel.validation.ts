import { Inject, Injectable, Logger } from '@nestjs/common';
import {} from 'src/fraud-system/dto/fraud.dto';
import { TransactionDocument } from 'src/transaction/schemas/transaction.schema';
import { TransactionValidation } from '../transaction-validation';
import { Neo4jService } from 'src/database/neo4j/neo4j.service';
import { GeolocationService } from 'src/geolocation/geolocation.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { AccountService } from 'src/account/account.service';
import {
  LocationPoint,
  NominatimLocationRequestDto,
} from 'src/geolocation/dto/nominatim.dto';
import { SuspiciousBehaviour } from 'src/fraud-system/suspicious-behaviours/suspicious-behaviour';
import { FastTravel } from 'src/fraud-system/suspicious-behaviours/impl/fast-travel.suspicious-behaviour';

@Injectable()
export class FastTravelValidation extends TransactionValidation {
  constructor(
    @Inject() private neo4jService: Neo4jService,
    @Inject() private transactionService: TransactionService,
    @Inject() private locationService: GeolocationService,
    @Inject() private accountService: AccountService,
  ) {
    super();
  }

  private readonly logger = new Logger(FastTravelValidation.name);

  // Configurable thresholds
  private readonly MAX_HUMAN_SPEED_KMH = 900; // Commercial airplane speed
  private readonly MAX_REASONABLE_SPEED_KMH = 120; // Car speed for suspicious threshold
  private readonly MIN_TIME_GAP_HOURS = 0.5; // Minimum time gap to consider (30 minutes)
  private readonly LOOKBACK_LIMIT = 5; // Check last 5 transactions
  private readonly MIN_DISTANCE_FOR_CHECK = 50; // Only check if distance > 50km

  async validate(tx: TransactionDocument): Promise<SuspiciousBehaviour[]> {
    const behaviours: SuspiciousBehaviour[] = [];

    try {
      const snapshot = tx.snapshot;
      if (!snapshot?.request) {
        this.logger.warn('FastTravelValidation: missing transaction snapshot');
        return behaviours;
      }

      const { senderAccountNumber, location } = snapshot.request;

      if (!location) {
        this.logger.log(
          'FastTravelValidation: no location data in transaction',
        );
        return behaviours;
      }

      // Get current transaction location and time
      const currentLocation = await this.parseTransactionLocation(location);
      const currentTime = tx.createdAt || new Date();

      if (!currentLocation) {
        this.logger.warn(
          `FastTravelValidation: could not parse location: ${location}`,
        );
        return behaviours;
      }

      // Get recent transaction history for the sender
      const recentTxs = await this.getRecentTransactions(senderAccountNumber);

      if (recentTxs.length === 0) {
        // First transaction - use account's bank branch as reference
        const referenceLocation =
          await this.getAccountReferenceLocation(senderAccountNumber);
        if (referenceLocation) {
          await this.checkTravelFromReference(
            currentLocation,
            currentTime,
            referenceLocation,
            behaviours,
          );
        }
        return behaviours;
      }

      // Check travel feasibility from recent transactions
      await this.checkFastTravelFromHistory(
        currentLocation,
        currentTime,
        recentTxs,
        behaviours,
      );

      return behaviours;
    } catch (error) {
      this.logger.error(
        `FastTravelValidation error: ${error?.message || error}`,
      );
      return [];
    }
  }

  private async parseTransactionLocation(
    location: string,
  ): Promise<LocationPoint | null> {
    try {
      // Handle different location formats
      if (location.includes(',')) {
        const parts = location.split(',').map((p) => p.trim());

        // Check if it's coordinates (numbers)
        if (
          parts.length === 2 &&
          !isNaN(parseFloat(parts[0])) &&
          !isNaN(parseFloat(parts[1]))
        ) {
          return {
            lat: parseFloat(parts[0]),
            lon: parseFloat(parts[1]),
          };
        }

        // Otherwise treat as city, country
        const locationRequest: NominatimLocationRequestDto = {
          city: parts[0],
          country: parts.length > 1 ? parts[1] : undefined,
        };

        const result =
          await this.locationService.getLocationData(locationRequest);
        return {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
        };
      }

      // Single location (city or country)
      const locationRequest: NominatimLocationRequestDto = {
        city: location,
      };

      const result =
        await this.locationService.getLocationData(locationRequest);
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
      };
    } catch (error) {
      this.logger.error(
        `Failed to parse location "${location}": ${error?.message}`,
      );
      return null;
    }
  }

  private async getRecentTransactions(senderAccountNumber: string): Promise<
    Array<{
      location: LocationPoint;
      time: Date;
      transactionId: string;
    }>
  > {
    try {
      const recentTxs = await this.transactionService.getTransactionsForAccount(
        senderAccountNumber,
        {
          limit: this.LOOKBACK_LIMIT,
          since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
        },
      );

      const locationTxs: Array<{
        location: LocationPoint;
        time: Date;
        transactionId: string;
      }> = [];

      for (const histTx of recentTxs) {
        try {
          const histLocation = histTx.snapshot?.request?.location;
          const histTime = histTx.createdAt;

          if (histLocation && histTime) {
            const parsedLocation =
              await this.parseTransactionLocation(histLocation);
            if (parsedLocation) {
              locationTxs.push({
                location: parsedLocation,
                time: new Date(histTime),
                transactionId: histTx.id,
              });
            }
          }
        } catch (error) {
          this.logger.warn(
            `Failed to parse historical transaction location: ${error?.message}`,
          );
        }
      }

      // Sort by time (most recent first)
      return locationTxs.sort((a, b) => b.time.getTime() - a.time.getTime());
    } catch (error) {
      this.logger.error(`Failed to get recent transactions: ${error?.message}`);
      return [];
    }
  }

  private async getAccountReferenceLocation(
    senderAccountNumber: string,
  ): Promise<LocationPoint | null> {
    try {
      // Get user data for fallback to user's registered location
      const user =
        await this.accountService.getUserDocumentByAccountNumber(
          senderAccountNumber,
        );

      if (user?.country) {
        const locationRequest: NominatimLocationRequestDto = {
          city: user.region,
          country: user.country,
        };

        const result =
          await this.locationService.getLocationData(locationRequest);
        return {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
        };
      }

      // Alternative: get account's bank branch location
      const account =
        await this.accountService.getAccountDocumentByAccountNumber(
          senderAccountNumber,
        );
      if (account?.bankBranch) {
        const locationRequest: NominatimLocationRequestDto = {
          city: account.bankBranch,
        };

        const result =
          await this.locationService.getLocationData(locationRequest);
        return {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
        };
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Failed to get account reference location: ${error?.message}`,
      );
      return null;
    }
  }

  private async checkTravelFromReference(
    currentLocation: LocationPoint,
    currentTime: Date,
    referenceLocation: LocationPoint,
    behaviours: SuspiciousBehaviour[],
  ): Promise<void> {
    try {
      const distance =
        (await this.locationService.calculateDistanceBetweenPoints(
          referenceLocation,
          currentLocation,
        )) as number;

      if (distance < this.MIN_DISTANCE_FOR_CHECK) {
        return; // Too close to be suspicious
      }

      // For first transaction, assume some reasonable time gap (e.g., account created recently)
      // This is a simplified check - in practice you'd want to check account creation time
      const assumedTimeGap = 24; // Assume 24 hours since account creation
      const requiredSpeed = distance / assumedTimeGap;

      if (requiredSpeed > this.MAX_REASONABLE_SPEED_KMH) {
        const behaviour = new FastTravel({
          distance,
          timeGap: assumedTimeGap,
          requiredSpeed,
          maxHumanSpeed: this.MAX_HUMAN_SPEED_KMH,
          type: 'first_transaction_reference',
          referenceType: 'account_location',
        });

        behaviours.push(behaviour);
        this.logger.log(
          `FastTravel detected from reference: ${distance.toFixed(0)}km in ${assumedTimeGap}h = ${requiredSpeed.toFixed(0)}km/h`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error checking travel from reference: ${error?.message}`,
      );
    }
  }

  private async checkFastTravelFromHistory(
    currentLocation: LocationPoint,
    currentTime: Date,
    recentTxs: Array<{
      location: LocationPoint;
      time: Date;
      transactionId: string;
    }>,
    behaviours: SuspiciousBehaviour[],
  ): Promise<void> {
    try {
      // Check against the most recent transaction with location
      const mostRecent = recentTxs[0];
      if (!mostRecent) return;

      const distance =
        (await this.locationService.calculateDistanceBetweenPoints(
          mostRecent.location,
          currentLocation,
        )) as number;

      if (distance < this.MIN_DISTANCE_FOR_CHECK) {
        return; // Too close to be suspicious
      }

      // Calculate time gap in hours
      const timeGapMs = currentTime.getTime() - mostRecent.time.getTime();
      const timeGapHours = timeGapMs / (1000 * 60 * 60);

      // Skip if time gap is too small (might be duplicate transactions)
      if (timeGapHours < this.MIN_TIME_GAP_HOURS) {
        return;
      }

      // Calculate required speed
      const requiredSpeed = distance / timeGapHours;

      // Check if travel is suspicious or impossible
      if (requiredSpeed > this.MAX_REASONABLE_SPEED_KMH) {
        const behaviour = new FastTravel({
          distance,
          timeGap: timeGapHours,
          requiredSpeed,
          maxHumanSpeed: this.MAX_HUMAN_SPEED_KMH,
          type: 'consecutive_transactions',
          previousTransactionId: mostRecent.transactionId,
          previousTime: mostRecent.time.toISOString(),
          currentTime: currentTime.toISOString(),
        });

        behaviours.push(behaviour);
        this.logger.log(
          `FastTravel detected: ${distance.toFixed(0)}km in ${timeGapHours.toFixed(1)}h = ${requiredSpeed.toFixed(0)}km/h`,
        );
      }

      // Also check against other recent transactions for pattern detection
      for (let i = 1; i < Math.min(recentTxs.length, 3); i++) {
        const olderTx = recentTxs[i];
        const olderDistance =
          (await this.locationService.calculateDistanceBetweenPoints(
            olderTx.location,
            currentLocation,
          )) as number;

        const olderTimeGapMs = currentTime.getTime() - olderTx.time.getTime();
        const olderTimeGapHours = olderTimeGapMs / (1000 * 60 * 60);

        if (
          olderTimeGapHours >= this.MIN_TIME_GAP_HOURS &&
          olderDistance >= this.MIN_DISTANCE_FOR_CHECK
        ) {
          const olderRequiredSpeed = olderDistance / olderTimeGapHours;

          if (olderRequiredSpeed > this.MAX_HUMAN_SPEED_KMH) {
            const behaviour = new FastTravel({
              distance: olderDistance,
              timeGap: olderTimeGapHours,
              requiredSpeed: olderRequiredSpeed,
              maxHumanSpeed: this.MAX_HUMAN_SPEED_KMH,
              type: 'pattern_detection',
              previousTransactionId: olderTx.transactionId,
              previousTime: olderTx.time.toISOString(),
              currentTime: currentTime.toISOString(),
              gapPosition: i + 1,
            });

            behaviours.push(behaviour);
            this.logger.log(
              `FastTravel pattern detected: ${olderDistance.toFixed(0)}km in ${olderTimeGapHours.toFixed(1)}h = ${olderRequiredSpeed.toFixed(0)}km/h`,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Error checking fast travel from history: ${error?.message}`,
      );
    }
  }
}
