import React from 'react';
import { AgendaCalendarView, AgendaCalendarViewProps } from './AgendaCalendarView';

export type CalendarViewProps = AgendaCalendarViewProps;

export const CalendarView: React.FC<CalendarViewProps> = (props) => {
  return <AgendaCalendarView {...props} />;
};

export default CalendarView;
