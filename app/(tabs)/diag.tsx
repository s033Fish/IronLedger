// screens/Diag.tsx
import { getApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Button, ScrollView, Text, View } from 'react-native';

export default function Diag() {
  const [result, setResult] = useState<string>('(tap "Run checks")');

  async function runChecks() {
    try {
      // 1) Show which Firebase project the TestFlight build is using
      const opts: any = getApp().options;
      const projectId = opts?.projectId ?? '(missing)';
      const apiKey = (opts?.apiKey || '').slice(0, 8) + '...';

      Alert.alert('Firebase Project', `projectId=${projectId}\napiKey=${apiKey}`);

      // 2) Verify envs are actually present in the release bundle
      const keys = [
        'EXPO_PUBLIC_FIREBASE_API_KEY',
        'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
        'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
        'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
        'EXPO_PUBLIC_FIREBASE_APP_ID',
      ];
      const missing = keys.filter(k => !process.env[k as any]);
      if (missing.length) {
        Alert.alert('Missing envs', missing.join('\n'));
      }

      // 3) Ping Firestore (adjust collection name to something tiny that exists)
      const db = getFirestore();
      const snap = await getDocs(collection(db, 'health')); // <-- create a 'health' coll with 1 doc
      const msg = `Firestore OK: docs=${snap.size} (projectId=${projectId})`;
      setResult(msg);
      Alert.alert('Ping Firestore', msg);
    } catch (e: any) {
      const msg = `Firestore error: ${e?.code || ''} ${e?.message || String(e)}`;
      setResult(msg);
      Alert.alert('Ping Firestore FAILED', msg);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Firebase Diagnostics</Text>
      <Button title="Run checks" onPress={runChecks} />
      <View style={{ padding: 12, backgroundColor: '#eee', borderRadius: 8 }}>
        <Text selectable>{result}</Text>
      </View>
      <View style={{ padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
        <Text selectable>
          projectId (from code): {getApp().options?.projectId || '(missing)'}
        </Text>
      </View>
    </ScrollView>
  );
}
