/*instrumentation.js*/
const opentelemetry = require('@opentelemetry/sdk-node');
const {
  getNodeAutoInstrumentations,
} = require('@opentelemetry/auto-instrumentations-node');
const {
  OTLPTraceExporter,
} = require('@opentelemetry/exporter-trace-otlp-http');
const {
  OTLPMetricExporter,
} = require('@opentelemetry/exporter-metrics-otlp-http');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');

const sdk = new opentelemetry.NodeSDK({
  traceExporter: new OTLPTraceExporter({
    // optional - default url is http://localhost:4318/v1/traces
    // url: '<your-otlp-endpoint>/v1/traces',
    // optional - collection of custom headers to be sent with each request, empty by default
    headers: {},
  }),
  // metricReader: new PeriodicExportingMetricReader({
  //   exporter: new OTLPMetricExporter({
  //     // url: '<your-otlp-endpoint>/v1/metrics', // url is optional and can be omitted - default is http://localhost:4318/v1/metrics
  //     headers: {}, // an optional object containing custom headers to be sent with each request
  //     concurrencyLimit: 1, // an optional limit on pending requests
  //   }),
  // }),
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch(error => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

const { Bootstrap } = require('@midwayjs/bootstrap');
Bootstrap.run();
