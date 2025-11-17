import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';
 
import { LocationPoint, NominatimLocationRequestDto, NominatimLocationResponseDto } from './dto/nominatim.dto';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search?'
const EARTH_RADIUS = 6371;

@Injectable()
export class GeolocationService {
    private readonly logger = new Logger(GeolocationService.name);
    constructor(private readonly httpService: HttpService) { }


    public async getLocationData(dto: NominatimLocationRequestDto): Promise<NominatimLocationResponseDto> {
        try {
            const params = new URLSearchParams();
            if (dto.street) params.append('street', dto.street);
            if (dto.city) params.append('city', dto.city);
            if (dto.country) params.append('country', dto.country);
            params.append('limit','1');
            params.append('format', 'json');

            const url = `${NOMINATIM_URL}${params.toString()}`;

            // Respect Nominatim policy: provide a valid User-Agent / contact and set a timeout
            const headers = {
              'User-Agent': process.env.NOMINATIM_USER_AGENT || 'DataBank/1.0',
              'Accept-Language': process.env.NOMINATIM_LANG || 'en',
            };

            // Nominatim returns an array (even with limit=1)
            const response: AxiosResponse<NominatimLocationResponseDto[]> =
                await this.httpService.axiosRef.get<NominatimLocationResponseDto[]>(url, { headers, timeout: 5000 });

            const data = response.data;
            if (!Array.isArray(data) || data.length === 0) {
                this.logger.warn(`Nominatim returned no results for: ${params.toString()}`);
                throw new Error('No geolocation result');
            }

            return data[0]; // return the first (and only) result
        } catch (error) {
            this.logger.error(`Geolocation lookup failed: ${error?.message || error}`);
            throw error;
        }
    }
    async calculateDistanceBetweenPoints(pointA: LocationPoint, pointB:LocationPoint){
        const {lat: lat1,lon: lon1} = pointA;
        const {lat: lat2,lon: lon2} = pointB;
        const result = this.haversine(lat1,lon1,lat2,lon2);

        return result;
    }
    private haversine(lat1, lon1, lat2, lon2) : Number
    {
        // distance between latitudes
        // and longitudes
        let dLat = (lat2 - lat1) * Math.PI / 180.0;
        let dLon = (lon2 - lon1) * Math.PI / 180.0;
          
        // convert to radiansa
        lat1 = (lat1) * Math.PI / 180.0;
        lat2 = (lat2) * Math.PI / 180.0;
        
        // apply formulae
        let a = Math.pow(Math.sin(dLat / 2), 2) + 
                   Math.pow(Math.sin(dLon / 2), 2) * 
                   Math.cos(lat1) * 
                   Math.cos(lat2);
        let rad = 6371;
        let c = 2 * Math.asin(Math.sqrt(a));
        return rad * c;
        
    }
    async calculateDistanceBetween(dtoA: NominatimLocationRequestDto, dtoB:NominatimLocationRequestDto ){
        const rA : NominatimLocationResponseDto= await this.getLocationData(dtoA);
        const rB : NominatimLocationResponseDto = await this.getLocationData(dtoB);
        const distance = await this.calculateDistanceBetweenPoints(
            { lat: parseFloat(rA.lat), lon: parseFloat(rA.lon) },
            { lat: parseFloat(rB.lat), lon: parseFloat(rB.lon) }
        );
        return distance;

        
    }
    







}
