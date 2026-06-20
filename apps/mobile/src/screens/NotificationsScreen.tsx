import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../api/client';
import type { Notification } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, radius, font, shadow } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

// Badge colors tuned for dark surface — vibrant enough to read on #1B1D17
const TYPE_COLORS: Record<Notification['type'], { bg: string; fg: string }> = {
  booking: { bg: 'rgba(127,183,255,0.15)', fg: colors.info },
  payment: { bg: 'rgba(123,224,138,0.15)', fg: colors.success },
  otp:     { bg: 'rgba(210,243,76,0.12)',  fg: colors.accent },
  promo:   { bg: 'rgba(244,196,48,0.15)',  fg: colors.gold },
  system:  { bg: 'rgba(155,160,141,0.15)', fg: colors.muted },
};

export default function NotificationsScreen({ navigation }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data as Notification[]);
      setUnread((data.meta as { unread: number })?.unread ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: string) => {
    try {
      const { data } = await api.patch(`/notifications/${id}/read`);
      const updated = data.data as Notification;
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? updated : n)),
      );
      setUnread((prev) => Math.max(0, prev - 1));
    } catch {
      Alert.alert('Error', 'Could not mark as read.');
    }
  };

  const markAllRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {
      Alert.alert('Error', 'Could not mark all as read.');
    } finally {
      setMarkingAll(false);
    }
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: unread > 0
        ? () => (
            <Pressable onPress={markAllRead} hitSlop={8} disabled={markingAll}>
              <Text style={styles.headerAction}>{markingAll ? 'Marking…' : 'Mark all read'}</Text>
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, unread, markingAll, markAllRead]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={notifications}
      keyExtractor={(item) => item._id}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={load}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
      ListHeaderComponent={
        unread > 0 ? (
          <View style={styles.unreadBanner}>
            <View style={styles.unreadDotLarge} />
            <Text style={styles.unreadBannerText}>
              {unread} unread notification{unread !== 1 ? 's' : ''}
            </Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        !loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No notifications yet.</Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => {
        const badge = TYPE_COLORS[item.type];
        return (
          <Pressable
            style={[styles.card, !item.read && styles.cardUnread]}
            onPress={() => {
              if (!item.read) markRead(item._id);
            }}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardLeft}>
                {!item.read && <View style={styles.unreadDot} />}
                <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.typeBadgeText, { color: badge.fg }]}>
                    {item.type}
                  </Text>
                </View>
              </View>
              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            </View>
            <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
            {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },

  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(210,243,76,0.1)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(210,243,76,0.25)',
  },
  unreadDotLarge: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  unreadBannerText: {
    color: colors.accent,
    fontFamily: font.bold,
    fontWeight: '700',
    fontSize: font.size.sm,
  },

  headerAction: {
    color: colors.accent,
    fontFamily: font.medium,
    fontWeight: '600',
    fontSize: font.size.md,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    borderColor: colors.border,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  typeBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  typeBadgeText: {
    fontSize: font.size.xs,
    fontFamily: font.bold,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: font.size.xs,
    color: colors.muted,
    fontFamily: font.regular,
  },

  title: {
    fontSize: font.size.md,
    fontFamily: font.medium,
    fontWeight: '600',
    color: colors.text,
  },
  titleUnread: {
    fontFamily: font.bold,
    fontWeight: '800',
    color: colors.text,
  },
  body: {
    marginTop: spacing.xs,
    fontSize: font.size.sm,
    fontFamily: font.regular,
    color: colors.muted,
    lineHeight: 19,
  },

  empty: { paddingVertical: 64, alignItems: 'center' },
  emptyText: { color: colors.muted, fontFamily: font.regular, fontSize: font.size.md },
});
