import { Request } from 'express';
import { AuditUtil } from '../../utils/auditUtil';
import { FamilyRepository, FamilyWithMembers } from '../../repositories/family/familyRepository';
import { FamilyMember } from '../../../node_modules/.prisma/client';

export interface FamilyDto {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  members: FamilyMemberDto[];
}

export interface FamilyMemberDto {
  id: string;
  userId: string;
  userName: string | null;
  email: string;
  profilePicture: string | null;
  role: string;
  nickname: string | null;
  joinedAt: Date;
  isActive: boolean;
}

export interface CreateFamilyData {
  name: string;
  description?: string;
}

export interface UpdateFamilyData {
  name?: string;
  description?: string;
}

export interface JoinFamilyData {
  inviteCode: string;
  nickname?: string;
}

export interface UpdateMemberSettingsData {
  nickname?: string;
}

export class FamilyService {
  private familyRepository: FamilyRepository;

  constructor() {
    this.familyRepository = new FamilyRepository();
  }

  async createFamily(
    userId: string,
    data: CreateFamilyData,
    req?: Request
  ): Promise<FamilyDto> {
    const family = await this.familyRepository.create({
      name: data.name,
      description: data.description,
      createdById: userId,
    });

    await this.familyRepository.addMember({
      familyId: family.id,
      userId,
      role: 'admin',
    });

    await AuditUtil.log(
      userId,
      'FAMILY_CREATED',
      'FAMILY',
      family.id,
      { name: data.name },
      req
    );

    const familyWithMembers = await this.familyRepository.findById(family.id);
    
    return this.mapFamilyToDto(familyWithMembers!);
  }

  async getFamilyById(userId: string, familyId: string): Promise<FamilyDto | null> {
    const isMember = await this.familyRepository.isUserMemberOfFamily(userId, familyId);
    
    if (!isMember) {
      throw new Error('Você não tem permissão para acessar esta família');
    }

    const family = await this.familyRepository.findById(familyId);
    
    if (!family) {
      return null;
    }

    return this.mapFamilyToDto(family);
  }

  async getUserFamilies(userId: string): Promise<FamilyDto[]> {
    const families = await this.familyRepository.findByUserId(userId);
    
    return families.map((family) => this.mapFamilyToDto(family));
  }

  async updateFamily(
    userId: string,
    familyId: string,
    data: UpdateFamilyData,
    req?: Request
  ): Promise<FamilyDto | null> {
    const isAdmin = await this.familyRepository.isUserAdminOfFamily(userId, familyId);
    
    if (!isAdmin) {
      throw new Error('Apenas administradores podem atualizar a família');
    }

    await this.familyRepository.update(familyId, data);

    await AuditUtil.log(
      userId,
      'FAMILY_UPDATED',
      'FAMILY',
      familyId,
      data as Record<string, unknown>,
      req
    );

    const family = await this.familyRepository.findById(familyId);
    
    return family ? this.mapFamilyToDto(family) : null;
  }

  async deleteFamily(userId: string, familyId: string, req?: Request): Promise<boolean> {
    const isAdmin = await this.familyRepository.isUserAdminOfFamily(userId, familyId);
    
    if (!isAdmin) {
      throw new Error('Apenas administradores podem excluir a família');
    }

    await this.familyRepository.delete(familyId);

    await AuditUtil.log(
      userId,
      'FAMILY_DELETED',
      'FAMILY',
      familyId,
      null,
      req
    );

    return true;
  }

  async joinFamily(
    userId: string,
    data: JoinFamilyData,
    req?: Request
  ): Promise<FamilyDto> {
    const family = await this.familyRepository.findByInviteCode(data.inviteCode);
    
    if (!family || !family.isActive) {
      throw new Error('Código de convite inválido ou família inativa');
    }

    const existingMember = await this.familyRepository.findMemberByFamilyAndUser(
      family.id,
      userId
    );

    if (existingMember && existingMember.isActive) {
      throw new Error('Você já é membro desta família');
    }

    await this.familyRepository.addMember({
      familyId: family.id,
      userId,
      role: 'member',
      nickname: data.nickname,
    });

    await AuditUtil.log(
      userId,
      'FAMILY_JOINED',
      'FAMILY',
      family.id,
      { inviteCode: data.inviteCode },
      req
    );

    const familyWithMembers = await this.familyRepository.findById(family.id);
    
    return this.mapFamilyToDto(familyWithMembers!);
  }

