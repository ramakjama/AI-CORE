/**
 * Capacity Planning Script
 * Purpose: Analyze load test results to determine system capacity
 * and provide scaling recommendations
 */

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');

class CapacityPlanner {
  constructor(reportsDir) {
    this.reportsDir = reportsDir;
    this.reports = [];
  }

  loadReports() {
    if (!fs.existsSync(this.reportsDir)) {
      console.error(`Reports directory not found: ${this.reportsDir}`);
      return;
    }

    const files = fs
      .readdirSync(this.reportsDir)
      .filter(f => f.endsWith('.json'));

    for (const file of files) {
      try {
        const filePath = path.join(this.reportsDir, file);
        const data = JSON.parse(fs.readFileSync(filePath));
        this.reports.push({ file, data });
      } catch (error) {
        console.warn(`Could not load ${file}:`, error.message);
      }
    }

    console.log(`Loaded ${this.reports.length} test reports`);
  }

  analyzeCapacity() {
    if (this.reports.length === 0) {
      console.log('No reports to analyze');
      return null;
    }

    const analysis = {
      timestamp: new Date().toISOString(),
      reports_analyzed: this.reports.length,
      capacity_metrics: {},
      breaking_points: [],
      recommendations: [],
    };

    // Analyze each report
    for (const { file, data } of this.reports) {
      if (data.results && data.max_vus) {
        const metrics = this.extractMetrics(data);

        analysis.capacity_metrics[file] = {
          test_type: data.test_type || 'unknown',
          max_vus: data.max_vus || 0,
          total_requests: metrics.total_requests,
          avg_response_time: metrics.avg_response_time,
          p95_response_time: metrics.p95_response_time,
          error_rate: metrics.error_rate,
          requests_per_second: metrics.requests_per_second,
          capacity_rating: this.calculateCapacityRating(metrics),
        };

        // Detect breaking points
        if (metrics.error_rate > 0.05 || metrics.p95_response_time > 5000) {
          analysis.breaking_points.push({
            file,
            vus: data.max_vus,
            error_rate: metrics.error_rate,
            p95_response_time: metrics.p95_response_time,
          });
        }
      }
    }

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    // Calculate overall capacity
    analysis.overall_capacity = this.calculateOverallCapacity(analysis);

    return analysis;
  }

  extractMetrics(data) {
    const results = data.results || {};

    return {
      total_requests: results.total_requests || 0,
      avg_response_time: results.avg_response_time || 0,
      p95_response_time: results.p95_response_time || 0,
      p99_response_time: results.p99_response_time || 0,
      error_rate: results.error_rate || 0,
      requests_per_second:
        data.duration && results.total_requests
          ? results.total_requests / this.parseDuration(data.duration)
          : 0,
    };
  }

