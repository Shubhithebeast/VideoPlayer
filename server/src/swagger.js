import swaggerJsdoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "VideoPlayer API",
            version: "1.0.0",
            description: "REST API documentation for the VideoPlayer backend",
        },
        servers: [
            {
                url: "http://localhost:8000/api/v1",
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                // JWT sent as HTTP-only cookie
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "accessToken",
                },
            },
        },
        // Apply cookie auth globally — individual endpoints will override if public
        security: [{ cookieAuth: [] }],
    },
    // Scan all route files for JSDoc comments
    apis: ["./src/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
