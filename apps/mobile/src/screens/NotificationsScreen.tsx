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

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

const TYPE_COLORS: Record<Notification['type'], { bg: string; fg: string }> = {
  booking: { bg: '#dbeafe', fg: '#1e40af' },
  payment: { bg: '#dcfce7', fg: '#166534' },
  otp: { bg: '#ede9fe', fg: '#5b21b6' },
  promo: { bg: '#fef9c3', fg: '#854d0e' },
  system: { bg: '#f1f5f9', fg: '#475569' },
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
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      ListHeaderComponent={
        unread > 0 ? (
          <View style={styles.unreadBanner}>
            <Text style={styles.unreadBannerText}>{unread} unread notification{unread !== 1 ? 's' : ''}</Text>
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
        const color = TYPE_COLORS[item.type];
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
                <Text style={[styles.typeBadge, { backgroundColor: color.bg, color: color.fg }]}>
                  {item.type}
                </Text>
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
  list: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 16, paddingBottom: 32 },

  unreadBanner: {
    backgroundColor: '#ede9fe',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  unreadBannerText: { color: '#5b21b6', fontWeight: '700', fontSize: 13 },

  headerAction: { color: '#4f46e5', fontWeight: '600', fontSize: 14 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: '#4f46e5',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4f46e5',
  },
  typeBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
  dateText: { fontSize: 11, color: '#94a3b8' },

  title: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  titleUnread: { fontWeight: '800' },
  body: { marginTop: 4, fontSize: 13, color: '#475569', lineHeight: 18 },

  empty: { paddingVertical: 64, alignItems: 'center' },
  emptyText: { color: '#94a3b8' },
});
