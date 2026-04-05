import { Router } from 'express';
import { healthcheckLiveness, healthcheckReadiness } from "../controllers/healthcheck.controller.js"

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Healthcheck
 *   description: Service health probes
 */

/**
 * @swagger
 * /healthcheck/liveness:
 *   get:
 *     summary: Liveness probe — is the service running?
 *     tags: [Healthcheck]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             example:
 *               status: ok
 *               uptime: 3600
 */

/**
 * @swagger
 * /healthcheck/readiness:
 *   get:
 *     summary: Readiness probe — is DB connected and memory OK?
 *     tags: [Healthcheck]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service not ready (DB down or memory critical)
 */
// Liveness probe - checks if service is alive
router.route("/liveness").get(healthcheckLiveness);

// Readiness probe - checks if service is ready to handle requests
router.route("/readiness").get(healthcheckReadiness);

export default router