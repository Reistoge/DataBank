import { Test, TestingModule } from '@nestjs/testing';
import { GeolocationService } from './geolocation.service';
import { HttpService, HttpModule } from '@nestjs/axios';

enum MockUserRole {
  
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN',
  EXEC = 'EXEC',
 
}
interface MockUser {
  _id: string;
  username: string;

  userNumber: string

  password: string;  

  email: string;

  rut: string;

  refreshToken: string;

  roles: MockUserRole[];

  birthday?: Date;

  country: string;

  region: string;

  lastLogin?: Date | null;
}
describe('GeolocationService', () => {
  let service: GeolocationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [GeolocationService],
    }).compile();
      
    service = module.get<GeolocationService>(GeolocationService);
  });
  describe('runAll', () => {
    it('distance between { lat: -29, lon: -70 } and { lat: 30, lon: 10 } ', async () => {

      const d = await service.calculateDistanceBetweenPoints({ lat: -29, lon: -70 }, { lat: 30, lon: 10 });
      expect(d).toBeDefined();
      expect(d.toFixed(0)).toBe("10715");

    });
    it('Test distance between cities', async ()=>{
      const result = await service.calculateDistanceBetween(
      {
        country: "Chile",
        city: "La Serena"
      },
      {
        country:"Chile",
        city: "Ovalle"
      })
      expect(result).toBeDefined();
      expect(result).toBeCloseTo(84.8);


    })


  });

});
