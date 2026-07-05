import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Svg, Rect, Line } from '@react-pdf/renderer';
import type { WindowConfig, Section } from '../../store/windowStore';
import type { CalculationResult } from '../../lib/pricingEngine';
import { useI18nStore } from '../../store/i18nStore';

// Register a Cyrillic font
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf'
});

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Roboto', fontSize: 12, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottom: '2px solid #3b82f6', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e3a8a' },
  subtitle: { fontSize: 14, color: '#64748b' },
  infoBlock: { marginBottom: 20 },
  infoText: { marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 10, backgroundColor: '#f1f5f9', padding: 5 },
  table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 20 },
  tableRow: { flexDirection: 'row' },
  tableColHeader: { width: '25%', borderStyle: 'solid', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#e2e8f0', padding: 5, fontWeight: 'bold' },
  tableCol: { width: '25%', borderStyle: 'solid', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#cbd5e1', padding: 5 },
  tableColHeaderWide: { width: '50%', borderStyle: 'solid', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#e2e8f0', padding: 5, fontWeight: 'bold' },
  tableColWide: { width: '50%', borderStyle: 'solid', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#cbd5e1', padding: 5 },
  totalBlock: { alignSelf: 'flex-end', marginTop: 20, width: 200, padding: 10, backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' },
  totalText: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  kaspiBlock: { marginTop: 30, padding: 10, border: '1px dashed #3b82f6', backgroundColor: '#eff6ff', borderRadius: 5 },
  kaspiText: { color: '#1d4ed8', fontWeight: 'bold' }
});

const FRAME_WIDTH = 60;
const SASH_WIDTH = 50;
const MULLION_WIDTH = 60;

const renderSectionPDF = (section: Section, x: number, y: number, w: number, h: number): React.ReactNode => {
  if (section.type === 'split-v') {
    const split = section.splitRatio || 0.5;
    const leftW = Math.max(0, w * split - MULLION_WIDTH / 2);
    const rightW = Math.max(0, w * (1 - split) - MULLION_WIDTH / 2);
    const rightX = x + leftW + MULLION_WIDTH;

    return (
      <React.Fragment key={section.id}>
        <Rect x={x + leftW} y={y} width={MULLION_WIDTH} height={h} fill="#e5e7eb" stroke="#9ca3af" strokeWidth={2} />
        {section.children?.[0] && renderSectionPDF(section.children[0], x, y, leftW, h)}
        {section.children?.[1] && renderSectionPDF(section.children[1], rightX, y, rightW, h)}
      </React.Fragment>
    );
  }

  if (section.type === 'split-h') {
    const split = section.splitRatio || 0.5;
    const topH = Math.max(0, h * split - MULLION_WIDTH / 2);
    const bottomH = Math.max(0, h * (1 - split) - MULLION_WIDTH / 2);
    const bottomY = y + topH + MULLION_WIDTH;

    return (
      <React.Fragment key={section.id}>
        <Rect x={x} y={y + topH} width={w} height={MULLION_WIDTH} fill="#e5e7eb" stroke="#9ca3af" strokeWidth={2} />
        {section.children?.[0] && renderSectionPDF(section.children[0], x, y, w, topH)}
        {section.children?.[1] && renderSectionPDF(section.children[1], x, bottomY, w, bottomH)}
      </React.Fragment>
    );
  }

  const isSash = section.type === 'sash';
  const glassX = x + (isSash ? SASH_WIDTH : 0);
  const glassY = y + (isSash ? SASH_WIDTH : 0);
  const glassW = Math.max(0, w - (isSash ? SASH_WIDTH * 2 : 0));
  const glassH = Math.max(0, h - (isSash ? SASH_WIDTH * 2 : 0));

  return (
    <React.Fragment key={section.id}>
      {isSash && (
        <Rect x={x} y={y} width={w} height={h} fill="#f3f4f6" stroke="#9ca3af" strokeWidth={2} />
      )}
      <Rect x={glassX} y={glassY} width={glassW} height={glassH} fill="#bae6fd" stroke="#9ca3af" strokeWidth={2} opacity={0.6} />
      
      {isSash && section.openingMode !== 'fixed' && (
        <React.Fragment>
          {(section.openingMode === 'turn' || section.openingMode === 'tilt-turn') && (
            <Line x1={glassX} y1={glassY} x2={glassX + glassW} y2={glassY + glassH/2} stroke="#6b7280" strokeWidth={2} strokeDasharray="10, 10" />
          )}
          {(section.openingMode === 'turn' || section.openingMode === 'tilt-turn') && (
             <Line x1={glassX + glassW} y1={glassY + glassH/2} x2={glassX} y2={glassY + glassH} stroke="#6b7280" strokeWidth={2} strokeDasharray="10, 10" />
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export const CommercialOfferPDF = ({ config, calc, kaspiPhone }: { config: WindowConfig, calc: CalculationResult, kaspiPhone?: string }) => {
  const vbW = config.width + 100;
  const vbH = config.height + 100;
  // We can just read the current state of translations synchronously here
  const t = useI18nStore.getState().t;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('app.name').toUpperCase()}</Text>
            <Text style={styles.subtitle}>{t('pdf.commercial_offer')}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text>{t('pdf.date')} {new Date().toLocaleDateString('ru-RU')}</Text>
            <Text>{t('pdf.order_no')} {Math.floor(Math.random() * 1000)}</Text>
          </View>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.infoText}>{t('pdf.client')} {t('pdf.client_default')}</Text>
          <Text style={styles.infoText}>{t('pdf.address')} {t('pdf.address_default')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('pdf.spec_title')}</Text>
        
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          {/* We scale the SVG down to fit the A4 width (~500 points wide) */}
          <Svg viewBox={`-50 -50 ${vbW} ${vbH}`} width={300} height={(300 * vbH) / vbW}>
            <Rect x={0} y={0} width={config.width} height={config.height} fill="#e5e7eb" stroke="#4b5563" strokeWidth={4} />
            {renderSectionPDF(config.rootSection, FRAME_WIDTH, FRAME_WIDTH, config.width - FRAME_WIDTH * 2, config.height - FRAME_WIDTH * 2)}
          </Svg>
          <Text style={{ marginTop: 10, fontSize: 10 }}>{t('pdf.item')} 1: {config.width}x{config.height} мм</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('pdf.budget_title')}</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeaderWide}><Text>{t('pdf.table.name')}</Text></View>
            <View style={styles.tableColHeader}><Text>{t('pdf.table.qty')}</Text></View>
            <View style={styles.tableColHeader}><Text>{t('pdf.table.sum')}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableColWide}><Text>{t('pdf.table.window')} ({config.width}x{config.height} мм)</Text></View>
            <View style={styles.tableCol}><Text>1 {t('pdf.unit.pcs')}</Text></View>
            <View style={styles.tableCol}><Text>{(calc.retailPrice - calc.extrasCost * (calc.materialsCost ? (calc.retailPrice / calc.materialsCost) : 1)).toLocaleString('ru-RU')} ₸</Text></View>
          </View>
          {config.extras?.sillLength > 0 && (
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}><Text>{t('calc.extras.sill').replace(' (мм)', '')}</Text></View>
              <View style={styles.tableCol}><Text>{(config.extras.sillLength / 1000).toFixed(2)} {t('pdf.unit.m')}</Text></View>
              <View style={styles.tableCol}><Text>{t('pdf.included')}</Text></View>
            </View>
          )}
          {config.extras?.ebbLength > 0 && (
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}><Text>{t('calc.extras.ebb').replace(' (мм)', '')}</Text></View>
              <View style={styles.tableCol}><Text>{(config.extras.ebbLength / 1000).toFixed(2)} {t('pdf.unit.m')}</Text></View>
              <View style={styles.tableCol}><Text>{t('pdf.included')}</Text></View>
            </View>
          )}
          {config.extras?.mosquitoCount > 0 && (
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}><Text>{t('calc.extras.mosquito').replace(' (шт)', '')}</Text></View>
              <View style={styles.tableCol}><Text>{config.extras.mosquitoCount} {t('pdf.unit.pcs')}</Text></View>
              <View style={styles.tableCol}><Text>{t('pdf.included')}</Text></View>
            </View>
          )}
          {config.extras?.slopesLength > 0 && (
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}><Text>{t('calc.extras.slope').replace(' (мм)', '')}</Text></View>
              <View style={styles.tableCol}><Text>{(config.extras.slopesLength / 1000).toFixed(2)} {t('pdf.unit.m')}</Text></View>
              <View style={styles.tableCol}><Text>{t('pdf.included')}</Text></View>
            </View>
          )}
          <View style={styles.tableRow}>
            <View style={styles.tableColWide}><Text>{t('pdf.table.installation')}</Text></View>
            <View style={styles.tableCol}><Text>1 {t('pdf.unit.compl')}</Text></View>
            <View style={styles.tableCol}><Text>{t('pdf.included')}</Text></View>
          </View>
        </View>

        <View style={styles.totalBlock}>
          <Text style={styles.totalText}>{t('pdf.total')} {calc.retailPrice.toLocaleString('ru-RU')} ₸</Text>
          <Text>{t('pdf.prepayment')} {(calc.retailPrice * 0.7).toLocaleString('ru-RU')} ₸</Text>
        </View>

        {kaspiPhone && (
          <View style={styles.kaspiBlock}>
            <Text style={styles.kaspiText}>{t('pdf.kaspi.title')}</Text>
            <Text style={{ marginTop: 5 }}>{t('pdf.kaspi.transfer')} {kaspiPhone}</Text>
          </View>
        )}

        <View style={{ marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text>{t('pdf.sign.master')}</Text>
          <Text>{t('pdf.sign.client')}</Text>
        </View>
        <Text style={{ marginTop: 10, fontSize: 9, color: '#94a3b8' }}>
          {t('pdf.footer')}
        </Text>
      </Page>
    </Document>
  );
};
