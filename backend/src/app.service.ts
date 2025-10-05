import { Injectable } from '@nestjs/common';
import * as os from 'os'; 

@Injectable()
export class AppService {
  /**
   * Returns a welcome message with a clickable link to Swagger docs.
   */
  getApiInfo(): string {
    const port = process.env.PORT || 3001;
    const baseUrl = `http://localhost:${port}`;
    return `
      <h1>🚀 Welcome to HTTP Monitor API</h1>
      <p>Explore the interactive API documentation here: 
      <a href="${baseUrl}/api/docs" target="_blank">Swagger Docs</a> 📚</p>
    `;
  }

  /**
   * Returns application health status including uptime, environment, memory, and CPU usage.
   */
  getHealth(): object {
    const memoryUsage = process.memoryUsage();
    const cpus = os.cpus();

    // Calculate CPU usage per core
    const usagePerCore = cpus.map((cpu, i) => {
      const total = Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0);
      const usagePercent = ((total - cpu.times.idle) / total) * 100;
      return {
        core: i,
        model: cpu.model,
        speedMHz: cpu.speed,
        usagePercent: usagePercent.toFixed(2), // Usage percentage
      };
    });

    return {
      status: 'ok',
      message: '✅ Application is running smoothly',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      memory: {
        usedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        totalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
      cpu: {
        cores: cpus.length,
        usagePerCore,
      },
      nodeVersion: process.version,
    };
  }
}

