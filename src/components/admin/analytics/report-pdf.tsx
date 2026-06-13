import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { SectionAgg } from '@/lib/analytics/queries'

const s = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: '#1a2e1a' },
  h1: { fontSize: 18, marginBottom: 4, color: '#2e7d32' },
  meta: { fontSize: 9, color: '#666', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottom: '1pt solid #eee' },
  kpi: { marginBottom: 12 },
})

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`
}

interface Props {
  title: string
  subtitle: string
  kpis: { label: string; value: string }[]
  sections: SectionAgg[]
}

export function ReportPDF({ title, subtitle, kpis, sections }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>{title}</Text>
        <Text style={s.meta}>{subtitle} · Generado {new Date().toLocaleString('es-ES')}</Text>
        <View style={s.kpi}>
          {kpis.map(k => <View key={k.label} style={s.row}><Text>{k.label}</Text><Text>{k.value}</Text></View>)}
        </View>
        <Text style={{ fontSize: 12, marginVertical: 8 }}>Secciones más visitadas</Text>
        {sections.map(sec => (
          <View key={sec.section} style={s.row}><Text>{sec.section}</Text><Text>{sec.visits} visitas · {fmt(sec.totalSeconds)}</Text></View>
        ))}
      </Page>
    </Document>
  )
}
