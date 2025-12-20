import { Request } from 'express';
import { prisma } from '../infrastructure/prisma';
import { Prisma } from '@prisma/client';

export type AuditAction = 
  | 'USER_REGISTERED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CREATED'
  | 'PASSWORD_UPDATED'
  | 'PASSWORD_DELETED'
  | 'BULK_DELETE'
  | 'EXPORT_DATA'
  | 'IMPORT_DATA'
  | 'SESSION_REVOKED'
  | 'ACCOUNT_DELETED'
  | 'PROFILE_UPDATED'
  | 'FAMILY_CREATED'
  | 'FAMILY_UPDATED'
  | 'FAMILY_DELETED'
  | 'FAMILY_JOINED'
  | 'FAMILY_LEFT'
  | 'MEMBER_REMOVED'
  | 'MEMBER_ROLE_UPDATED'
  | 'MEMBER_SETTINGS_UPDATED'
  | 'LOCATION_UPDATED'
  | 'GEOFENCE_ZONE_CREATED'
  | 'GEOFENCE_ZONE_UPDATED'
  | 'GEOFENCE_ZONE_DELETED'
  | 'NOTE_CREATED'
  | 'NOTE_UPDATED'
  | 'NOTE_DELETED'
  | 'CALENDAR_EVENT_CREATED'
  | 'CALENDAR_EVENT_UPDATED'
  | 'CALENDAR_EVENT_DELETED';

export type ResourceType = 
  | 'USER'
  | 'PASSWORD_ENTRY'
  | 'SESSION'
  | 'SYSTEM'
  | 'FAMILY'
  | 'FAMILY_MEMBER'
  | 'LOCATION'
  | 'GEOFENCE_ZONE'
  | 'SECURE_NOTE'
  | 'CALENDAR_EVENT';

export class AuditUtil {
  
  static async log(
    userId: string | null,
    action: AuditAction,
    resourceType: ResourceType | null = null,
    resourceId: string | null = null,
    details: Record<string, unknown> | null = null,
    req?: Request
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resourceType,
          resourceId,
          ipAddress: req?.ip || null,
          userAgent: req?.get('User-Agent') || null,
          details: details ? (details as Prisma.InputJsonValue) : Prisma.JsonNull
        }
      });
    } catch (error) {
    }
  }

  
  static async getUserLogs(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ) {
    const { limit = 50, offset = 0 } = options;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          ipAddress: true,
          userAgent: true,
          details: true,
          createdAt: true
        }
      }),
      prisma.auditLog.count({
        where: { userId }
      })
    ]);

    return { logs, total };
  }

  
  static async getResourceLogs(
    resourceType: ResourceType,
    resourceId: string,
    options: { limit?: number; offset?: number } = {}
  ) {
    const { limit = 50, offset = 0 } = options;

    return prisma.auditLog.findMany({
      where: {
        resourceType,
        resourceId
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
  }
}

