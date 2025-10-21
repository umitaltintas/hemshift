import React, { useMemo, useState, useEffect } from 'react';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarGrid, MonthGridView } from '../components/Calendar';
import BoardView from '../components/Board/BoardView';
import { useSchedule } from '../hooks/useSchedule';
import { useNurses } from '../hooks/useNurses';
import { DashboardHeader } from '../components/Dashboard/DashboardHeader';
import { DashboardStats } from '../components/Dashboard/DashboardStats';
import { DashboardWarnings } from '../components/Dashboard/DashboardWarnings';
import { ValidationResultSection } from '../components/Dashboard/ValidationResultSection';
import { ActionMessage } from '../components/Dashboard/ActionMessage';
import { ValidationResult } from '../types/entities';

const statusStyles: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-700 border-amber-200',
  published: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  archived: 'bg-gray-100 text-gray-600 border-gray-200'
};

const Dashboard: React.FC = () => {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [viewMode, setViewMode] = useState<'calendar' | 'board' | 'month-grid'>(() => {
    const saved = localStorage.getItem('dashboardViewMode');
    return (saved as 'calendar' | 'board' | 'month-grid') || 'calendar';
  });
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isExporting, setIsExporting] = useState<'excel' | 'csv' | null>(null);

  // Persist view mode to localStorage
  useEffect(() => {
    localStorage.setItem('dashboardViewMode', viewMode);
  }, [viewMode]);

  const {
    schedule,
    isLoading,
    isError,
    generateScheduleAsync,
    publishScheduleAsync,
    validateSchedule,
    exportSchedule,
    updateAssignmentAsync,
    removeAssignmentAsync
  } = useSchedule(month);
  const { nurses, isLoading: nursesLoading } = useNurses();

  const monthLabel = useMemo(() => {
    try {
      const parsed = parse(`${month}-01`, 'yyyy-MM-dd', new Date());
      return format(parsed, 'MMMM yyyy', { locale: tr });
    } catch (error) {
      return month;
    }
  }, [month]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setActionMessage(null);
    setValidationResult(null);
    try {
      await generateScheduleAsync(month);
      setActionMessage({
        type: 'success',
        text: `${monthLabel} planı başarıyla oluşturuldu`
      });
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Plan oluşturulamadı'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!schedule || schedule.status !== 'draft') return;
    setIsPublishing(true);
    setActionMessage(null);
    try {
      await publishScheduleAsync(schedule.id);
      setActionMessage({
        type: 'success',
        text: `${monthLabel} planı yayınlandı`
      });
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Plan yayınlanamadı'
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleValidate = async () => {
    if (!schedule) return;
    setIsValidating(true);
    setActionMessage(null);
    try {
      const result = await validateSchedule(schedule.id);
      setValidationResult(result);
      setActionMessage({
        type: result.isValid ? 'success' : 'error',
        text: result.isValid
          ? 'Plan tüm zorunlu kuralları sağlıyor'
          : 'Plan doğrulama sonucu hatalar içeriyor'
      });
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Doğrulama sırasında hata oluştu'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleExport = async (format: 'excel' | 'csv') => {
    if (!schedule) return;
    setIsExporting(format);
    setActionMessage(null);
    try {
      // Use mutateAsync from the mutation hook which handles the { scheduleId, format } parameter
      const blob = await exportSchedule({
        scheduleId: schedule.id,
        format
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const slug = month.replace('-', '');
      link.download = format === 'excel' ? `shift-plan-${slug}.xlsx` : `shift-plan-${slug}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setActionMessage({
        type: 'success',
        text: format === 'excel' ? 'Excel export hazırlandı' : 'CSV export hazırlandı'
      });
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Export sırasında hata oluştu'
      });
    } finally {
      setIsExporting(null);
    }
  };

  const statusBadge = schedule
    ? statusStyles[schedule.status] ?? statusStyles.draft
    : 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <div className="space-y-8">
      <DashboardHeader
        month={month}
        monthLabel={monthLabel}
        schedule={schedule}
        viewMode={viewMode}
        onMonthChange={setMonth}
        onGenerate={handleGenerate}
        onPublish={handlePublish}
        onValidate={handleValidate}
        onExport={handleExport}
        onViewModeChange={setViewMode}
        isGenerating={isGenerating}
        isPublishing={isPublishing}
        isValidating={isValidating}
        isExporting={isExporting}
      />

      <ActionMessage message={actionMessage} />

      <DashboardStats
        schedule={schedule || null}
        monthLabel={monthLabel}
        statusBadge={statusBadge}
      />

      <DashboardWarnings schedule={schedule || null} />

      <ValidationResultSection validationResult={validationResult} />

      {viewMode === 'calendar' ? (
        <CalendarGrid
          schedule={schedule}
          nurses={nurses}
          isLoading={isLoading}
          isError={isError}
          nursesLoading={nursesLoading}
          onAssign={(shiftId, nurseId) => updateAssignmentAsync({ shiftId, nurseId })}
          onRemove={(assignmentId) => removeAssignmentAsync(assignmentId)}
        />
      ) : viewMode === 'board' ? (
        <BoardView
          schedule={schedule}
          nurses={nurses}
          isLoading={isLoading}
          isError={isError}
          nursesLoading={nursesLoading}
          onAssign={(shiftId, nurseId) => updateAssignmentAsync({ shiftId, nurseId })}
          onRemove={(assignmentId) => removeAssignmentAsync(assignmentId)}
        />
      ) : (
        <MonthGridView
          schedule={schedule}
          nurses={nurses}
          isLoading={isLoading}
          isError={isError}
          nursesLoading={nursesLoading}
          onAssign={(shiftId, nurseId) => updateAssignmentAsync({ shiftId, nurseId })}
          onRemove={(assignmentId) => removeAssignmentAsync(assignmentId)}
        />
      )}
    </div>
  );
};

export default Dashboard;
