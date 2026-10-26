export { ACTIONS, BADGES } from './presentation';
// These request limits mirror MAX_QUANTITY in backend/main.py; factors and rewards are read from the API.
export const MAX_QUANTITY = { plantation: 50, waste_segregation: 100, sustainable_transport: 100, solar_adoption: 200, water_conservation: 5000 };
export const MAX_PHOTO_AGE_DAYS = 7;
