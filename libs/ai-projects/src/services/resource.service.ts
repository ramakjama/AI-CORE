/**
 * Resource Service
 * Resource management and allocation operations
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Resource,
  ResourceAllocation,
  TimeEntry,
  ResourceType,
  TimePeriod,
  TeamCapacity
} from '../types';

// In-memory storage (replace with actual database in production)
const resources: Map<string, Resource> = new Map();
const allocations: Map<string, ResourceAllocation> = new Map();
const timeEntries: Map<string, TimeEntry> = new Map();

/**
 * Resource Service - Manages resources, allocations, and capacity
 */
export class ResourceService {

  // ===========================================================================
  // RESOURCE CRUD
  // ===========================================================================

  /**
   * Create a new resource
   */
  async createResource(
    resourceData: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Resource> {
    const now = new Date();
    const resourceId = uuidv4();

    const resource: Resource = {
      ...resourceData,
      id: resourceId,
      createdAt: now,
      updatedAt: now
    };

    resources.set(resourceId, resource);

    return resource;
  }

  /**
   * Get a resource by ID
   */
  async getResource(id: string): Promise<Resource | null> {
    return resources.get(id) || null;
  }

  /**
   * Update a resource
   */
  async updateResource(
    id: string,
    changes: Partial<Resource>
  ): Promise<Resource> {
    const resource = resources.get(id);
    if (!resource) {
      throw new Error(`Resource not found: ${id}`);
    }

    const updatedResource: Resource = {
      ...resource,
      ...changes,
      id: resource.id,
      createdAt: resource.createdAt,
      updatedAt: new Date()
    };

    resources.set(id, updatedResource);

    return updatedResource;
  }

  /**
   * List all resources with optional filters
   */
  async listResources(filters?: {
    type?: ResourceType;
    teamId?: string;
    skills?: string[];
    isActive?: boolean;
  }): Promise<Resource[]> {
    let result = Array.from(resources.values());

    if (filters) {
      if (filters.type) {
        result = result.filter(r => r.type === filters.type);
      }
      if (filters.teamId) {
        result = result.filter(r => r.teamId === filters.teamId);
      }
      if (filters.isActive !== undefined) {
        result = result.filter(r => r.isActive === filters.isActive);
      }
      if (filters.skills && filters.skills.length > 0) {
        result = result.filter(r =>
          filters.skills!.some(skill => r.skills.includes(skill))
        );
      }
    }

    return result;
  }

  // ===========================================================================
  // ALLOCATION MANAGEMENT
  // ===========================================================================

  /**
   * Allocate a resource to a project
   */
  async allocate(
    resourceId: string,
    projectId: string,
    startDate: Date,
    endDate: Date,
    percentage: number,
    options?: {
      taskId?: string;
      role?: string;
      responsibilities?: string[];
    }
  ): Promise<ResourceAllocation> {
    const resource = resources.get(resourceId);
    if (!resource) {
      throw new Error(`Resource not found: ${resourceId}`);
    }

    // Check availability
    const availability = await this.getAvailability(resourceId, startDate, endDate);
    if (availability.availablePercentage < percentage) {
      throw new Error(
        `Insufficient availability. Requested: ${percentage}%, Available: ${availability.availablePercentage}%`
      );
    }

    const now = new Date();
    const allocationId = uuidv4();

    const allocation: ResourceAllocation = {
      id: allocationId,
      resourceId,
      projectId,
      taskId: options?.taskId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      allocationPercentage: percentage,
      hoursPerDay: (resource.hoursPerDay * percentage) / 100,
      role: options?.role || resource.role || 'Team Member',
      responsibilities: options?.responsibilities || [],
      status: new Date(startDate) <= now ? 'active' : 'planned',
      createdAt: now,
      updatedAt: now
    };

    allocations.set(allocationId, allocation);

    return allocation;
  }

  /**
   * Deallocate a resource from a project
   */
  async deallocate(allocationId: string): Promise<boolean> {
    const allocation = allocations.get(allocationId);
    if (!allocation) {
      return false;
    }

    allocation.status = 'cancelled';
    allocation.updatedAt = new Date();
    allocations.set(allocationId, allocation);

    return true;
  }

  /**
   * Update an allocation
   */
  async updateAllocation(
    allocationId: string,
    changes: Partial<ResourceAllocation>
  ): Promise<ResourceAllocation> {
    const allocation = allocations.get(allocationId);
    if (!allocation) {
      throw new Error(`Allocation not found: ${allocationId}`);
    }

    const updatedAllocation: ResourceAllocation = {
      ...allocation,
      ...changes,
      id: allocation.id,
      resourceId: allocation.resourceId,
      projectId: allocation.projectId,
      createdAt: allocation.createdAt,
      updatedAt: new Date()
    };

    allocations.set(allocationId, updatedAllocation);

    return updatedAllocation;
  }

  /**
   * Get allocations for a resource
   */
  async getAllocations(resourceId: string, period?: TimePeriod): Promise<ResourceAllocation[]> {
    const result: ResourceAllocation[] = [];

    allocations.forEach(allocation => {
      if (allocation.resourceId !== resourceId) return;
      if (allocation.status === 'cancelled') return;

      if (period) {
        // Check overlap
        if (
          allocation.endDate >= period.startDate &&
          allocation.startDate <= period.endDate
        ) {
          result.push(allocation);
        }
      } else {
        result.push(allocation);
      }
    });

    return result.sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }

  /**
   * Get allocations for a project
   */
  async getProjectAllocations(projectId: string): Promise<ResourceAllocation[]> {
    const result: ResourceAllocation[] = [];

    allocations.forEach(allocation => {
      if (allocation.projectId === projectId && allocation.status !== 'cancelled') {
        result.push(allocation);
      }
    });

    return result;
  }

  // ===========================================================================
  // AVAILABILITY & CAPACITY
  // ===========================================================================

  /**
   * Get resource availability for a period
   */
  async getAvailability(
    resourceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    resourceId: string;
    period: TimePeriod;
    totalWorkingDays: number;
    totalHours: number;
    allocatedHours: number;
    availableHours: number;
    allocatedPercentage: number;
    availablePercentage: number;
    dailyBreakdown: {
      date: Date;
      allocatedPercentage: number;
      availablePercentage: number;
    }[];
  }> {
    const resource = resources.get(resourceId);
    if (!resource) {
      throw new Error(`Resource not found: ${resourceId}`);
    }

    const period: TimePeriod = { startDate: new Date(startDate), endDate: new Date(endDate) };

    // Calculate working days
    const workingDays = this.getWorkingDays(resource, startDate, endDate);
    const totalHours = workingDays * resource.hoursPerDay;

    // Get allocations in period
    const periodAllocations = await this.getAllocations(resourceId, period);

    // Calculate daily breakdown
    const dailyBreakdown: {
      date: Date;
      allocatedPercentage: number;
      availablePercentage: number;
    }[] = [];

    let totalAllocatedHours = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();

      // Check if it's a working day
      if (
        resource.workingDays.includes(dayOfWeek) &&
        !this.isVacationDay(resource, current)
      ) {
        // Calculate allocation for this day
        let dayAllocatedPercentage = 0;

        for (const allocation of periodAllocations) {
          if (current >= allocation.startDate && current <= allocation.endDate) {
            dayAllocatedPercentage += allocation.allocationPercentage;
          }
        }

        const dayAvailablePercentage = Math.max(
          0,
          resource.maxAllocationPercentage - dayAllocatedPercentage
        );

        dailyBreakdown.push({
          date: new Date(current),
          allocatedPercentage: Math.min(dayAllocatedPercentage, 100),
          availablePercentage: dayAvailablePercentage
        });

        totalAllocatedHours +=
          (dayAllocatedPercentage / 100) * resource.hoursPerDay;
      }

      current.setDate(current.getDate() + 1);
    }

    const allocatedPercentage =
      totalHours > 0 ? (totalAllocatedHours / totalHours) * 100 : 0;
    const availablePercentage = Math.max(
      0,
      resource.maxAllocationPercentage - allocatedPercentage
    );

    return {
      resourceId,
      period,
      totalWorkingDays: workingDays,
      totalHours,
      allocatedHours: totalAllocatedHours,
      availableHours: totalHours - totalAllocatedHours,
      allocatedPercentage: Math.round(allocatedPercentage * 10) / 10,
      availablePercentage: Math.round(availablePercentage * 10) / 10,
      dailyBreakdown
    };
  }

