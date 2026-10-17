import { useAuth } from '@clerk/expo';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { askListingQuestion } from '@/lib/auth-api';
import type { Apartment } from '@/data/types';

import { CircleButton, Group, Tap, text } from './ui';
import { useMapsTheme } from '@/constants/maps-theme';

type Message = { role: 'user' | 'assistant'; text: string };

export function ListingAssistant({ apartment, onClose }: { apartment: Apartment; onClose: () => void }) {
  const { colors } = useMapsTheme();
  const { getToken } = useAuth();
  const [draft, setDraft] = useState('');
  const [threadId, setThreadId] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const question = draft.trim();
    if (!question || loading) return;
    setDraft(''); setError(undefined); setLoading(true);
    setMessages((current) => [...current, { role: 'user', text: question }]);
    try {
      const token = await getToken();
      if (!token) throw new Error('Your session expired. Please sign in again.');
      const response = await askListingQuestion(token, apartment.id, question, threadId);
      setThreadId(response.threadId);
      setMessages((current) => [...current, { role: 'assistant', text: response.message.text }]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to reach Legends AI.'); }
    finally { setLoading(false); }
  };

  return <View>
    <View style={styles.header}><View style={styles.flex}><Text style={[text.largeTitle, { color: colors.label }]}>Ask Legends AI</Text><Text style={[text.subhead, { color: colors.secondaryLabel }]}>{apartment.name}</Text></View><CircleButton ios="xmark" md="close" label="Close assistant" onPress={onClose} /></View>
    <Text style={[text.footnote, { color: colors.secondaryLabel }]}>Answers use the approved listing details. We’ll say when something is unknown.</Text>
    <View style={styles.messages}>{messages.map((message, index) => <Group key={`${message.role}-${index}`} style={[styles.message, message.role === 'user' && { borderColor: colors.tint, borderWidth: 1 }]}><Text style={[text.caption, { color: colors.secondaryLabel }]}>{message.role === 'user' ? 'YOU' : 'LEGENDS AI'}</Text><Text style={[text.body, { color: colors.label }]}>{message.text}</Text></Group>)}</View>
    {error ? <Text style={[text.footnote, { color: colors.crimson }]}>{error}</Text> : null}
    <TextInput value={draft} onChangeText={setDraft} placeholder="Is parking included?" placeholderTextColor={colors.secondaryLabel} multiline style={[styles.input, { borderColor: colors.separator, color: colors.label, backgroundColor: colors.card }]} />
    <Tap onPress={() => void send()} accessibilityRole="button" style={[styles.send, { backgroundColor: colors.tint }]}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Ask AI</Text>}</Tap>
  </View>;
}

const styles = StyleSheet.create({ header: { flexDirection: 'row', alignItems: 'center', gap: 12 }, flex: { flex: 1 }, messages: { gap: 8, marginTop: 16 }, message: { gap: 4, padding: 12 }, input: { minHeight: 52, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, marginTop: 16, textAlignVertical: 'top' }, send: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 }, sendText: { color: '#fff', fontWeight: '700', fontSize: 16 } });
