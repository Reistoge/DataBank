import { Inject, Injectable, Logger } from '@nestjs/common';
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
import { SenderFarFromReceiver } from 'src/fraud-system/suspicious-behaviours/impl/far-location/sender-far-from-receiver.suspicious-behaviour';
import { TxFarFromReceiver } from 'src/fraud-system/suspicious-behaviours/impl/far-location/tx-far-from-receiver.suspicious-behaviour copy 2';
import { TxFarFromSender } from 'src/fraud-system/suspicious-behaviours/impl/far-location/tx-far-from-sender.suspicious-behaviour';

// 1. get users country and cities
// 2. get transaction location

// 2.1 calculate average transaction locations distances
// from sender and receiver and compare the normalized values with the new location

//  2.2 compare the distance of the sender and the receiver,
// and the average location transaction with each other

// 3. calculate distance between D1: sender-tx, D2: receiver-tx, D3: sender-receiver
// 4. case D1 = push new sender-far-from-tx
// 5. case D2 = push new receiver-far-from-tx
// 6. case D3 = push new receiver-far-from-sender
@Injectable()
export class GeoDistanceValidation extends TransactionValidation {
  constructor(
    @Inject() private neo4jService: Neo4jService,
    @Inject() private transactionService: TransactionService,
    @Inject() private accountService: AccountService,
    @Inject() private locationService: GeolocationService,
  ) {
    super();
  }

  private readonly logger = new Logger(GeoDistanceValidation.name);

  // Configurable thresholds (in kilometers)
  private readonly DISTANCE_THRESHOLD_KM = 500; // suspicious if > 500km from typical location
  private readonly SENDER_RECEIVER_THRESHOLD_KM = 2000; // suspicious if > 2000km apart
  private readonly LOOKBACK_DAYS = 30;
  private readonly MIN_HISTORY_FOR_BASELINE = 5;