  /**
   * Get resource utilization for a period
   */
  async getUtilization(
    resourceId: string,
    period: TimePeriod
  ): Promise<{
    resourceId: string;
    period: TimePeriod;
    plannedHours: number;
    actualHours: number;
    utilizationPercentage: number;
    billableHours: number;
    nonBillableHours: number;
    billablePercentage: number;
    byProject: {
      projectId: string;
      plannedHours: number;
      actualHours: number;
    }[];
  }> {
    const resource = resources.get(resourceId);
    if (!resource) {
      throw new Error(`Resource not found: ${resourceId}`);
    }

    // Get allocations for period
    const periodAllocations = await this.getAllocations(resourceId, period);

    // Calculate planned hours from allocations
    let plannedHours = 0;
    const projectPlanned = new Map<string, number>();

    for (const allocation of periodAllocations) {
      const overlapStart = new Date(
        Math.max(allocation.startDate.getTime(), period.startDate.getTime())
      );
      const overlapEnd = new Date(
        Math.min(allocation.endDate.getTime(), period.endDate.getTime())
      );

      const workingDays = this.getWorkingDays(resource, overlapStart, overlapEnd);
      const allocHours =
        workingDays * resource.hoursPerDay * (allocation.allocationPercentage / 100);

      plannedHours += allocHours;

      const current = projectPlanned.get(allocation.projectId) || 0;
      projectPlanned.set(allocation.projectId, current + allocHours);
    }

    // Get actual hours from time entries
    let actualHours = 0;
    let billableHours = 0;
    const projectActual = new Map<string, number>();

    timeEntries.forEach(entry => {
      if (entry.resourceId !== resourceId) return;

      const entryDate = new Date(entry.date);
      if (entryDate >= period.startDate && entryDate <= period.endDate) {
        actualHours += entry.hours;
        if (entry.billable) {
          billableHours += entry.hours;
        }

        const current = projectActual.get(entry.projectId) || 0;
        projectActual.set(entry.projectId, current + entry.hours);
      }
    });

    // Calculate capacity
    const workingDays = this.getWorkingDays(resource, period.startDate, period.endDate);
    const capacity = workingDays * resource.hoursPerDay;

    // Build project breakdown
    const byProject: {
      projectId: string;
      plannedHours: number;
      actualHours: number;
    }[] = [];

    const allProjectIds = new Set([
      ...projectPlanned.keys(),
      ...projectActual.keys()
    ]);

    allProjectIds.forEach(projectId => {
      byProject.push({
        projectId,
        plannedHours: projectPlanned.get(projectId) || 0,
        actualHours: projectActual.get(projectId) || 0
      });
    });

    return {
      resourceId,
      period,
      plannedHours: Math.round(plannedHours * 10) / 10,
      actualHours: Math.round(actualHours * 10) / 10,
      utilizationPercentage:
        capacity > 0 ? Math.round((actualHours / capacity) * 1000) / 10 : 0,
      billableHours: Math.round(billableHours * 10) / 10,
      nonBillableHours: Math.round((actualHours - billableHours) * 10) / 10,
      billablePercentage:
        actualHours > 0 ? Math.round((billableHours / actualHours) * 1000) / 10 : 0,
      byProject
    };
  }

