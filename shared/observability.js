const MAX_RECENT_REQUESTS = 120;
const MAX_RECENT_ERRORS = 40;
const MAX_ROUTE_METRICS = 160;

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function normalizeRoutePath(pathname) {
  const input = String(pathname || '/').split('?')[0] || '/';
  const normalized = input
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      if (/^\d+$/.test(segment)) return ':id';
      if (/^[0-9a-f]{8,}$/i.test(segment)) return ':id';
      return segment.toLowerCase();
    });
  return `/${normalized.join('/') || ''}`.replace(/\/+$/, '') || '/';
}

function percentile(values, ratio) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
  return sorted[index] || 0;
}

function trimArray(values, limit) {
  if (values.length <= limit) return values;
  values.splice(0, values.length - limit);
  return values;
}

function buildScalingPlan(snapshot) {
  const memoryPressure = Number(snapshot.memory?.usageRatioPercent || 0);
  const p95DurationMs = Number(snapshot.requests?.p95DurationMs || 0);
  const inFlight = Number(snapshot.requests?.inFlight || 0);
  const totalRequests = Number(snapshot.requests?.total || 0);
  const recommendedReplicas =
    memoryPressure >= 82 || p95DurationMs >= 1800 || inFlight >= 20 || totalRequests >= 5000
      ? 3
      : memoryPressure >= 68 || p95DurationMs >= 900 || inFlight >= 8 || totalRequests >= 1200
        ? 2
        : 1;
  const readiness =
    recommendedReplicas >= 3 ? 'scale_now'
      : recommendedReplicas === 2 ? 'scale_soon'
        : 'healthy';
  const reasons = [];
  if (memoryPressure >= 68) reasons.push(`memory ${memoryPressure}%`);
  if (p95DurationMs >= 900) reasons.push(`p95 ${p95DurationMs}ms`);
  if (inFlight >= 8) reasons.push(`in-flight ${inFlight}`);
  if (totalRequests >= 1200) reasons.push(`requests ${totalRequests}`);
  return {
    readiness,
    recommendedReplicas,
    reasons,
  };
}

function buildAlerts(snapshot) {
  const alerts = [];
  const databaseStatus = String(snapshot.dependencies?.database?.status || '');
  const storageStatus = String(snapshot.dependencies?.storage?.status || '');
  const memoryPressure = Number(snapshot.memory?.usageRatioPercent || 0);
  const errorRate = Number(snapshot.requests?.errorRatePercent || 0);
  const p95DurationMs = Number(snapshot.requests?.p95DurationMs || 0);
  const inFlight = Number(snapshot.requests?.inFlight || 0);

  if (databaseStatus === 'degraded') {
    alerts.push({
      id: 'database-degraded',
      severity: 'critical',
      title: 'Database connection degraded',
      details: 'The runtime is not connected to the configured primary database.',
    });
  }
  if (storageStatus === 'degraded') {
    alerts.push({
      id: 'storage-degraded',
      severity: 'warning',
      title: 'Asset storage is partially configured',
      details: 'Object storage credentials are incomplete, so direct media delivery may fail.',
    });
  }
  if (memoryPressure >= 85) {
    alerts.push({
      id: 'memory-critical',
      severity: 'critical',
      title: 'Memory pressure is high',
      details: `Heap usage is running at ${memoryPressure}% of the current heap allocation.`,
    });
  } else if (memoryPressure >= 70) {
    alerts.push({
      id: 'memory-warning',
      severity: 'warning',
      title: 'Memory pressure is rising',
      details: `Heap usage is currently ${memoryPressure}% of the current heap allocation.`,
    });
  }
  if (errorRate >= 5 && Number(snapshot.requests?.total || 0) >= 20) {
    alerts.push({
      id: 'error-rate-warning',
      severity: 'warning',
      title: 'HTTP error rate is above threshold',
      details: `${errorRate}% of tracked requests are ending in 5xx responses.`,
    });
  }
  if (p95DurationMs >= 2000) {
    alerts.push({
      id: 'latency-critical',
      severity: 'critical',
      title: 'Request latency is critically high',
      details: `P95 request latency is ${p95DurationMs}ms.`,
    });
  } else if (p95DurationMs >= 1200) {
    alerts.push({
      id: 'latency-warning',
      severity: 'warning',
      title: 'Request latency is elevated',
      details: `P95 request latency is ${p95DurationMs}ms.`,
    });
  }
  if (inFlight >= 20) {
    alerts.push({
      id: 'concurrency-warning',
      severity: 'warning',
      title: 'Concurrent request volume is high',
      details: `${inFlight} requests are in flight right now.`,
    });
  }

  return alerts;
}

