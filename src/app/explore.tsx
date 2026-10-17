import { useAuth } from '@clerk/expo';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { askListingQuestion, interpretListingSearch, searchListings, transcribeAudio } from '@/lib/auth-api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ListingSearchResult, SearchFilters } from '@/lib/search';

type ChatMessage = { role: 'user' | 'assistant'; text: string; citations?: { title: string; url: string }[] };
const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;

export default function ExploreScreen() {
  const theme = useTheme();
  const { getToken } = useAuth();
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [prompt, setPrompt] = useState('');
  const [filters, setFilters] = useState<SearchFilters | null>(null);
  const [results, setResults] = useState<ListingSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ListingSearchResult | null>(null);
  const [question, setQuestion] = useState('');
  const [threadId, setThreadId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const token = useCallback(async () => {
    const value = await getToken();
    if (!value) throw new Error('Your session expired. Please sign in again.');
    return value;
  }, [getToken]);

  const search = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsSearching(true); setError(null); setSelected(null); setMessages([]); setThreadId(undefined);
    try {
      const interpreted = await interpretListingSearch(await token(), { prompt });
      const found = await searchListings(await token(), interpreted.filters);
      setFilters(found.filters); setResults(found.listings);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to search listings.'); setResults([]); }
    finally { setIsSearching(false); }
  }, [prompt, token]);

  const voiceSearch = useCallback(async () => {
    setError(null);
    try {
      if (!recorderState.isRecording) {
        const permission = await requestRecordingPermissionsAsync();
        if (!permission.granted) throw new Error('Microphone access is required for voice search.');
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        await recorder.record({ forDuration: 30 });
        return;
      }
      await recorder.stop();
      if (!recorder.uri) throw new Error('No audio was captured. Please try again.');
      const blob = await fetch(recorder.uri).then((response) => response.blob());
      const result = await transcribeAudio(await token(), blob, 'student-search.m4a');
      setPrompt(result.text);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to transcribe audio.'); }
  }, [recorder, recorderState.isRecording, token]);

  const ask = useCallback(async () => {
    if (!selected || !question.trim()) return;
    const text = question.trim(); setQuestion(''); setIsAsking(true); setError(null);
    setMessages((current) => [...current, { role: 'user', text }]);
    try {
      const answer = await askListingQuestion(await token(), selected.id, text, threadId);
      setThreadId(answer.threadId);
      setMessages((current) => [...current, { role: 'assistant', text: answer.message.text, citations: answer.message.citations }]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to answer that question.'); }
    finally { setIsAsking(false); }
  }, [question, selected, threadId, token]);

  const filterSummary = useMemo(() => {
    if (!filters) return null;
    return [filters.maxMonthlyRentCents && `≤ ${money(filters.maxMonthlyRentCents)}`, filters.bedrooms && `${filters.bedrooms} bed`, filters.busRoute, ...filters.accessibilityTags].filter(Boolean).join(' · ') || 'AI interpreted your request.';
  }, [filters]);

  if (selected) return <ScrollView style={{ backgroundColor: theme.background }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.detail} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => setSelected(null)}><ThemedText type="link">‹ Back to results</ThemedText></Pressable>
    <ThemedText type="title">{selected.title}</ThemedText><ThemedText themeColor="textSecondary">{selected.address}</ThemedText>
    <ThemedView type="backgroundElement" style={styles.card}><ThemedText type="subtitle">{money(selected.monthlyRentCents)}/month</ThemedText><ThemedText selectable>{selected.bedrooms} bed · {selected.bathrooms} bath · {selected.availableFrom}–{selected.availableUntil}</ThemedText><ThemedText selectable>{selected.description}</ThemedText><ThemedText themeColor="textSecondary">{[...selected.accessibilityTags, ...selected.amenities, ...selected.busRoutes].join(' · ') || 'No extra listing details provided.'}</ThemedText></ThemedView>
    <ThemedText type="subtitle">Ask about this place</ThemedText><ThemedText themeColor="textSecondary">Answers use approved listing data. Confirm unknown details with the lister.</ThemedText>
    {messages.map((message, index) => <ThemedView key={`${message.role}-${index}`} type="backgroundElement" style={[styles.message, message.role === 'user' && { borderColor: theme.tint, borderWidth: 1 }]}><ThemedText type="smallBold">{message.role === 'user' ? 'You' : 'Legends AI'}</ThemedText><ThemedText selectable>{message.text}</ThemedText>{message.citations?.map((citation) => <ThemedText key={citation.url} type="small" themeColor="textSecondary">Source: {citation.title}</ThemedText>)}</ThemedView>)}
    <TextInput value={question} onChangeText={setQuestion} placeholder="e.g. Is parking included?" placeholderTextColor={theme.textSecondary} multiline style={[styles.input, { borderColor: theme.backgroundSelected, color: theme.text }]} />
    <Pressable disabled={isAsking || !question.trim()} onPress={() => void ask()} style={({ pressed }) => [styles.button, { backgroundColor: theme.tint }, (pressed || isAsking) && styles.pressed]}>{isAsking ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Ask Legends AI</ThemedText>}</Pressable>{error ? <ThemedText selectable style={{ color: theme.danger }}>{error}</ThemedText> : null}
  </ScrollView>;

  return <FlatList data={results} keyExtractor={(item) => item.id} style={{ backgroundColor: theme.background }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled"
    ListHeaderComponent={<View style={styles.header}><ThemedText type="title">Find your next place</ThemedText><ThemedText themeColor="textSecondary">Describe the lease, budget, transit, accessibility, or campus location you need.</ThemedText><TextInput value={prompt} onChangeText={setPrompt} placeholder="A furnished, accessible place near campus under $900…" placeholderTextColor={theme.textSecondary} multiline style={[styles.input, { borderColor: theme.backgroundSelected, color: theme.text }]} /><View style={styles.actions}><Pressable disabled={isSearching || !prompt.trim()} onPress={() => void search()} style={({ pressed }) => [styles.button, styles.grow, { backgroundColor: theme.tint }, (pressed || isSearching) && styles.pressed]}>{isSearching ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Search with AI</ThemedText>}</Pressable><Pressable accessibilityLabel={recorderState.isRecording ? 'Stop recording' : 'Record voice search'} onPress={() => void voiceSearch()} style={({ pressed }) => [styles.voice, { borderColor: recorderState.isRecording ? theme.danger : theme.tint }, pressed && styles.pressed]}><ThemedText style={{ color: recorderState.isRecording ? theme.danger : theme.tint }}>{recorderState.isRecording ? 'Stop' : 'Voice'}</ThemedText></Pressable></View>{filterSummary ? <ThemedView type="backgroundElement" style={styles.note}><ThemedText type="smallBold">Filters</ThemedText><ThemedText themeColor="textSecondary">{filterSummary}</ThemedText></ThemedView> : null}{error ? <ThemedText selectable style={{ color: theme.danger }}>{error}</ThemedText> : null}{!isSearching && filters && results.length === 0 ? <ThemedText themeColor="textSecondary">No published listings match yet. Try a wider budget, date range, or fewer requirements.</ThemedText> : null}</View>}
    renderItem={({ item }) => <Pressable onPress={() => setSelected(item)} style={({ pressed }) => [styles.result, pressed && styles.pressed]}><ThemedView type="backgroundElement" style={styles.card}><View style={styles.row}><ThemedText type="subtitle">{item.title}</ThemedText><ThemedText type="smallBold">{money(item.monthlyRentCents)}</ThemedText></View><ThemedText themeColor="textSecondary">{item.address}{item.distanceMiles !== undefined ? ` · ${item.distanceMiles} mi away` : ''}</ThemedText><ThemedText>{item.bedrooms} bed · {item.bathrooms} bath · Available {item.availableFrom}</ThemedText><ThemedText type="small" themeColor="textSecondary">{[...item.accessibilityTags, ...item.busRoutes].join(' · ')}</ThemedText></ThemedView></Pressable>}
  />;
}

const styles = StyleSheet.create({ list: { padding: Spacing.four, gap: Spacing.three, paddingBottom: 120 }, detail: { padding: Spacing.four, gap: Spacing.three, paddingBottom: 120 }, header: { gap: Spacing.three, marginBottom: Spacing.three }, input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Spacing.three, minHeight: 54, padding: Spacing.three, textAlignVertical: 'top' }, actions: { flexDirection: 'row', gap: Spacing.two }, grow: { flex: 1 }, button: { alignItems: 'center', borderRadius: Spacing.three, justifyContent: 'center', minHeight: 48, paddingHorizontal: Spacing.four }, voice: { alignItems: 'center', borderRadius: Spacing.three, borderWidth: 1, justifyContent: 'center', minWidth: 76, paddingHorizontal: Spacing.three }, buttonText: { color: '#FFFFFF', fontWeight: '700' }, pressed: { opacity: 0.65 }, note: { gap: Spacing.one, padding: Spacing.three, borderRadius: Spacing.three, borderCurve: 'continuous' }, result: { marginBottom: Spacing.three }, card: { gap: Spacing.two, padding: Spacing.four, borderRadius: Spacing.four, borderCurve: 'continuous' }, row: { flexDirection: 'row', gap: Spacing.three, justifyContent: 'space-between' }, message: { gap: Spacing.one, padding: Spacing.three, borderRadius: Spacing.three, borderCurve: 'continuous' } });