  /**
   * Find available resources matching criteria
   */
  async findAvailableResources(
    skills: string[],
    startDate: Date,
    endDate: Date,
    options?: {
      minPercentage?: number;
      type?: ResourceType;
      teamId?: string;
    }
  ): Promise<{
    resourceId: string;
    name: string;
    skills: string[];
    matchedSkills: string[];
    availablePercentage: number;
    hourlyRate: number;
  }[]> {
    const minPercentage = options?.minPercentage || 20;
    const result: {
      resourceId: string;
      name: string;
      skills: string[];
      matchedSkills: string[];
      availablePercentage: number;
      hourlyRate: number;
    }[] = [];

    for (const resource of resources.values()) {
      // Filter by type and team
      if (options?.type && resource.type !== options.type) continue;
      if (options?.teamId && resource.teamId !== options.teamId) continue;
      if (!resource.isActive) continue;

      // Check skill match
      const matchedSkills = skills.filter(s => resource.skills.includes(s));
      if (matchedSkills.length === 0 && skills.length > 0) continue;

      // Check availability
      const availability = await this.getAvailability(
        resource.id,
        startDate,
        endDate
      );

      if (availability.availablePercentage >= minPercentage) {
        result.push({
          resourceId: resource.id,
          name: resource.name,
          skills: resource.skills,
          matchedSkills,
          availablePercentage: availability.availablePercentage,
          hourlyRate: resource.hourlyRate
        });
      }
    }

    // Sort by skill match count, then by availability
    return result.sort((a, b) => {
      const skillDiff = b.matchedSkills.length - a.matchedSkills.length;
      if (skillDiff !== 0) return skillDiff;
      return b.availablePercentage - a.availablePercentage;
    });
  }

