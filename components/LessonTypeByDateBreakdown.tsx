'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface FreeLessonRegistration {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  email: string;
  registered_at: string;
  notification_sent: boolean;
  lesson_type: string;
  lesson_date: string;
}

interface LessonTypeByDateBreakdownProps {
  registrations: FreeLessonRegistration[];
}

export default function LessonTypeByDateBreakdown({ registrations }: LessonTypeByDateBreakdownProps) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  // Group registrations by lesson type and lesson date
  const groupedData = registrations.reduce((acc, reg) => {
    const lessonType = reg.lesson_type || 'Unknown';
    const lessonDate = reg.lesson_date && reg.lesson_date !== 'N/A' ? reg.lesson_date : 'Дата не указана';
    
    if (!acc[lessonType]) {
      acc[lessonType] = {};
    }
    
    if (!acc[lessonType][lessonDate]) {
      acc[lessonType][lessonDate] = 0;
    }
    
    acc[lessonType][lessonDate]++;
    
    return acc;
  }, {} as Record<string, Record<string, number>>);

  const toggleExpanded = (lessonType: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(lessonType)) {
      newExpanded.delete(lessonType);
    } else {
      newExpanded.add(lessonType);
    }
    setExpandedTypes(newExpanded);
  };

  // Sort lesson types by total registrations
  const sortedLessonTypes = Object.entries(groupedData)
    .sort(([, a], [, b]) => {
      const totalA = Object.values(a).reduce((sum, count) => sum + count, 0);
      const totalB = Object.values(b).reduce((sum, count) => sum + count, 0);
      return totalB - totalA;
    });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Регистрации по датам проведения уроков</h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {sortedLessonTypes.map(([lessonType, dates]) => {
            const totalCount = Object.values(dates).reduce((sum, count) => sum + count, 0);
            const isExpanded = expandedTypes.has(lessonType);
            
            // Sort dates from newest to oldest, handling 'Дата не указана'
            const sortedDates = Object.entries(dates)
              .sort(([a], [b]) => {
                if (a === 'Дата не указана') return 1;
                if (b === 'Дата не указана') return -1;
                return b.localeCompare(a);
              });
            
            return (
              <div key={lessonType} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleExpanded(lessonType)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-900">{lessonType}</span>
                    <span className="text-sm text-gray-500">({totalCount} регистраций)</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="p-4 bg-white">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-500 border-b">
                          <th className="pb-2">Дата проведения урока</th>
                          <th className="pb-2 text-right">Записалось</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedDates.map(([date, count]) => (
                          <tr key={date} className="border-b last:border-b-0">
                            <td className="py-2 text-gray-900">
                              {date === 'Дата не указана' ? date : format(new Date(date), 'dd.MM.yyyy')}
                            </td>
                            <td className="py-2 text-right font-medium text-blue-600">
                              {count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}