  async leaveFamily(userId: string, familyId: string, req?: Request): Promise<boolean> {
    const member = await this.familyRepository.findMemberByFamilyAndUser(
      familyId,
      userId
    );
    
    if (!member || !member.isActive) {
      throw new Error('Você não é membro desta família');
    }

    await this.familyRepository.removeMember(member.id);

    await AuditUtil.log(
      userId,
      'FAMILY_LEFT',
      'FAMILY',
      familyId,
      null,
      req
    );

    return true;
  }

  async removeMember(
    userId: string,
    familyId: string,
    memberUserId: string,
    req?: Request
  ): Promise<boolean> {
    const isAdmin = await this.familyRepository.isUserAdminOfFamily(userId, familyId);
    
    if (!isAdmin) {
      throw new Error('Apenas administradores podem remover membros');
    }

    if (userId === memberUserId) {
      throw new Error('Use a função de sair da família para remover você mesmo');
    }

    const member = await this.familyRepository.findMemberByFamilyAndUser(
      familyId,
      memberUserId
    );
    
    if (!member) {
      throw new Error('Membro não encontrado');
    }

    await this.familyRepository.removeMember(member.id);

    await AuditUtil.log(
      userId,
      'MEMBER_REMOVED',
      'FAMILY_MEMBER',
      member.id,
      { memberUserId },
      req
    );

    return true;
  }

  async updateMemberRole(
    userId: string,
    familyId: string,
    memberUserId: string,
    newRole: string,
    req?: Request
  ): Promise<FamilyMemberDto> {
    const isAdmin = await this.familyRepository.isUserAdminOfFamily(userId, familyId);
    
    if (!isAdmin) {
      throw new Error('Apenas administradores podem alterar funções');
    }

    const member = await this.familyRepository.findMemberByFamilyAndUser(
      familyId,
      memberUserId
    );
    
    if (!member) {
      throw new Error('Membro não encontrado');
    }

    const updatedMember = await this.familyRepository.updateMember(member.id, {
      role: newRole,
    });

    await AuditUtil.log(
      userId,
      'MEMBER_ROLE_UPDATED',
      'FAMILY_MEMBER',
      member.id,
      { memberUserId, newRole },
      req
    );

    const family = await this.familyRepository.findById(familyId);
    const fullMember = family?.members.find((m) => m.id === updatedMember.id);

    return this.mapFamilyMemberToDto(fullMember!);
  }

  async updateMemberSettings(
    userId: string,
    familyId: string,
    data: UpdateMemberSettingsData,
    req?: Request
  ): Promise<FamilyMemberDto> {
    const member = await this.familyRepository.findMemberByFamilyAndUser(
      familyId,
      userId
    );
    
    if (!member) {
      throw new Error('Você não é membro desta família');
    }

    const updatedMember = await this.familyRepository.updateMember(member.id, data);

    await AuditUtil.log(
      userId,
      'MEMBER_SETTINGS_UPDATED',
      'FAMILY_MEMBER',
      member.id,
      data as Record<string, unknown>,
      req
    );

    const family = await this.familyRepository.findById(familyId);
    const fullMember = family?.members.find((m) => m.id === updatedMember.id);

    return this.mapFamilyMemberToDto(fullMember!);
  }

  private mapFamilyToDto(family: FamilyWithMembers): FamilyDto {
    return {
      id: family.id,
      name: family.name,
      description: family.description || undefined,
      createdById: family.createdById,
      inviteCode: family.inviteCode,
      createdAt: family.createdAt,
      updatedAt: family.updatedAt,
      isActive: family.isActive,
      members: family.members.map((member) => this.mapFamilyMemberToDto(member)),
    };
  }

  private mapFamilyMemberToDto(
    member: FamilyMember & {
      user: {
        id: string;
        name: string | null;
        email: string;
        profilePicture: string | null;
      };
    }
  ): FamilyMemberDto {
    return {
      id: member.id,
      userId: member.userId,
      userName: member.user.name,
      email: member.user.email,
      profilePicture: member.user.profilePicture,
      role: member.role,
      nickname: member.nickname,
      joinedAt: member.joinedAt,
      isActive: member.isActive,
    };
  }
}