  /**
   * Get team capacity for a period
   */
  async getTeamCapacity(teamId: string, period: TimePeriod): Promise<TeamCapacity> {
    const teamResources = await this.listResources({ teamId, isActive: true });

    let totalHours = 0;
    let allocatedHours = 0;
    const resourceBreakdown: TeamCapacity['resourceBreakdown'] = [];

    for (const resource of teamResources) {
      if (resource.type !== ResourceType.HUMAN) continue;

      const workingDays = this.getWorkingDays(
        resource,
        period.startDate,
        period.endDate
      );
      const resourceTotalHours = workingDays * resource.hoursPerDay;

      const availability = await this.getAvailability(
        resource.id,
        period.startDate,
        period.endDate
      );

      totalHours += resourceTotalHours;
      allocatedHours += availability.allocatedHours;

      resourceBreakdown.push({
        resourceId: resource.id,
        resourceName: resource.name,
        totalHours: resourceTotalHours,
        allocatedHours: availability.allocatedHours,
        availableHours: availability.availableHours
      });
    }

    return {
      teamId,
      period,
      totalHours,
      allocatedHours,
      availableHours: totalHours - allocatedHours,
      utilizationPercentage:
        totalHours > 0 ? Math.round((allocatedHours / totalHours) * 1000) / 10 : 0,
      resourceBreakdown
    };
  }

  /**
   * Balance workload across team members for a project
   */
  async balanceWorkload(projectId: string): Promise<{
    recommendations: {
      type: 'reassign' | 'reallocate' | 'add_resource';
      description: string;
      fromResourceId?: string;
      toResourceId?: string;
      taskId?: string;
      hours?: number;
      reason: string;
    }[];
    currentDistribution: {
      resourceId: string;
      resourceName: string;
      allocatedHours: number;
      utilizationPercentage: number;
      status: 'overloaded' | 'optimal' | 'underutilized';
    }[];
  }> {
    const projectAllocations = await this.getProjectAllocations(projectId);
    const recommendations: {
      type: 'reassign' | 'reallocate' | 'add_resource';
      description: string;
      fromResourceId?: string;
      toResourceId?: string;
      taskId?: string;
      hours?: number;
      reason: string;
    }[] = [];

    const currentDistribution: {
      resourceId: string;
      resourceName: string;
      allocatedHours: number;
      utilizationPercentage: number;
      status: 'overloaded' | 'optimal' | 'underutilized';
    }[] = [];

    // Analyze each resource's workload
    const resourceWorkloads = new Map<string, number>();

    for (const allocation of projectAllocations) {
      const current = resourceWorkloads.get(allocation.resourceId) || 0;
      const days = this.calculateDays(allocation.startDate, allocation.endDate);
      resourceWorkloads.set(
        allocation.resourceId,
        current + days * allocation.hoursPerDay
      );
    }

    // Categorize resources
    const overloaded: string[] = [];
    const underutilized: string[] = [];

    for (const [resourceId, hours] of resourceWorkloads) {
      const resource = resources.get(resourceId);
      if (!resource) continue;

      // Calculate utilization based on project duration
      const avgAllocation = projectAllocations
        .filter(a => a.resourceId === resourceId)
        .reduce((sum, a) => sum + a.allocationPercentage, 0);

      let status: 'overloaded' | 'optimal' | 'underutilized';

      if (avgAllocation > 90) {
        status = 'overloaded';
        overloaded.push(resourceId);
      } else if (avgAllocation < 50) {
        status = 'underutilized';
        underutilized.push(resourceId);
      } else {
        status = 'optimal';
      }

      currentDistribution.push({
        resourceId,
        resourceName: resource.name,
        allocatedHours: hours,
        utilizationPercentage: avgAllocation,
        status
      });
    }

    // Generate recommendations
    if (overloaded.length > 0 && underutilized.length > 0) {
      for (const fromId of overloaded) {
        const fromResource = resources.get(fromId);
        for (const toId of underutilized) {
          const toResource = resources.get(toId);

          // Check skill overlap
          if (fromResource && toResource) {
            const commonSkills = fromResource.skills.filter(s =>
              toResource.skills.includes(s)
            );

            if (commonSkills.length > 0) {
              recommendations.push({
                type: 'reallocate',
                description: `Transfer some work from ${fromResource.name} to ${toResource.name}`,
                fromResourceId: fromId,
                toResourceId: toId,
                reason: `${fromResource.name} is overloaded (${currentDistribution.find(d => d.resourceId === fromId)?.utilizationPercentage}% utilization) while ${toResource.name} is underutilized. They share skills: ${commonSkills.join(', ')}`
              });
            }
          }
        }
      }
    }

    // Check if additional resources are needed
    if (overloaded.length > 0 && underutilized.length === 0) {
      for (const resourceId of overloaded) {
        const resource = resources.get(resourceId);
        if (resource) {
          recommendations.push({
            type: 'add_resource',
            description: `Consider adding a new resource with skills: ${resource.skills.slice(0, 3).join(', ')}`,
            fromResourceId: resourceId,
            reason: `${resource.name} is overloaded and no underutilized team members are available`
          });
        }
      }
    }

    return { recommendations, currentDistribution };
  }