  parseDuration(duration) {
    // Parse duration strings like "5m", "2h", "30s"
    if (!duration) return 0;

    const match = duration.match(/(\d+)([smh])/);
    if (!match) return 0;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      default:
        return 0;
    }
  }

  calculateCapacityRating(metrics) {
    let score = 100;

    // Deduct points for high response times
    if (metrics.p95_response_time > 2000) score -= 20;
    if (metrics.p95_response_time > 3000) score -= 20;
    if (metrics.p95_response_time > 5000) score -= 30;

    // Deduct points for errors
    if (metrics.error_rate > 0.01) score -= 10;
    if (metrics.error_rate > 0.05) score -= 20;
    if (metrics.error_rate > 0.1) score -= 30;

    return Math.max(0, score);
  }

  calculateOverallCapacity(analysis) {
    const ratings = Object.values(analysis.capacity_metrics).map(
      m => m.capacity_rating
    );

    if (ratings.length === 0) return { score: 0, grade: 'Unknown' };

    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

    let grade;
    if (avgRating >= 90) grade = 'Excellent';
    else if (avgRating >= 75) grade = 'Good';
    else if (avgRating >= 60) grade = 'Fair';
    else if (avgRating >= 40) grade = 'Poor';
    else grade = 'Critical';

    return {
      score: Math.round(avgRating),
      grade,
      max_concurrent_users: this.estimateMaxUsers(analysis),
      recommended_capacity: this.recommendCapacity(avgRating),
    };
  }

  estimateMaxUsers(analysis) {
    const metrics = Object.values(analysis.capacity_metrics);

    if (metrics.length === 0) return 0;

    // Find the highest VU count with acceptable performance
    const acceptable = metrics.filter(
      m => m.capacity_rating >= 70 && m.error_rate < 0.05
    );

    if (acceptable.length === 0) return 0;

    return Math.max(...acceptable.map(m => m.max_vus));
  }

  recommendCapacity(avgRating) {
    if (avgRating >= 90) {
      return 'System is operating well within capacity. Can handle current load + 50% headroom.';
    } else if (avgRating >= 75) {
      return 'System is performing adequately. Consider scaling for peak loads.';
    } else if (avgRating >= 60) {
      return 'System is approaching capacity limits. Scaling recommended.';
    } else if (avgRating >= 40) {
      return 'System is at capacity limits. Immediate scaling required.';
    } else {
      return 'System is over capacity. Critical scaling and optimization needed.';
    }
  }

  generateRecommendations(analysis) {
    const recommendations = [];
    const metrics = Object.values(analysis.capacity_metrics);

    // High response time recommendations
    const highResponseTime = metrics.filter(m => m.p95_response_time > 2000);
    if (highResponseTime.length > 0) {
      recommendations.push({
        category: 'Performance',
        priority: 'High',
        issue: 'High response times detected',
        recommendation:
          'Optimize database queries, implement caching, or scale infrastructure',
        affected_tests: highResponseTime.length,
      });
    }

    // High error rate recommendations
    const highErrorRate = metrics.filter(m => m.error_rate > 0.05);
    if (highErrorRate.length > 0) {
      recommendations.push({
        category: 'Reliability',
        priority: 'Critical',
        issue: 'High error rates detected',
        recommendation:
          'Investigate failed requests, check circuit breakers, review logs',
        affected_tests: highErrorRate.length,
      });
    }

    // Breaking point recommendations
    if (analysis.breaking_points.length > 0) {
      recommendations.push({
        category: 'Capacity',
        priority: 'High',
        issue: `System breaking points identified at ${analysis.breaking_points[0].vus} VUs`,
        recommendation: 'Scale horizontally or optimize bottlenecks',
        details: analysis.breaking_points,
      });
    }

    // Low capacity recommendations
    const lowCapacity = metrics.filter(m => m.capacity_rating < 60);
    if (lowCapacity.length > metrics.length * 0.5) {
      recommendations.push({
        category: 'Infrastructure',
        priority: 'Critical',
        issue: 'Over 50% of tests show low capacity',
        recommendation:
          'Consider infrastructure upgrade, load balancing, or microservices optimization',
      });
    }

    // Add positive feedback if system is performing well
    if (recommendations.length === 0) {
      recommendations.push({
        category: 'Performance',
        priority: 'Info',
        issue: 'None',
        recommendation:
          'System is performing well. Continue monitoring and maintain current configuration.',
      });
    }

    return recommendations;
  }

  generateReport() {
    const analysis = this.analyzeCapacity();

    if (!analysis) {
      console.error('Could not generate capacity analysis');
      return;
    }

    console.log('\n' + '='.repeat(80));
    console.log('CAPACITY PLANNING REPORT');
    console.log('='.repeat(80));
    console.log(`Generated: ${new Date(analysis.timestamp).toLocaleString()}`);
    console.log(`Reports Analyzed: ${analysis.reports_analyzed}`);
    console.log('');

    console.log('OVERALL CAPACITY:');
    console.log(`  Score: ${analysis.overall_capacity.score}/100`);
    console.log(`  Grade: ${analysis.overall_capacity.grade}`);
    console.log(
      `  Max Concurrent Users: ${analysis.overall_capacity.max_concurrent_users}`
    );
    console.log(`  Assessment: ${analysis.overall_capacity.recommended_capacity}`);
    console.log('');

    if (analysis.breaking_points.length > 0) {
      console.log('BREAKING POINTS:');
      analysis.breaking_points.forEach(bp => {
        console.log(`  - At ${bp.vus} VUs (${bp.file})`);
        console.log(`    Error Rate: ${(bp.error_rate * 100).toFixed(2)}%`);
        console.log(`    P95 Response Time: ${bp.p95_response_time.toFixed(0)}ms`);
      });
      console.log('');
    }

    console.log('RECOMMENDATIONS:');
    analysis.recommendations.forEach((rec, idx) => {
      console.log(`  ${idx + 1}. [${rec.priority}] ${rec.category}`);
      console.log(`     Issue: ${rec.issue}`);
      console.log(`     Action: ${rec.recommendation}`);
      console.log('');
    });

    console.log('='.repeat(80));

    // Save report
    const reportFile = path.join(
      this.reportsDir,
      `capacity-planning-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    fs.writeFileSync(reportFile, JSON.stringify(analysis, null, 2));

    console.log(`Full report saved to: ${reportFile}`);
    console.log('='.repeat(80) + '\n');

    return analysis;
  }
}

// Main execution
console.log('AIT-CORE Capacity Planning Analysis\n');

const planner = new CapacityPlanner(REPORTS_DIR);
planner.loadReports();
const report = planner.generateReport();

// Exit with appropriate code
if (report && report.overall_capacity.score < 60) {
  console.warn(
    '\n⚠ WARNING: System capacity is below acceptable threshold\n'
  );
  process.exit(1);
} else {
  console.log('\n✓ Capacity analysis complete\n');
  process.exit(0);
}
