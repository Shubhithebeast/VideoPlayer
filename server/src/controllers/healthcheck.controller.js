import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import mongoose from "mongoose";

// Liveness probe - checks if the service is alive and running
const healthcheckLiveness = asyncHandler(async (req, res) => {
    const healthData = {
        uptime: process.uptime(),
        status: "OK",
        timestamp: new Date().toLocaleString('en-US', { 
            dateStyle: 'full', 
            timeStyle: 'long' 
        }),
        message: "Service is alive"
    }

    return res.status(200).json(new apiResponse(200, "Liveness check passed", healthData));
});

// Readiness probe - checks if the service is ready to handle requests
const healthcheckReadiness = asyncHandler(async (req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;
    const memoryUsage = process.memoryUsage();
    const heapPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    // Determine overall status
    let status = "OK";
    let ready = true;
    
    if (!dbConnected) {
        status = "ERROR";
        ready = false;
    } else if (heapPercentage > 90) {
        status = "WARNING";
        ready = true; // Still ready but with warnings
    }

    const healthData = {
        ready: ready,
        status: status,
        timestamp: new Date().toLocaleString('en-US', { 
            dateStyle: 'full', 
            timeStyle: 'long' 
        }),
        checks: {
            database: {
                status: dbConnected ? 'Connected' : 'Disconnected',
                ready: dbConnected
            },
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                heapPercentage: `${heapPercentage.toFixed(2)}%`,
                status: heapPercentage > 90 ? 'WARNING' : 'OK'
            }
        }
    }

    const httpStatus = ready ? 200 : 503;
    const message = ready 
        ? status === "WARNING" 
            ? "Service is ready with warnings"
            : "Service is ready to handle requests"
        : "Service is not ready - dependencies unavailable";

    return res.status(httpStatus).json(new apiResponse(httpStatus, message, healthData));
});

export { healthcheckLiveness, healthcheckReadiness };
    