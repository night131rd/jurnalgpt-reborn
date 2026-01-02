import { register } from "@arizeai/phoenix-otel";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";

// Prevent duplicate registration in dev mode
const globalAny: any = global;

export let tracer: any;

if (!globalAny.__PHOENIX_PROVIDER__) {
    // Debug logger (optional)
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);


    const provider = register({
        projectName: process.env.ARIZE_MODEL_ID || 'jurnalgpt', // Use env var or default
        url: 'https://app.phoenix.arize.com/s/ifanns20215659',
        apiKey: process.env.PHOENIX_API_KEY,
        instrumentations: [], // Disable auto-instrumentations to remove Next.js internal noise
    });

    globalAny.__PHOENIX_PROVIDER__ = provider;
}

tracer = globalAny.__PHOENIX_PROVIDER__.getTracer("jurnalgpt-tracer");