function buildPrometheusOutput(snapshot) {
  const lines = [
    '# HELP localsy_uptime_seconds Process uptime in seconds.',
    '# TYPE localsy_uptime_seconds gauge',
    `localsy_uptime_seconds ${snapshot.uptimeSec}`,
    '# HELP localsy_requests_total Total tracked HTTP requests.',
    '# TYPE localsy_requests_total counter',
    `localsy_requests_total ${snapshot.requests.total}`,
    '# HELP localsy_requests_in_flight Current number of in-flight requests.',
    '# TYPE localsy_requests_in_flight gauge',
    `localsy_requests_in_flight ${snapshot.requests.inFlight}`,
    '# HELP localsy_http_error_rate_percent Percent of tracked requests returning 5xx.',
    '# TYPE localsy_http_error_rate_percent gauge',
    `localsy_http_error_rate_percent ${snapshot.requests.errorRatePercent}`,
    '# HELP localsy_request_duration_avg_ms Average tracked request duration in milliseconds.',
    '# TYPE localsy_request_duration_avg_ms gauge',
    `localsy_request_duration_avg_ms ${snapshot.requests.avgDurationMs}`,
    '# HELP localsy_request_duration_p95_ms P95 tracked request duration in milliseconds.',
    '# TYPE localsy_request_duration_p95_ms gauge',
    `localsy_request_duration_p95_ms ${snapshot.requests.p95DurationMs}`,
    '# HELP localsy_memory_heap_usage_percent Heap usage percentage.',
    '# TYPE localsy_memory_heap_usage_percent gauge',
    `localsy_memory_heap_usage_percent ${snapshot.memory.usageRatioPercent}`,
    '# HELP localsy_runtime_alerts Total active runtime alerts.',
    '# TYPE localsy_runtime_alerts gauge',
    `localsy_runtime_alerts ${snapshot.alerts.length}`,
  ];

  Object.entries(snapshot.requests.byMethod || {}).forEach(([method, count]) => {
    lines.push(`localsy_requests_by_method_total{method="${method}"} ${count}`);
  });
  Object.entries(snapshot.requests.byStatusFamily || {}).forEach(([family, count]) => {
    lines.push(`localsy_requests_by_status_family_total{family="${family}"} ${count}`);
  });

  return `${lines.join('\n')}\n`;
}