  // ===========================================================================
  // TIME ENTRIES
  // ===========================================================================

  /**
   * Log time for a resource
   */
  async logTime(
    resourceId: string,
    projectId: string,
    taskId: string,
    date: Date,
    hours: number,
    options?: {
      description?: string;
      billable?: boolean;
      billingRate?: number;
    }
  ): Promise<TimeEntry> {
    const resource = resources.get(resourceId);
    if (!resource) {
      throw new Error(`Resource not found: ${resourceId}`);
    }

    const now = new Date();
    const entryId = uuidv4();

    const entry: TimeEntry = {
      id: entryId,
      resourceId,
      projectId,
      taskId,
      date: new Date(date),
      hours,
      description: options?.description || '',
      billable: options?.billable ?? true,
      billingRate: options?.billingRate || resource.hourlyRate,
      status: 'draft',
      createdAt: now,
      updatedAt: now
    };

    timeEntries.set(entryId, entry);

    return entry;
  }

  /**
   * Get time entries for a resource
   */
  async getTimeEntries(
    resourceId: string,
    period?: TimePeriod
  ): Promise<TimeEntry[]> {
    const result: TimeEntry[] = [];

    timeEntries.forEach(entry => {
      if (entry.resourceId !== resourceId) return;

      if (period) {
        const entryDate = new Date(entry.date);
        if (entryDate >= period.startDate && entryDate <= period.endDate) {
          result.push(entry);
        }
      } else {
        result.push(entry);
      }
    });

    return result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  /**
   * Approve time entries
   */
  async approveTimeEntries(
    entryIds: string[],
    approverId: string
  ): Promise<TimeEntry[]> {
    const approved: TimeEntry[] = [];
    const now = new Date();

    for (const entryId of entryIds) {
      const entry = timeEntries.get(entryId);
      if (entry) {
        entry.status = 'approved';
        entry.approvedBy = approverId;
        entry.approvedAt = now;
        entry.updatedAt = now;
        timeEntries.set(entryId, entry);
        approved.push(entry);
      }
    }

    return approved;
  }

  // ===========================================================================
  // PRIVATE HELPER METHODS
  // ===========================================================================

  /**
   * Calculate working days between two dates
   */
  private getWorkingDays(resource: Resource, start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();

      if (
        resource.workingDays.includes(dayOfWeek) &&
        !this.isVacationDay(resource, current)
      ) {
        count++;
      }

      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Check if a date is a vacation day
   */
  private isVacationDay(resource: Resource, date: Date): boolean {
    const dateString = date.toISOString().split('T')[0];
    return resource.vacationDays.some(
      v => new Date(v).toISOString().split('T')[0] === dateString
    );
  }

  /**
   * Calculate days between two dates
   */
  private calculateDays(start: Date, end: Date): number {
    const diffTime = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// Export singleton instance
export const resourceService = new ResourceService();
