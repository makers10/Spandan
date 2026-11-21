import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SmartInsight } from '@/utils/fitness-insights';
import { styles } from './smart-insights-feed.styles';

interface SmartInsightsFeedProps {
  insights: SmartInsight[];
}

export function SmartInsightsFeed({ insights }: SmartInsightsFeedProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="sparkles" size={16} color="#059669" />
          </View>
          <Text style={styles.titleText}>Movement Intelligence</Text>
        </View>
        <View style={styles.livePill}>
          <Text style={styles.livePillText}>SMART COACH</Text>
        </View>
      </View>

      <View style={styles.insightsList}>
        {insights.map((item) => (
          <View key={item.id} style={styles.insightRow}>
            <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon as any} size={18} color={item.iconColor} />
            </View>

            <View style={styles.contentCol}>
              <View style={styles.rowHeader}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
              <Text style={styles.headlineText}>{item.headline}</Text>
              <Text style={styles.messageText}>{item.message}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
