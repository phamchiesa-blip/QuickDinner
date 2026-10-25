import {Router} from 'express';
import { getAllRestaurants, getFeaturedRestaurants, getRestaurantBySlug, getRestaurantAvailability} from '../controllers/restaurantControllers.js';

const restaurantRouter = Router();

restaurantRouter.get('/', getAllRestaurants);
restaurantRouter.get('/featured', getFeaturedRestaurants);
restaurantRouter.get('/:slug', getRestaurantBySlug);
restaurantRouter.get('/:id/availability', getRestaurantAvailability);

export default restaurantRouter;