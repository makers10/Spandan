import { StyleSheet } from 'react-native';

export const authStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  headingSection: { marginVertical: 12 },
  mainTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 10 },
  checkbox: {
    width: 18, height: 18, borderRadius: 5, borderWidth: 1.5,
    borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#006b5d', borderColor: '#006b5d' },
  rememberText: { fontSize: 13, color: '#475569' },
  footerLink: { alignItems: 'center', marginTop: 20, padding: 8 },
  footerText: { fontSize: 13, color: '#64748b' },
  footerHighlight: { color: '#006b5d', fontWeight: '700' },
  successBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#e6f4f1',
    padding: 12, borderRadius: 12, marginVertical: 8,
  },
  successTitle: { fontSize: 14, fontWeight: '700', color: '#006b5d' },
  successSub: { fontSize: 12, color: '#006b5d', marginTop: 2 },
});

