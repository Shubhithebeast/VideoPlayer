import { Router } from 'express';
import { healthcheckLiveness, healthcheckReadiness } from "../controllers/healthcheck.controller.js"

const router = Router();

// Liveness probe - checks if service is alive
router.route("/liveness").get(healthcheckLiveness);

// Readiness probe - checks if service is ready to handle requests
router.route("/readiness").get(healthcheckReadiness);

export default router