import { register } from "@arizeai/phoenix-otel";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";

// Prevent duplicate registration
const globalAny: any = global;
export let tracer: any;

if (!globalAny.__PHOENIX_PROVIDER__) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

    const undiciInstrumentation = new UndiciInstrumentation({
        ignoreRequestHook(request) {
            const url = `${request.origin}${request.path}`;

            return (
                /supabase\.co/i.test(url) ||
                /phoenix/i.test(url) ||
                /health/i.test(url) ||
                /\/auth/i.test(url)
            );
        },
    });

    const provider = register({
        projectName: process.env.ARIZE_MODEL_ID || "jurnalgpt",
        apiKey: process.env.PHOENIX_API_KEY,
        url: "https://app.phoenix.arize.com/s/ifanns20215659",

        // ONLY filter noise here
        instrumentations: [undiciInstrumentation],
    });

    globalAny.__PHOENIX_PROVIDER__ = provider;
}

tracer = globalAny.__PHOENIX_PROVIDER__.getTracer("jurnalgpt-tracer");
