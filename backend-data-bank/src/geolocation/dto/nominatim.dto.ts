 
export class NominatimLocationResponseDto {
    place_id: number;
    licence: string;
    osm_type: string;
    osm_id: number;
    lat: string;
    lon: string;
    class: string;
    type: string;
    place_rank: number;
    importance: number;
    addresstype: string;
    name: string;
    display_name: string;
    boundingbox: string[];
}
export class NominatimLocationRequestDto {
    
    country?:string;
    city?:string;
    street?:string;
}

export class LocationPoint {
    lat:number;
    lon:number;
}