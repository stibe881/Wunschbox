import React, { useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, Vibration, View } from 'react-native'

export const colors = {
  bg: '#f1f5f9',
  card: '#ffffff',
  border: '#e2e8f0',
  dark: '#0f172a',
  text: '#1e293b',
  muted: '#64748b',
  faint: '#94a3b8',
  brand: '#c81e1e',
  brandLight: '#e02424',
  brandBg: '#fff1f1',
  green: '#059669',
  greenBg: '#d1fae5',
  violet: '#7c3aed',
  violetBg: '#ede9fe',
  amber: '#b45309',
  amberBg: '#fef3c7',
}

export function Badge({ label, color = 'slate' }: { label: string; color?: 'slate' | 'green' | 'red' | 'violet' | 'amber' }) {
  const map = {
    slate: { bg: '#f1f5f9', fg: '#475569' },
    green: { bg: colors.greenBg, fg: colors.green },
    red: { bg: colors.brandBg, fg: colors.brand },
    violet: { bg: colors.violetBg, fg: colors.violet },
    amber: { bg: colors.amberBg, fg: colors.amber },
  }[color]
  return (
    <View style={{ backgroundColor: map.bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ color: map.fg, fontSize: 11, fontWeight: '600' }}>{label}</Text>
    </View>
  )
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>
}

/** Auslöse-Button mit Halte-Geste – gedrückt halten füllt den Button, bei 100 % wird ausgelöst. */
export function HoldButton({ onTrigger, label, hint = 'Zum Auslösen gedrückt halten', holdMs = 1200 }: {
  onTrigger: () => void
  label: string
  hint?: string
  holdMs?: number
}) {
  const progress = useRef(new Animated.Value(0)).current
  const [holding, setHolding] = useState(false)

  function start() {
    setHolding(true)
    Animated.timing(progress, { toValue: 1, duration: holdMs, easing: Easing.linear, useNativeDriver: false }).start(({ finished }) => {
      if (finished) {
        progress.setValue(0)
        setHolding(false)
        Vibration.vibrate([0, 120, 60, 120])
        onTrigger()
      }
    })
  }

  function stop() {
    setHolding(false)
    Animated.timing(progress, { toValue: 0, duration: 120, useNativeDriver: false }).start()
  }

  return (
    <Pressable onPressIn={start} onPressOut={stop} style={styles.holdButton}>
      <Animated.View
        style={[
          styles.holdFill,
          { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
      />
      <Text style={styles.holdLabel}>{label}</Text>
      <Text style={styles.holdHint}>{holding ? 'Halten…' : hint}</Text>
    </Pressable>
  )
}

export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'gerade eben'
  if (diff < 3600_000) return `vor ${Math.floor(diff / 60_000)} Min.`
  if (diff < 86_400_000) return `vor ${Math.floor(diff / 3_600_000)} Std.`
  return new Date(ts).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  holdButton: {
    backgroundColor: colors.brandLight,
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  holdFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.brand,
  },
  holdLabel: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  holdHint: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 3,
  },
})
