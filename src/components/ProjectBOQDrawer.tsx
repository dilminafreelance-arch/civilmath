import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, FileSpreadsheet, FileText, Layers, Plus, Building2, HardHat, DollarSign } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useApp } from '../context/AppContext';
import { jsPDF } from 'jspdf';
import XLSX from 'xlsx-js-style';

export function ProjectBOQDrawer() {
  const { project, isBOQDrawerOpen, setIsBOQDrawerOpen, removeItemFromProject, updateItemQuantity, clearProject, updateProjectDetails, totals } = useProject();
  const { currency } = useApp();
  const [isEditingHeader, setIsEditingHeader] = useState(false);

  if (!isBOQDrawerOpen) return null;

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Master BOQ Sheet
      const data: any[][] = [
        ['CIVILMATH - MASTER PROJECT BILL OF QUANTITIES (BOQ)'],
        [`Project: ${project.name}`, '', `Date: ${new Date().toLocaleDateString()}`],
        [`Client: ${project.clientName || 'N/A'}`, '', `Engineer: ${project.engineerName || 'Site Engineer'}`],
        [],
        ['Item #', 'Structural Member / Element', 'Type / Module', 'Multiplier (Qty)', 'Unit Concrete (m³)', 'Total Concrete (m³)', 'Unit Steel (kg)', 'Total Steel (kg)', 'Estimated Cost'],
      ];

      project.items.forEach((item, idx) => {
        const conc = item.metrics.concreteM3 || 0;
        const steel = item.metrics.steelKg || 0;
        const cost = item.metrics.cost || 0;
        const qty = item.quantity || 1;

        data.push([
          idx + 1,
          item.title,
          item.category.toUpperCase(),
          qty,
          conc,
          parseFloat((conc * qty).toFixed(2)),
          steel,
          parseFloat((steel * qty).toFixed(1)),
          parseFloat((cost * qty).toFixed(2)),
        ]);
      });

      data.push([]);
      data.push([
        'TOTALS', '', '', project.items.reduce((s, i) => s + (i.quantity || 1), 0),
        '', totals.totalConcreteM3, '', totals.totalSteelKg, totals.totalCost
      ]);

      const ws = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = [
        { wch: 8 }, { wch: 30 }, { wch: 16 }, { wch: 16 },
        { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 18 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Master BOQ');
      XLSX.writeFile(wb, `${project.name.replace(/\s+/g, '_')}_Master_BOQ.xlsx`);
    } catch (err) {
      console.error('Failed to export BOQ to Excel', err);
      alert('Error exporting Excel sheet. Check input parameters.');
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header block
      doc.setFillColor(15, 23, 42);
      doc.rect(10, 10, 190, 26, 'F');
      doc.setFillColor(249, 115, 22);
      doc.rect(10, 36, 190, 1.5, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('CIVILMATH - MASTER BILL OF QUANTITIES (BOQ)', 15, 22);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text(`PROJECT: ${project.name.toUpperCase()}  |  ENGINEER: ${project.engineerName || 'CIVIL ENGINEER'}`, 15, 29);
      doc.text(`DATE: ${new Date().toLocaleDateString()}`, 155, 29);

      // Summary KPI Grid
      let y = 46;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('I. PROJECT MATERIAL QUANTITIES SUMMARY', 15, y);
      y += 6;

      const kpis = [
        { label: 'Total Concrete Volume', val: `${totals.totalConcreteM3} m³` },
        { label: 'Total Steel Weight', val: `${totals.totalSteelKg} kg (${(totals.totalSteelKg / 1000).toFixed(2)} T)` },
        { label: 'Total Masonry Bricks', val: `${totals.totalBricks.toLocaleString()} pcs` },
        { label: 'Total Estimated Cost', val: `${currency} ${totals.totalCost.toLocaleString()}` },
      ];

      kpis.forEach((kpi, i) => {
        const xPos = 15 + (i % 2) * 92;
        const yPos = y + Math.floor(i / 2) * 16;
        doc.setFillColor(248, 250, 252);
        doc.rect(xPos, yPos, 88, 14, 'F');
        doc.setFillColor(249, 115, 22);
        doc.rect(xPos, yPos, 2, 14, 'F');

        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.label, xPos + 5, yPos + 5);

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(kpi.val, xPos + 5, yPos + 11);
      });

      y += 38;

      // Itemized Schedule
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('II. ITEMIZED STRUCTURAL ELEMENTS SCHEDULE', 15, y);
      y += 6;

      // Table Header
      doc.setFillColor(30, 41, 59);
      doc.rect(15, y, 180, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.text('#', 18, y + 5);
      doc.text('Element Description', 26, y + 5);
      doc.text('Type', 85, y + 5);
      doc.text('Qty', 115, y + 5);
      doc.text('Concrete', 135, y + 5);
      doc.text('Steel', 165, y + 5);

      y += 7;

      project.items.forEach((item, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
        doc.rect(15, y, 180, 6.5, 'F');

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(String(idx + 1), 18, y + 4.5);
        doc.text(item.title.substring(0, 35), 26, y + 4.5);
        doc.text(item.category.toUpperCase(), 85, y + 4.5);
        doc.text(`×${item.quantity || 1}`, 115, y + 4.5);
        doc.text(`${((item.metrics.concreteM3 || 0) * (item.quantity || 1)).toFixed(2)} m³`, 135, y + 4.5);
        doc.text(`${((item.metrics.steelKg || 0) * (item.quantity || 1)).toFixed(1)} kg`, 165, y + 4.5);

        y += 6.5;
      });

      doc.save(`${project.name.replace(/\s+/g, '_')}_BOQ.pdf`);
    } catch (err) {
      console.error('Failed to export BOQ PDF', err);
      alert('Error creating PDF report.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsBOQDrawerOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative w-full max-w-xl bg-white dark:bg-[#131715] border-l border-[#E2E6E2] dark:border-[#1A211D] shadow-2xl flex flex-col h-full z-10 text-left"
        >
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-[#E2E6E2] dark:border-[#1A211D] flex items-center justify-between bg-[#F2F5F3]/70 dark:bg-[#090B0A]/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#141A16] dark:text-[#ECF2EE] leading-tight flex items-center gap-2">
                  <span>{project.name}</span>
                  <button
                    onClick={() => setIsEditingHeader(!isEditingHeader)}
                    className="text-[10px] text-brand hover:underline cursor-pointer font-normal"
                  >
                    {isEditingHeader ? 'Done' : 'Edit'}
                  </button>
                </h2>
                <p className="text-[10px] text-[#7A8981]">
                  {project.items.length} structural element{project.items.length === 1 ? '' : 's'} in project
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsBOQDrawerOpen(false)}
              className="p-2 rounded-xl hover:bg-[#ECF2EE]/60 dark:hover:bg-[#181E1A] text-[#7A8981] hover:text-[#141A16] dark:hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Inline Edit Form */}
          {isEditingHeader && (
            <div className="p-4 bg-brand/5 dark:bg-brand/10 border-b border-brand/20 dark:border-brand/30 space-y-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-[#7A8981] mb-1">Project Name</label>
                <input
                  type="text"
                  value={project.name}
                  onChange={e => updateProjectDetails({ name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#090B0A] border border-[#E2E6E2] dark:border-[#1A211D] rounded-xl text-xs text-[#141A16] dark:text-[#ECF2EE] outline-none focus:border-brand"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-[#7A8981] mb-1">Client Name</label>
                  <input
                    type="text"
                    value={project.clientName || ''}
                    onChange={e => updateProjectDetails({ clientName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#090B0A] border border-[#E2E6E2] dark:border-[#1A211D] rounded-xl text-xs text-[#141A16] dark:text-[#ECF2EE] outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-[#7A8981] mb-1">Engineer / In-Charge</label>
                  <input
                    type="text"
                    value={project.engineerName || ''}
                    onChange={e => updateProjectDetails({ engineerName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#090B0A] border border-[#E2E6E2] dark:border-[#1A211D] rounded-xl text-xs text-[#141A16] dark:text-[#ECF2EE] outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Project Summary Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-[#F2F5F3]/70 dark:bg-[#090B0A]/50 border-b border-[#E2E6E2] dark:border-[#1A211D] text-center">
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#131715] border border-[#E2E6E2]/80 dark:border-[#1A211D] shadow-2xs">
              <span className="text-[9px] font-semibold text-[#7A8981] uppercase block">Total Concrete</span>
              <span className="text-xs font-bold text-[#141A16] dark:text-[#ECF2EE]">{totals.totalConcreteM3} m³</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#131715] border border-[#E2E6E2]/80 dark:border-[#1A211D] shadow-2xs">
              <span className="text-[9px] font-semibold text-[#7A8981] uppercase block">Total Steel</span>
              <span className="text-xs font-bold text-brand">{totals.totalSteelKg} kg</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#131715] border border-[#E2E6E2]/80 dark:border-[#1A211D] shadow-2xs">
              <span className="text-[9px] font-semibold text-[#7A8981] uppercase block">Total Bricks</span>
              <span className="text-xs font-bold text-[#141A16] dark:text-[#ECF2EE]">{totals.totalBricks.toLocaleString()}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#131715] border border-[#E2E6E2]/80 dark:border-[#1A211D] shadow-2xs">
              <span className="text-[9px] font-semibold text-[#7A8981] uppercase block">Budget Total</span>
              <span className="text-xs font-bold text-[#22C55E]">{totals.totalCost > 0 ? `${totals.totalCost.toLocaleString()}` : '-'}</span>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {project.items.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-3">
                  <HardHat className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#141A16] dark:text-[#ECF2EE] mb-1">No Elements in Project Yet</h3>
                <p className="text-xs text-[#7A8981] max-w-sm mx-auto leading-relaxed">
                  This project bill of quantities is empty.
                </p>
              </div>
            ) : (
              project.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-[#E2E6E2] dark:border-[#1A211D] bg-white dark:bg-[#131715] shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#ECF2EE] dark:bg-[#181E1A] flex items-center justify-center text-[10px] font-bold text-[#7A8981]">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#141A16] dark:text-[#ECF2EE]">{item.title}</div>
                      <div className="text-[10px] text-[#7A8981] flex items-center gap-2 mt-0.5">
                        <span className="uppercase font-semibold">{item.category}</span>
                        {item.metrics.concreteM3 ? <span>• {item.metrics.concreteM3} m³</span> : null}
                        {item.metrics.steelKg ? <span>• {item.metrics.steelKg} kg</span> : null}
                        {item.metrics.bricksCount ? <span>• {item.metrics.bricksCount} bricks</span> : null}
                      </div>
                    </div>
                  </div>

                  {/* Multiplier & Delete */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-[#E2E6E2] dark:border-[#1A211D] rounded-lg overflow-hidden bg-[#F2F5F3] dark:bg-[#090B0A]">
                      <span className="px-2 text-[10px] font-bold text-[#7A8981]">×</span>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={item.quantity || 1}
                        onChange={e => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-12 py-1 text-center text-xs font-bold bg-transparent outline-none text-[#141A16] dark:text-[#ECF2EE]"
                      />
                    </div>
                    <button
                      onClick={() => removeItemFromProject(item.id)}
                      className="p-1.5 rounded-lg text-[#7A8981] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Actions Footer */}
          {project.items.length > 0 && (
            <div className="p-4 border-t border-[#E2E6E2] dark:border-[#1A211D] bg-white dark:bg-[#131715] space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleExportExcel}
                  className="flex-1 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16a34a] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Master BOQ (Excel)</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-primary-dark text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export PDF Report</span>
                </button>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all elements from this project?')) {
                    clearProject();
                  }
                }}
                className="w-full py-1.5 text-[10px] text-[#7A8981] hover:text-[#EF4444] transition-colors cursor-pointer text-center"
              >
                Clear Entire Project
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

