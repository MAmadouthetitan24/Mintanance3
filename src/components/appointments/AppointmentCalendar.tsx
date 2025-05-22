import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { format } from 'date-fns';

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface AppointmentCalendarProps {
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: TimeSlot) => void;
  availableDates?: { [date: string]: TimeSlot[] };
  markedDates?: { [date: string]: { marked: boolean; dotColor?: string } };
  minDate?: string;
  maxDate?: string;
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  onDateSelect,
  onTimeSelect,
  availableDates = {},
  markedDates = {},
  minDate = format(new Date(), 'yyyy-MM-dd'),
  maxDate = format(new Date().setMonth(new Date().getMonth() + 3), 'yyyy-MM-dd'),
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    onDateSelect(day.dateString);
  };

  return (
    <View style={styles.container}>
      <Calendar
        current={format(new Date(), 'yyyy-MM-dd')}
        minDate={minDate}
        maxDate={maxDate}
        onDayPress={handleDayPress}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            selected: true,
            marked: markedDates[selectedDate]?.marked || false,
            dotColor: markedDates[selectedDate]?.dotColor,
          },
        }}
        // Theme customization
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#007AFF',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#007AFF',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#007AFF',
          selectedDotColor: '#ffffff',
          arrowColor: '#007AFF',
          monthTextColor: '#2d4150',
          textDayFontFamily: 'System',
          textMonthFontFamily: 'System',
          textDayHeaderFontFamily: 'System',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 13,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
}); 