  async validate(tx: TransactionDocument): Promise<SuspiciousBehaviour[]> {
    const behaviours: SuspiciousBehaviour[] = [];

    try {
      // Extract transaction details
      const snapshot = tx.snapshot;
      if (!snapshot?.request) {
        this.logger.warn('GeoDistanceValidation: missing transaction snapshot');
        return behaviours;
      }

      const { senderAccountNumber, receiverAccountNumber, location } =
        snapshot.request;

      if (!location) {
        this.logger.log(
          'GeoDistanceValidation: no location data in transaction',
        );
        return behaviours;
      }

      // Get current transaction location
      const txLocation = await this.parseTransactionLocation(location);
      if (!txLocation) {
        this.logger.warn(
          `GeoDistanceValidation: could not parse location: ${location}`,
        );
        return behaviours;
      }

      // Get user locations for sender and receiver
      const [senderUser, receiverUser] = await Promise.all([
        this.accountService
          .getUserDocumentByAccountNumber(senderAccountNumber)
          .catch(() => null),
        this.accountService
          .getUserDocumentByAccountNumber(receiverAccountNumber)
          .catch(() => null),
      ]);

      if (!senderUser || !receiverUser) {
        this.logger.warn('GeoDistanceValidation: could not fetch user data');
        return behaviours;
      }

      // Get user home locations
      const [senderLocation, receiverLocation] = await Promise.all([
        this.getUserLocation(senderUser),
        this.getUserLocation(receiverUser),
      ]);

      // Calculate distances
      const distances = await this.calculateDistances(
        txLocation,
        senderLocation,
        receiverLocation,
      );

      // Get historical baselines (optional enhancement)
      const senderBaseline =
        await this.getSenderHistoricalBaseline(senderAccountNumber);

      // Apply validation rules
      await this.checkDistanceAnomalies(distances, senderBaseline, behaviours);

      return behaviours;
    } catch (error) {
      this.logger.error(
        `GeoDistanceValidation error: ${error?.message || error}`,
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
        // Format: "City, Country" or "Lat, Lon"
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

  private async getUserLocation(user: any): Promise<LocationPoint | null> {
    try {
      if (!user.country) return null;

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
    } catch (error) {
      this.logger.error(`Failed to get user location: ${error?.message}`);
      return null;
    }
  }

  private async calculateDistances(
    txLocation: LocationPoint,
    senderLocation: LocationPoint | null,
    receiverLocation: LocationPoint | null,
  ): Promise<{
    senderToTx?: number;
    receiverToTx?: number;
    senderToReceiver?: number;
  }> {
    const distances: any = {};

    try {
      if (senderLocation) {
        distances.senderToTx =
          (await this.locationService.calculateDistanceBetweenPoints(
            senderLocation,
            txLocation,
          )) as number;
      }

      if (receiverLocation) {
        distances.receiverToTx =
          (await this.locationService.calculateDistanceBetweenPoints(
            receiverLocation,
            txLocation,
          )) as number;
      }

      if (senderLocation && receiverLocation) {
        distances.senderToReceiver =
          (await this.locationService.calculateDistanceBetweenPoints(
            senderLocation,
            receiverLocation,
          )) as number;
      }
    } catch (error) {
      this.logger.error(`Distance calculation failed: ${error?.message}`);
    }

    return distances;
  }

  private async getSenderHistoricalBaseline(
    senderAccountNumber: string,
  ): Promise<{ avgDistance?: number }> {
    try {
      // Get recent transactions for baseline calculation
      const recentTxs = await this.transactionService.getTransactionsForAccount(
        senderAccountNumber,
        {
          limit: 50,
          since: new Date(
            Date.now() - this.LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      );

      if (recentTxs.length < this.MIN_HISTORY_FOR_BASELINE) {
        return {}; // Not enough history
      }

      // Calculate average distance from sender's home location
      // This is a simplified implementation - in practice you'd want more sophisticated analysis
      const distances: number[] = [];

      for (const histTx of recentTxs) {
        try {
          const histLocation = histTx.snapshot?.request?.location;
          if (histLocation) {
            const parsedLocation =
              await this.parseTransactionLocation(histLocation);
            if (parsedLocation) {
              // You'd calculate distance from sender's home here
              // For now, we'll use a placeholder
              distances.push(Math.random() * 1000); // Placeholder
            }
          }
        } catch (error) {
          // Skip failed location parsing
        }
      }

      if (distances.length > 0) {
        const avgDistance =
          distances.reduce((sum, d) => sum + d, 0) / distances.length;
        return { avgDistance };
      }

      return {};
    } catch (error) {
      this.logger.error(`Failed to get sender baseline: ${error?.message}`);
      return {};
    }
  }

  private async checkDistanceAnomalies(
    distances: {
      senderToTx?: number;
      receiverToTx?: number;
      senderToReceiver?: number;
    },
    baseline: { avgDistance?: number },
    behaviours: SuspiciousBehaviour[],
  ): Promise<void> {
    // Check if transaction is far from sender
    if (
      distances.senderToTx &&
      distances.senderToTx > this.DISTANCE_THRESHOLD_KM
    ) {
      const behaviour = new TxFarFromSender({
        distance: distances.senderToTx,
        avgDistance: baseline.avgDistance,
        threshold: this.DISTANCE_THRESHOLD_KM,
      });
      behaviours.push(behaviour);

      this.logger.log(
        `TxFarFromSender detected: ${distances.senderToTx.toFixed(0)}km`,
      );
    }

    // Check if transaction is far from receiver
    if (
      distances.receiverToTx &&
      distances.receiverToTx > this.DISTANCE_THRESHOLD_KM
    ) {
      const behaviour = new TxFarFromReceiver({
        distance: distances.receiverToTx,
        avgDistance: baseline.avgDistance,
        threshold: this.DISTANCE_THRESHOLD_KM,
      });
      behaviours.push(behaviour);

      this.logger.log(
        `TxFarFromReceiver detected: ${distances.receiverToTx.toFixed(0)}km`,
      );
    }

    // Check if sender and receiver are far apart
    if (
      distances.senderToReceiver &&
      distances.senderToReceiver > this.SENDER_RECEIVER_THRESHOLD_KM
    ) {
      const behaviour = new SenderFarFromReceiver({
        distance: distances.senderToReceiver,
        threshold: this.SENDER_RECEIVER_THRESHOLD_KM,
      });
      behaviours.push(behaviour);

      this.logger.log(
        `SenderFarFromReceiver detected: ${distances.senderToReceiver.toFixed(0)}km`,
      );
    }
  }
}
