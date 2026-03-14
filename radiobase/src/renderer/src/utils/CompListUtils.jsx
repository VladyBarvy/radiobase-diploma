// renderer/src/utils/CompListUtils.js
import React, { useRef, useEffect } from 'react';

// ===== ХУКИ ДЛЯ ОТЛАДКИ =====
export const useRenderDebug = (componentName, props) => {
  const renderCount = useRef(0);
  const prevProps = useRef({});

  useEffect(() => {
    renderCount.current += 1;

    if (process.env.NODE_ENV !== 'production') {
      console.group(`🔄 ${componentName} Render #${renderCount.current}`);
      console.log('📅 Timestamp:', new Date().toLocaleTimeString());

      const changedProps = Object.keys(props).filter(key =>
        props[key] !== prevProps.current[key]
      );

      if (changedProps.length > 0) {
        console.log('📊 Changed props:', changedProps);
        changedProps.forEach(prop => {
          console.log(`   ${prop}:`, {
            from: prevProps.current[prop],
            to: props[prop]
          });
        });
      } else {
        console.log('✅ No props changed (likely internal state update)');
      }

      console.groupEnd();
    }

    prevProps.current = { ...props };
  });
};

// ===== УТИЛИТА ДЛЯ ЗАМЕРА ПРОИЗВОДИТЕЛЬНОСТИ =====
export const createPerformanceMeasure = (operationName) => {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`⏱️ ${operationName}: ${duration.toFixed(2)}ms`);

      if (duration > 16) {
        console.warn(`🐢 Slow operation detected: ${operationName}`);
      }
    }

    return duration;
  };
};

// ===== КЕШ ДЛЯ ФОРМАТИРОВАННЫХ ДАТ =====
const dateFormatCache = new Map();

export const formatDateOptimized = (dateString) => {
  if (!dateString) return 'Не обновлялся';

  if (dateFormatCache.has(dateString)) {
    return dateFormatCache.get(dateString);
  }

  try {
    const date = new Date(dateString);

    // Упрощенный формат без локализации
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    const result = `${day}.${month}.${year} ${hours}:${minutes}`;

    dateFormatCache.set(dateString, result);
    return result;
  } catch {
    return dateString;
  }
};

// ===== МЕМОИЗИРОВАННЫЙ КОМПОНЕНТ ДЛЯ ТАБЛИЦЫ ПАРАМЕТРОВ =====
export const ParametersTable = React.memo(({ parameters }) => {
  if (Object.keys(parameters).length === 0) {
    return (
      <div className="no-parameters">
        <i className="fas fa-info-circle me-2"></i>
        Параметры не указаны
      </div>
    );
  }

  return (
    <div className="new-parameters-container">
      <table className="new-parameters-table">
        <thead>
          <tr>
            <th className="new-param-name-header">Параметр</th>
            <th className="new-param-value-header">Значение</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(parameters).map(([key, value]) => (
            <tr key={key}>
              <td className="new-param-name-cell">{key}</td>
              <td className="new-param-value-cell">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
