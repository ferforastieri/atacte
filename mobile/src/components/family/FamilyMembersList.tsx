import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../shared';
import { FamilyMemberLocation } from '../../services/location/locationService';
import { useTheme } from '../../contexts/ThemeContext';

interface FamilyMembersListProps {
  members: FamilyMemberLocation[];
  onMemberPress?: (member: FamilyMemberLocation) => void;
  compact?: boolean;
}

export default function FamilyMembersList({ members, onMemberPress, compact = false }: FamilyMembersListProps) {
  const { isDark } = useTheme();

  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    return `${Math.floor(diff / 86400000)}d atrás`;
  };

  const getMemberStatusColor = (member: FamilyMemberLocation) => {
    if (member.isMoving) return '#16a34a';
    if (member.batteryLevel && member.batteryLevel < 0.2) return '#dc2626';
    return '#2563eb';
  };

  if (members.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons 
          name="people-outline" 
          size={48} 
          color={isDark ? '#6b7280' : '#9ca3af'} 
        />
        <Text style={[styles.emptyText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
          Nenhum membro da família encontrado
        </Text>
      </View>
    );
  }

  if (compact) {
    return (
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        horizontal={true}
      >
        {members.map((member) => (
          <Card key={member.userId} style={[styles.compactMemberCard, { backgroundColor: isDark ? '#374151' : '#f9fafb' }]}>
            <View style={styles.compactMemberHeader}>
              <View style={[styles.compactMemberAvatar, { 
                backgroundColor: getMemberStatusColor(member)
              }]}>
                <Text style={styles.compactMemberAvatarText}>
                  {(member.nickname || member.userName || '?')[0].toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.compactMemberName, { color: isDark ? '#f9fafb' : '#111827' }]}>
                {member.nickname || member.userName}
              </Text>
              <Text style={[styles.compactMemberStatus, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                Última localização: {formatLastUpdate(member.timestamp)}
              </Text>
              {member.lastInteraction && (
                <Text style={[styles.compactMemberStatus, { color: isDark ? '#9ca3af' : '#6b7280', marginTop: 2 }]}>
                  Última interação: {formatLastUpdate(member.lastInteraction)}
                </Text>
              )}
              
              <View style={styles.compactMemberDetails}>
                {member.batteryLevel !== null && member.batteryLevel !== undefined && (
                  <View style={styles.compactDetailItem}>
                    <Ionicons
                      name="battery-charging"
                      size={12}
                      color={member.batteryLevel < 0.2 ? '#dc2626' : '#16a34a'}
                    />
                    <Text style={[styles.compactDetailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                      {Math.round(member.batteryLevel * 100)}%
                    </Text>
                  </View>
                )}
                
                {member.isMoving && (
                  <View style={styles.compactDetailItem}>
                    <Ionicons name="walk" size={12} color="#16a34a" />
                    <Text style={[styles.compactDetailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                      Movendo
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {members.map((member) => (
        <TouchableOpacity 
          key={member.userId} 
          style={[styles.memberCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
          onPress={() => onMemberPress?.(member)}
        >
          <View style={styles.memberHeader}>
            <View style={[styles.memberAvatar, { 
              backgroundColor: getMemberStatusColor(member)
            }]}>
              <Text style={styles.memberAvatarText}>
                {(member.nickname || member.userName || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={[styles.memberName, { color: isDark ? '#f9fafb' : '#111827' }]}>
                {member.nickname || member.userName}
              </Text>
              <Text style={[styles.memberStatus, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                Última localização: {formatLastUpdate(member.timestamp)}
              </Text>
              {member.lastInteraction && (
                <Text style={[styles.memberStatus, { color: isDark ? '#9ca3af' : '#6b7280', marginTop: 2 }]}>
                  Última interação: {formatLastUpdate(member.lastInteraction)}
                </Text>
              )}
              {member.address && (
                <Text style={[styles.memberAddress, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
                  {member.address}
                </Text>
              )}
            </View>
            <View style={styles.memberActions}>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={isDark ? '#6b7280' : '#9ca3af'} 
              />
            </View>
          </View>

          <View style={styles.memberDetails}>
            {member.batteryLevel !== null && member.batteryLevel !== undefined && (
              <View style={styles.detailItem}>
                <Ionicons
                  name="battery-charging"
                  size={14}
                  color={member.batteryLevel < 0.2 ? '#dc2626' : '#16a34a'}
                  style={styles.detailIcon}
                />
                <Text style={[styles.detailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  {Math.round(member.batteryLevel * 100)}%
                </Text>
              </View>
            )}
            
            {member.isMoving && (
              <View style={styles.detailItem}>
                <Ionicons name="walk" size={14} color="#16a34a" style={styles.detailIcon} />
                <Text style={[styles.detailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  Em movimento
                </Text>
              </View>
            )}
            
            {member.accuracy && (
              <View style={styles.detailItem}>
                <Ionicons 
                  name="radio-outline" 
                  size={14} 
                  color={isDark ? '#9ca3af' : '#6b7280'} 
                  style={styles.detailIcon} 
                />
                <Text style={[styles.detailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  ±{Math.round(member.accuracy)}m
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  memberCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberStatus: {
    fontSize: 14,
  },
  memberAddress: {
    fontSize: 12,
    marginTop: 2,
  },
  memberActions: {
    marginLeft: 8,
  },
  memberDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 4,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
 
  compactMemberCard: {
    width: 140,
    marginRight: 12,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  compactMemberHeader: {
    alignItems: 'center',
  },
  compactMemberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactMemberAvatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  compactMemberName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  compactMemberStatus: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 8,
  },
  compactMemberDetails: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  compactDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactDetailText: {
    fontSize: 10,
    marginLeft: 2,
  },
});