export function createObservabilityRuntime({ serviceName = 'localsy-web', environment = 'development' } = {}) {
  const startedAt = Date.now();
  const routeMetrics = new Map();
  const recentRequests = [];
  const recentErrors = [];
  const statusFamilyCounts = {};
  const methodCounts = {};
  let totalRequests = 0;
  let inFlight = 0;
  let errorCount = 0;
  let totalDurationMs = 0;

  function requestMiddleware(req, res, next) {
    const requestId = String(req.headers['x-request-id'] || req.headers['x-trace-id'] || '').trim() || crypto.randomUUID();
    const startedAtMs = Date.now();
    const startedAtHr = process.hrtime.bigint();
    const normalizedPath = normalizeRoutePath(req.path || req.originalUrl || '/');
    inFlight += 1;
    res.setHeader('x-request-id', requestId);
    res.setHeader('x-trace-id', requestId);
    req.requestId = requestId;

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAtHr) / 1_000_000;
      const statusCode = Number(res.statusCode || 0);
      const statusFamily = `${Math.floor(statusCode / 100) || 0}xx`;
      const routeKey = `${req.method} ${normalizedPath}`;
      const existingMetric = routeMetrics.get(routeKey) || {
        method: req.method,
        path: normalizedPath,
        count: 0,
        totalDurationMs: 0,
        maxDurationMs: 0,
        errors: 0,
        samples: [],
      };

      inFlight = Math.max(0, inFlight - 1);
      totalRequests += 1;
      totalDurationMs += durationMs;
      methodCounts[req.method] = (methodCounts[req.method] || 0) + 1;
      statusFamilyCounts[statusFamily] = (statusFamilyCounts[statusFamily] || 0) + 1;
      if (statusCode >= 500) errorCount += 1;

      existingMetric.count += 1;
      existingMetric.totalDurationMs += durationMs;
      existingMetric.maxDurationMs = Math.max(existingMetric.maxDurationMs, durationMs);
      if (statusCode >= 500) existingMetric.errors += 1;
      existingMetric.samples.push(durationMs);
      trimArray(existingMetric.samples, 200);
      routeMetrics.set(routeKey, existingMetric);
      if (routeMetrics.size > MAX_ROUTE_METRICS) {
        const oldestKey = routeMetrics.keys().next().value;
        if (oldestKey) routeMetrics.delete(oldestKey);
      }

      recentRequests.push({
        requestId,
        method: req.method,
        path: normalizedPath,
        statusCode,
        durationMs: round(durationMs),
        timestamp: new Date(startedAtMs).toISOString(),
      });
      trimArray(recentRequests, MAX_RECENT_REQUESTS);

      if (statusCode >= 500) {
        recentErrors.push({
          requestId,
          method: req.method,
          path: normalizedPath,
          statusCode,
          durationMs: round(durationMs),
          timestamp: new Date(startedAtMs).toISOString(),
        });
        trimArray(recentErrors, MAX_RECENT_ERRORS);
      }
    });

    next();
  }

  function buildSnapshot({ dependencies = {} } = {}) {
    const memoryUsage = process.memoryUsage();
    const heapTotalMb = round(memoryUsage.heapTotal / 1024 / 1024);
    const heapUsedMb = round(memoryUsage.heapUsed / 1024 / 1024);
    const rssMb = round(memoryUsage.rss / 1024 / 1024);
    const externalMb = round(memoryUsage.external / 1024 / 1024);
    const usageRatioPercent = heapTotalMb > 0 ? round((heapUsedMb / heapTotalMb) * 100) : 0;
    const topRoutes = [...routeMetrics.values()]
      .sort((left, right) => right.count - left.count)
      .slice(0, 10)
      .map((entry) => ({
        method: entry.method,
        path: entry.path,
        count: entry.count,
        errors: entry.errors,
        avgDurationMs: round(entry.totalDurationMs / Math.max(1, entry.count)),
        p95DurationMs: round(percentile(entry.samples, 0.95)),
        maxDurationMs: round(entry.maxDurationMs),
      }));

    const routeSamples = [...routeMetrics.values()].flatMap((entry) => entry.samples);
    const snapshot = {
      serviceName,
      environment,
      generatedAt: new Date().toISOString(),
      uptimeSec: round((Date.now() - startedAt) / 1000),
      requests: {
        total: totalRequests,
        inFlight,
        errorCount,
        errorRatePercent: totalRequests > 0 ? round((errorCount / totalRequests) * 100) : 0,
        avgDurationMs: totalRequests > 0 ? round(totalDurationMs / totalRequests) : 0,
        p95DurationMs: round(percentile(routeSamples, 0.95)),
        byStatusFamily: statusFamilyCounts,
        byMethod: methodCounts,
        topRoutes,
      },
      memory: {
        rssMb,
        heapUsedMb,
        heapTotalMb,
        externalMb,
        usageRatioPercent,
      },
      dependencies,
      tracing: {
        recentRequests: recentRequests.slice(-25).reverse(),
        recentErrors: recentErrors.slice(-12).reverse(),
      },
    };

    const alerts = buildAlerts(snapshot);
    const scaling = buildScalingPlan(snapshot);
    return {
      ...snapshot,
      status: alerts.some((alert) => alert.severity === 'critical')
        ? 'critical'
        : alerts.length > 0
          ? 'degraded'
          : 'healthy',
      alerts,
      scaling,
    };
  }

  return {
    requestMiddleware,
    buildSnapshot,
    buildPrometheusOutput(args) {
      return buildPrometheusOutput(buildSnapshot(args));
    },
  };
}
